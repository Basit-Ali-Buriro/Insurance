'use strict';
const { ipcMain, shell, dialog, app } = require('electron');
const path   = require('path');
const fs     = require('fs');
const bcrypt = require('bcrypt');

const { getDb, decryptRow, seedSampleData }  = require('./database');
const { encrypt, decrypt }   = require('./crypto');
const { getLogger }          = require('./logger');
const { checkLicense, renewLicense } = require('./licenseManager');

/* ─── Encrypted field maps per table ─── */
const ENC = {
  Users:            ['name', 'username'],
  Area_Managers:    ['am_name', 'cnic', 'address', 'contact_1', 'contact_2'],
  SSM:              ['ssm_name', 'cnic', 'address', 'contact_1', 'contact_2'],
  SM:               ['sm_name',  'cnic', 'address', 'contact_1', 'contact_2'],
  SR:               ['sr_name',  'cnic', 'address', 'contact_1', 'contact_2'],
  Proposer_Register:['holder_name', 'pr_no'],
  Policy_Register:  ['holder_name', 'cnic', 'address', 'contact_1', 'contact_2', 'policy_no'],
};

function log() { return getLogger(); }

/* ──────────────────────────── AUTH ──────────────────────────── */
function handleAuth() {
  ipcMain.handle('auth:login', async (_e, { username, password }) => {
    const db = getDb();
    try {
      const rows = db.prepare('SELECT * FROM Users WHERE status = ?').all('active');
      for (const row of rows) {
        const decName = decrypt(row.username);
        if (decName === username) {
          const ok = await bcrypt.compare(password, row.password_hash);
          if (ok) {
            log().info(`Login success — user: ${username}, role: ${row.role}`);
            return { ok: true, user: { id: row.user_id, name: decrypt(row.name), username: decName, role: row.role } };
          }
        }
      }
      log().warn(`Login failed — username: ${username}`);
      return { ok: false, error: 'Invalid credentials, please try again.' };
    } catch (err) {
      log().error(`Login error: ${err.message}`);
      return { ok: false, error: 'An error occurred. Please try again.' };
    }
  });
}

/* ──────────────────────────── LICENSE ──────────────────────────── */
function handleLicense() {
  ipcMain.handle('license:check', () => checkLicense());
  ipcMain.handle('license:renew', (_e, key) => renewLicense(key));
}

/* ──────────────────────────── USERS ──────────────────────────── */
function handleUsers() {
  ipcMain.handle('users:list', () => {
    const rows = getDb().prepare('SELECT user_id, name, username, role, status, created_at FROM Users ORDER BY user_id').all();
    return rows.map(r => decryptRow(r, ['name', 'username']));
  });

  ipcMain.handle('users:create', async (_e, { name, username, password, role, status }) => {
    const db   = getDb();
    const hash = await bcrypt.hash(password, 10);
    try {
      db.prepare('INSERT INTO Users (name, username, password_hash, role, status) VALUES (?,?,?,?,?)')
        .run(encrypt(name), encrypt(username), hash, role, status);
      log().info(`User created: ${username}`);
      return { ok: true };
    } catch (err) {
      return { ok: false, error: err.message };
    }
  });

  ipcMain.handle('users:update', async (_e, { id, name, username, role, status, password }) => {
    const db = getDb();
    try {
      if (password) {
        const hash = await bcrypt.hash(password, 10);
        db.prepare('UPDATE Users SET name=?, username=?, role=?, status=?, password_hash=? WHERE user_id=?')
          .run(encrypt(name), encrypt(username), role, status, hash, id);
      } else {
        db.prepare('UPDATE Users SET name=?, username=?, role=?, status=? WHERE user_id=?')
          .run(encrypt(name), encrypt(username), role, status, id);
      }
      log().info(`User updated: id=${id}`);
      return { ok: true };
    } catch (err) {
      return { ok: false, error: err.message };
    }
  });

  ipcMain.handle('users:delete', (_e, id) => {
    const db = getDb();
    const row = db.prepare('SELECT role FROM Users WHERE user_id=?').get(id);
    if (!row || row.role === 'developer') return { ok: false, error: 'Cannot delete this account.' };
    db.prepare('DELETE FROM Users WHERE user_id=?').run(id);
    log().info(`User deleted: id=${id}`);
    return { ok: true };
  });

  ipcMain.handle('users:changePassword', async (_e, { id, currentPassword, newPassword }) => {
    const db  = getDb();
    const row = db.prepare('SELECT password_hash FROM Users WHERE user_id=?').get(id);
    if (!row) return { ok: false, error: 'User not found.' };
    const ok = await bcrypt.compare(currentPassword, row.password_hash);
    if (!ok) return { ok: false, error: 'Current password is incorrect.' };
    const hash = await bcrypt.hash(newPassword, 10);
    db.prepare('UPDATE Users SET password_hash=? WHERE user_id=?').run(hash, id);
    log().info(`Password changed: id=${id}`);
    return { ok: true };
  });

  ipcMain.handle('users:updateProfile', (_e, { id, name, username }) => {
    const db = getDb();
    try {
      // Check username uniqueness
      const existing = getDb().prepare('SELECT * FROM Users').all();
      for (const r of existing) {
        if (r.user_id !== id && decrypt(r.username) === username) {
          return { ok: false, error: 'Username already taken.' };
        }
      }
      db.prepare('UPDATE Users SET name=?, username=? WHERE user_id=?')
        .run(encrypt(name), encrypt(username), id);
      log().info(`Profile updated: id=${id}`);
      return { ok: true };
    } catch (err) {
      return { ok: false, error: err.message };
    }
  });
}

/* ──────────────────────────── AREA MANAGERS ──────────────────────────── */
function handleAreaManagers() {
  const fields = ENC.Area_Managers;

  ipcMain.handle('am:list', () => {
    const db  = getDb();
    const rows = db.prepare('SELECT * FROM Area_Managers ORDER BY id').all();
    return rows.map(r => ({
      ...decryptRow(r, fields),
      no_of_ssms: db.prepare('SELECT COUNT(*) as c FROM SSM WHERE am_id=?').get(r.id)?.c ?? 0,
      no_of_sms:  db.prepare('SELECT COUNT(*) as c FROM SM  WHERE am_id=?').get(r.id)?.c ?? 0,
      no_of_srs:  db.prepare('SELECT COUNT(*) as c FROM SR  WHERE am_id=?').get(r.id)?.c ?? 0,
      total_business: db.prepare(`SELECT COALESCE(SUM(pr.premium),0) as t FROM Policy_Register pr
        JOIN SR sr ON pr.sr_id=sr.id WHERE sr.am_id=?`).get(r.id)?.t ?? 0,
    }));
  });

  ipcMain.handle('am:create', (_e, data) => {
    const db = getDb();
    try {
      db.prepare('INSERT INTO Area_Managers (am_code,am_name,address,cnic,contact_1,contact_2,status) VALUES (?,?,?,?,?,?,?)')
        .run(data.am_code, encrypt(data.am_name), encrypt(data.address), encrypt(data.cnic), encrypt(data.contact_1), encrypt(data.contact_2), data.status || 'active');
      log().info(`AM created: ${data.am_code}`);
      return { ok: true };
    } catch (err) { return { ok: false, error: err.message }; }
  });

  ipcMain.handle('am:update', (_e, data) => {
    const db = getDb();
    try {
      db.prepare('UPDATE Area_Managers SET am_code=?,am_name=?,address=?,cnic=?,contact_1=?,contact_2=?,status=? WHERE id=?')
        .run(data.am_code, encrypt(data.am_name), encrypt(data.address), encrypt(data.cnic), encrypt(data.contact_1), encrypt(data.contact_2), data.status, data.id);
      return { ok: true };
    } catch (err) { return { ok: false, error: err.message }; }
  });

  ipcMain.handle('am:delete', (_e, id) => {
    const db = getDb();
    try {
      db.transaction(() => {
        db.prepare('UPDATE SSM SET am_id = NULL WHERE am_id = ?').run(id);
        db.prepare('UPDATE SM SET am_id = NULL WHERE am_id = ?').run(id);
        db.prepare('UPDATE SR SET am_id = NULL WHERE am_id = ?').run(id);
        db.prepare('DELETE FROM Area_Managers WHERE id = ?').run(id);
      })();
      return { ok: true };
    } catch (err) { return { ok: false, error: err.message }; }
  });
}

/* ──────────────────────────── SSM ──────────────────────────── */
function handleSSM() {
  const fields = ENC.SSM;

  ipcMain.handle('ssm:list', () => {
    const db   = getDb();
    const rows = db.prepare('SELECT ssm.*, am.am_code FROM SSM ssm LEFT JOIN Area_Managers am ON ssm.am_id=am.id ORDER BY ssm.id').all();
    return rows.map(r => ({
      ...decryptRow(r, fields),
      no_of_sms: db.prepare('SELECT COUNT(*) as c FROM SM WHERE ssm_id=?').get(r.id)?.c ?? 0,
      no_of_srs: db.prepare('SELECT COUNT(*) as c FROM SR WHERE ssm_id=?').get(r.id)?.c ?? 0,
      total_business: db.prepare(`SELECT COALESCE(SUM(pr.premium),0) as t FROM Policy_Register pr
        JOIN SR sr ON pr.sr_id=sr.id WHERE sr.ssm_id=?`).get(r.id)?.t ?? 0,
    }));
  });

  ipcMain.handle('ssm:create', (_e, data) => {
    const db = getDb();
    try {
      db.prepare(`INSERT INTO SSM (ssm_code,ssm_name,address,cnic,contact_1,contact_2,am_id,status,cnic_pic,nominee_cnic_pic,matric_cert,intermediate_cert,degree_cert)
        VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)`)
        .run(data.ssm_code, encrypt(data.ssm_name), encrypt(data.address), encrypt(data.cnic), encrypt(data.contact_1), encrypt(data.contact_2), data.am_id || null, data.status || 'active',
          data.cnic_pic || null, data.nominee_cnic_pic || null, data.matric_cert || null, data.intermediate_cert || null, data.degree_cert || null);
      log().info(`SSM created: ${data.ssm_code}`);
      return { ok: true };
    } catch (err) { return { ok: false, error: err.message }; }
  });

  ipcMain.handle('ssm:update', (_e, data) => {
    const db = getDb();
    try {
      db.prepare(`UPDATE SSM SET ssm_code=?,ssm_name=?,address=?,cnic=?,contact_1=?,contact_2=?,am_id=?,status=?,
        cnic_pic=?,nominee_cnic_pic=?,matric_cert=?,intermediate_cert=?,degree_cert=? WHERE id=?`)
        .run(data.ssm_code, encrypt(data.ssm_name), encrypt(data.address), encrypt(data.cnic), encrypt(data.contact_1), encrypt(data.contact_2), data.am_id || null, data.status,
          data.cnic_pic || null, data.nominee_cnic_pic || null, data.matric_cert || null, data.intermediate_cert || null, data.degree_cert || null, data.id);
      return { ok: true };
    } catch (err) { return { ok: false, error: err.message }; }
  });

  ipcMain.handle('ssm:delete', (_e, id) => {
    const db = getDb();
    try {
      db.transaction(() => {
        db.prepare('UPDATE SM SET ssm_id = NULL WHERE ssm_id = ?').run(id);
        db.prepare('UPDATE SR SET ssm_id = NULL WHERE ssm_id = ?').run(id);
        db.prepare('UPDATE Proposer_Register SET ssm_id = NULL WHERE ssm_id = ?').run(id);
        db.prepare('UPDATE Policy_Register SET ssm_id = NULL WHERE ssm_id = ?').run(id);
        db.prepare('UPDATE Second_Year_Log SET ssm_id = NULL WHERE ssm_id = ?').run(id);
        db.prepare('DELETE FROM SSM WHERE id = ?').run(id);
      })();
      return { ok: true };
    } catch (err) { return { ok: false, error: err.message }; }
  });
}

/* ──────────────────────────── SM ──────────────────────────── */
function handleSM() {
  const fields = ENC.SM;

  ipcMain.handle('sm:list', () => {
    const db   = getDb();
    const rows = db.prepare('SELECT sm.*, ssm.ssm_code, am.am_code FROM SM sm LEFT JOIN SSM ssm ON sm.ssm_id=ssm.id LEFT JOIN Area_Managers am ON sm.am_id=am.id ORDER BY sm.id').all();
    return rows.map(r => ({
      ...decryptRow(r, fields),
      no_of_srs: db.prepare('SELECT COUNT(*) as c FROM SR WHERE sm_id=?').get(r.id)?.c ?? 0,
      total_business: db.prepare(`SELECT COALESCE(SUM(pr.premium),0) as t FROM Policy_Register pr
        JOIN SR sr ON pr.sr_id=sr.id WHERE sr.sm_id=?`).get(r.id)?.t ?? 0,
    }));
  });

  ipcMain.handle('sm:create', (_e, data) => {
    const db = getDb();
    try {
      db.prepare(`INSERT INTO SM (sm_code,sm_name,address,cnic,contact_1,contact_2,ssm_id,am_id,status,cnic_pic,nominee_cnic_pic,matric_cert,intermediate_cert,degree_cert)
        VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)`)
        .run(data.sm_code, encrypt(data.sm_name), encrypt(data.address), encrypt(data.cnic), encrypt(data.contact_1), encrypt(data.contact_2), data.ssm_id || null, data.am_id || null, data.status || 'active',
          data.cnic_pic || null, data.nominee_cnic_pic || null, data.matric_cert || null, data.intermediate_cert || null, data.degree_cert || null);
      log().info(`SM created: ${data.sm_code}`);
      return { ok: true };
    } catch (err) { return { ok: false, error: err.message }; }
  });

  ipcMain.handle('sm:update', (_e, data) => {
    const db = getDb();
    try {
      db.prepare(`UPDATE SM SET sm_code=?,sm_name=?,address=?,cnic=?,contact_1=?,contact_2=?,ssm_id=?,am_id=?,status=?,
        cnic_pic=?,nominee_cnic_pic=?,matric_cert=?,intermediate_cert=?,degree_cert=? WHERE id=?`)
        .run(data.sm_code, encrypt(data.sm_name), encrypt(data.address), encrypt(data.cnic), encrypt(data.contact_1), encrypt(data.contact_2), data.ssm_id || null, data.am_id || null, data.status,
          data.cnic_pic || null, data.nominee_cnic_pic || null, data.matric_cert || null, data.intermediate_cert || null, data.degree_cert || null, data.id);
      return { ok: true };
    } catch (err) { return { ok: false, error: err.message }; }
  });

  ipcMain.handle('sm:delete', (_e, id) => {
    const db = getDb();
    try {
      db.transaction(() => {
        db.prepare('UPDATE SR SET sm_id = NULL WHERE sm_id = ?').run(id);
        db.prepare('UPDATE Proposer_Register SET sm_id = NULL WHERE sm_id = ?').run(id);
        db.prepare('UPDATE Policy_Register SET sm_id = NULL WHERE sm_id = ?').run(id);
        db.prepare('UPDATE Second_Year_Log SET sm_id = NULL WHERE sm_id = ?').run(id);
        db.prepare('DELETE FROM SM WHERE id = ?').run(id);
      })();
      return { ok: true };
    } catch (err) { return { ok: false, error: err.message }; }
  });
}

/* ──────────────────────────── SR ──────────────────────────── */
function handleSR() {
  const fields = ENC.SR;

  ipcMain.handle('sr:list', () => {
    const db   = getDb();
    const rows = db.prepare('SELECT sr.*, sm.sm_code, ssm.ssm_code, am.am_code FROM SR sr LEFT JOIN SM sm ON sr.sm_id=sm.id LEFT JOIN SSM ssm ON sr.ssm_id=ssm.id LEFT JOIN Area_Managers am ON sr.am_id=am.id ORDER BY sr.id').all();
    return rows.map(r => ({
      ...decryptRow(r, fields),
      no_of_policies: db.prepare('SELECT COUNT(*) as c FROM Policy_Register WHERE sr_id=?').get(r.id)?.c ?? 0,
    }));
  });

  ipcMain.handle('sr:create', (_e, data) => {
    const db = getDb();
    try {
      db.prepare(`INSERT INTO SR (sr_code,sr_name,address,cnic,contact_1,contact_2,sm_id,ssm_id,am_id,status,cnic_pic,nominee_cnic_pic,matric_cert,intermediate_cert,degree_cert)
        VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`)
        .run(data.sr_code, encrypt(data.sr_name), encrypt(data.address), encrypt(data.cnic), encrypt(data.contact_1), encrypt(data.contact_2), data.sm_id || null, data.ssm_id || null, data.am_id || null, data.status || 'active',
          data.cnic_pic || null, data.nominee_cnic_pic || null, data.matric_cert || null, data.intermediate_cert || null, data.degree_cert || null);
      log().info(`SR created: ${data.sr_code}`);
      return { ok: true };
    } catch (err) { return { ok: false, error: err.message }; }
  });

  ipcMain.handle('sr:update', (_e, data) => {
    const db = getDb();
    try {
      db.prepare(`UPDATE SR SET sr_code=?,sr_name=?,address=?,cnic=?,contact_1=?,contact_2=?,sm_id=?,ssm_id=?,am_id=?,status=?,
        cnic_pic=?,nominee_cnic_pic=?,matric_cert=?,intermediate_cert=?,degree_cert=? WHERE id=?`)
        .run(data.sr_code, encrypt(data.sr_name), encrypt(data.address), encrypt(data.cnic), encrypt(data.contact_1), encrypt(data.contact_2), data.sm_id || null, data.ssm_id || null, data.am_id || null, data.status,
          data.cnic_pic || null, data.nominee_cnic_pic || null, data.matric_cert || null, data.intermediate_cert || null, data.degree_cert || null, data.id);
      return { ok: true };
    } catch (err) { return { ok: false, error: err.message }; }
  });

  ipcMain.handle('sr:delete', (_e, id) => {
    const db = getDb();
    try {
      db.transaction(() => {
        db.prepare('UPDATE Proposer_Register SET sr_id = NULL WHERE sr_id = ?').run(id);
        db.prepare('UPDATE Policy_Register SET sr_id = NULL WHERE sr_id = ?').run(id);
        db.prepare('UPDATE Second_Year_Log SET sr_id = NULL WHERE sr_id = ?').run(id);
        db.prepare('DELETE FROM SR WHERE id = ?').run(id);
      })();
      return { ok: true };
    } catch (err) { return { ok: false, error: err.message }; }
  });

  // Image upload
  ipcMain.handle('sr:uploadImage', async (_e, { sr_code, fieldName }) => {
    const result = await dialog.showOpenDialog({ properties: ['openFile'], filters: [{ name: 'Images', extensions: ['jpg','jpeg','png','webp'] }] });
    if (result.canceled) return null;
    const src  = result.filePaths[0];
    const dir  = path.join(app.getPath('userData'), 'images', 'sr', sr_code);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    const dest = path.join(dir, `${fieldName}${path.extname(src)}`);
    fs.copyFileSync(src, dest);
    return dest;
  });

  // Unified recruitment files upload (documents and images)
  ipcMain.handle('recruitment:uploadFile', async (_e, { code, fieldName }) => {
    try {
      const result = await dialog.showOpenDialog({
        properties: ['openFile'],
        filters: [
          { name: 'All Supported Files', extensions: ['jpg', 'jpeg', 'png', 'webp', 'pdf', 'doc', 'docx'] },
          { name: 'Images', extensions: ['jpg', 'jpeg', 'png', 'webp'] },
          { name: 'Documents', extensions: ['pdf', 'doc', 'docx'] }
        ]
      });
      if (result.canceled) return null;
      const src  = result.filePaths[0];
      const dir  = path.join(app.getPath('userData'), 'recruitment_files', code || 'temp');
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

      // Clean up any existing file with same fieldName but potentially different extension
      if (fs.existsSync(dir)) {
        const files = fs.readdirSync(dir);
        for (const file of files) {
          if (file.startsWith(fieldName + '.')) {
            fs.unlinkSync(path.join(dir, file));
          }
        }
      }

      const dest = path.join(dir, `${fieldName}${path.extname(src)}`);
      fs.copyFileSync(src, dest);
      return dest;
    } catch (err) {
      log().error(`Failed to upload recruitment file: ${err.message}`);
      throw err;
    }
  });
}

/* ──────────────────────────── PROPOSER REGISTER ──────────────────────────── */
function handleProposer() {
  const fields = ENC.Proposer_Register;

  ipcMain.handle('proposer:list', () => {
    const db   = getDb();
    const rows = db.prepare(`SELECT p.*, sr.sr_code, sm.sm_code, ssm.ssm_code FROM Proposer_Register p
      LEFT JOIN SR sr ON p.sr_id=sr.id LEFT JOIN SM sm ON p.sm_id=sm.id LEFT JOIN SSM ssm ON p.ssm_id=ssm.id
      ORDER BY p.id DESC`).all();
    return rows.map(r => decryptRow(r, fields));
  });

  ipcMain.handle('proposer:create', (_e, data) => {
    const db = getDb();
    try {
      db.prepare(`INSERT INTO Proposer_Register (proposal_no,holder_name,premium,pr_no,pr_date,amount_type,requirements,sr_id,sm_id,ssm_id,status)
        VALUES (?,?,?,?,?,?,?,?,?,?,?)`)
        .run(data.proposal_no, encrypt(data.holder_name), data.premium, encrypt(data.pr_no), data.pr_date, data.amount_type, data.requirements, data.sr_id || null, data.sm_id || null, data.ssm_id || null, data.status || 'not_ok');
      log().info(`Proposer created: ${data.proposal_no}`);
      return { ok: true };
    } catch (err) { return { ok: false, error: err.message }; }
  });

  ipcMain.handle('proposer:update', (_e, data) => {
    const db = getDb();
    try {
      db.prepare(`UPDATE Proposer_Register SET proposal_no=?,holder_name=?,premium=?,pr_no=?,pr_date=?,amount_type=?,requirements=?,sr_id=?,sm_id=?,ssm_id=?,status=? WHERE id=?`)
        .run(data.proposal_no, encrypt(data.holder_name), data.premium, encrypt(data.pr_no), data.pr_date, data.amount_type, data.requirements, data.sr_id || null, data.sm_id || null, data.ssm_id || null, data.status, data.id);
      return { ok: true };
    } catch (err) { return { ok: false, error: err.message }; }
  });

  ipcMain.handle('proposer:delete', (_e, id) => {
    const db = getDb();
    try {
      db.transaction(() => {
        db.prepare('UPDATE Policy_Register SET proposal_id = NULL WHERE proposal_id = ?').run(id);
        db.prepare('DELETE FROM Proposer_Register WHERE id = ?').run(id);
      })();
      return { ok: true };
    } catch (err) { return { ok: false, error: err.message }; }
  });

  ipcMain.handle('proposer:convertToPolicy', (_e, id) => {
    const db = getDb();
    const prop = decryptRow(db.prepare('SELECT * FROM Proposer_Register WHERE id=?').get(id), ENC.Proposer_Register);
    if (!prop) return { ok: false, error: 'Proposal not found.' };
    if (prop.converted_to_policy) return { ok: false, error: 'Already converted.' };
    db.prepare('UPDATE Proposer_Register SET converted_to_policy=1, status=? WHERE id=?').run('ok', id);
    log().info(`Proposal ${prop.proposal_no} converted to policy`);
    return { ok: true, prefill: { holder_name: prop.holder_name, premium: prop.premium, sr_id: prop.sr_id, sm_id: prop.sm_id, ssm_id: prop.ssm_id, proposal_id: id } };
  });
}

/* ──────────────────────────── POLICY REGISTER ──────────────────────────── */
function handlePolicy() {
  const fields = ENC.Policy_Register;

  ipcMain.handle('policy:list', (_e, filters = {}) => {
    const db   = getDb();
    let   sql  = `SELECT p.*, sr.sr_code, sm.sm_code, ssm.ssm_code FROM Policy_Register p
      LEFT JOIN SR sr ON p.sr_id=sr.id LEFT JOIN SM sm ON p.sm_id=sm.id LEFT JOIN SSM ssm ON p.ssm_id=ssm.id
      ORDER BY p.id DESC`;
    const rows = db.prepare(sql).all();
    return rows.map(r => decryptRow(r, fields));
  });

  ipcMain.handle('policy:create', (_e, data) => {
    const db = getDb();
    try {
      db.prepare(`INSERT INTO Policy_Register (policy_no,holder_name,cnic,address,contact_1,contact_2,premium,issue_date,due_date,table_term,last_paid_date,sr_id,sm_id,ssm_id,proposal_id)
        VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`)
        .run(encrypt(data.policy_no), encrypt(data.holder_name), encrypt(data.cnic), encrypt(data.address), encrypt(data.contact_1), encrypt(data.contact_2),
          data.premium, data.issue_date, data.due_date, data.table_term, data.last_paid_date,
          data.sr_id || null, data.sm_id || null, data.ssm_id || null, data.proposal_id || null);
      log().info(`Policy created: ${data.policy_no}`);
      return { ok: true };
    } catch (err) { return { ok: false, error: err.message }; }
  });

  ipcMain.handle('policy:update', (_e, data) => {
    const db  = getDb();
    const old = db.prepare('SELECT last_paid_date, sr_id, sm_id, ssm_id, premium FROM Policy_Register WHERE id=?').get(data.id);
    try {
      // 2nd year premium detection
      if (old && old.last_paid_date && data.last_paid_date) {
        const oldYear = new Date(old.last_paid_date).getFullYear();
        const newYear = new Date(data.last_paid_date).getFullYear();
        if (newYear > oldYear) {
          const prem = old.premium;
          const today = new Date().toISOString().split('T')[0];
          if (old.sr_id)  db.prepare('UPDATE SR  SET second_year_premium=second_year_premium+? WHERE id=?').run(prem, old.sr_id);
          if (old.sm_id)  db.prepare('UPDATE SM  SET second_year_premium=second_year_premium+? WHERE id=?').run(prem, old.sm_id);
          if (old.ssm_id) db.prepare('UPDATE SSM SET second_year_premium=second_year_premium+? WHERE id=?').run(prem, old.ssm_id);
          db.prepare('INSERT INTO Second_Year_Log (policy_id,sr_id,sm_id,ssm_id,premium,detected_at) VALUES (?,?,?,?,?,?)')
            .run(data.id, old.sr_id, old.sm_id, old.ssm_id, prem, today);
          log().info(`2nd year premium detected for policy id=${data.id}, amount=${prem}`);
        }
      }
      db.prepare(`UPDATE Policy_Register SET policy_no=?,holder_name=?,cnic=?,address=?,contact_1=?,contact_2=?,premium=?,issue_date=?,due_date=?,table_term=?,last_paid_date=?,previous_paid_date=?,sr_id=?,sm_id=?,ssm_id=? WHERE id=?`)
        .run(encrypt(data.policy_no), encrypt(data.holder_name), encrypt(data.cnic), encrypt(data.address), encrypt(data.contact_1), encrypt(data.contact_2),
          data.premium, data.issue_date, data.due_date, data.table_term, data.last_paid_date, old?.last_paid_date || null,
          data.sr_id || null, data.sm_id || null, data.ssm_id || null, data.id);
      return { ok: true };
    } catch (err) { return { ok: false, error: err.message }; }
  });

  ipcMain.handle('policy:delete', (_e, id) => {
    const db = getDb();
    try {
      db.transaction(() => {
        db.prepare('DELETE FROM Notifications WHERE policy_id=?').run(id);
        db.prepare('DELETE FROM Second_Year_Log WHERE policy_id=?').run(id);
        db.prepare('DELETE FROM Policy_Register WHERE id=?').run(id);
      })();
      log().info(`Policy deleted: id=${id}`);
      return { ok: true };
    } catch (err) {
      log().error(`Failed to delete policy id=${id}: ${err.message}`);
      return { ok: false, error: err.message };
    }
  });
}

/* ──────────────────────────── NOTIFICATIONS ──────────────────────────── */
function handleNotifications() {
  ipcMain.handle('notifications:list', () => {
    const db   = getDb();
    const today = new Date().toISOString().split('T')[0];
    const rows  = db.prepare(`SELECT p.id, p.policy_no, p.holder_name, p.contact_1, p.due_date,
        sr.sr_code, sr.sr_name, n.whatsapp_sent, n.whatsapp_sent_at,
        julianday(p.due_date) - julianday(?) as days_left
      FROM Policy_Register p
      JOIN Notifications n ON n.policy_id=p.id
      LEFT JOIN SR sr ON p.sr_id=sr.id
      WHERE p.due_date BETWEEN ? AND date(?,'+30 days')
        AND (p.last_paid_date IS NULL OR p.last_paid_date < p.due_date)
      ORDER BY days_left ASC`).all(today, today, today);
    return rows.map(r => decryptRow(r, ['holder_name', 'contact_1', 'policy_no', 'sr_name']));
  });

  ipcMain.handle('notifications:count', () => {
    const db   = getDb();
    const today = new Date().toISOString().split('T')[0];
    const { c } = db.prepare(`SELECT COUNT(*) as c FROM Policy_Register p
      WHERE p.due_date BETWEEN ? AND date(?,'+30 days')
        AND (p.last_paid_date IS NULL OR p.last_paid_date < p.due_date)`).get(today, today);
    return c;
  });

  ipcMain.handle('notifications:markWhatsapp', (_e, policyId) => {
    const now = new Date().toISOString();
    getDb().prepare('UPDATE Notifications SET whatsapp_sent=1, whatsapp_sent_at=? WHERE policy_id=?').run(now, policyId);
    return { ok: true };
  });

  ipcMain.handle('notifications:openWhatsapp', (_e, { phone, name, policyNo, dueDate }) => {
    const msg = encodeURIComponent(`Assalam o Alaikum ${name}, your insurance policy installment (Policy No: ${policyNo}) is due on ${dueDate}. Please make the payment at your earliest. Thank you.`);
    const clean = phone.replace(/\D/g, '');
    const url   = `https://wa.me/${clean.startsWith('0') ? '92' + clean.slice(1) : clean}?text=${msg}`;
    shell.openExternal(url);
    return { ok: true };
  });
}

/* ──────────────────────────── DASHBOARD ──────────────────────────── */
function handleDashboard() {
  ipcMain.handle('dashboard:kpis', () => {
    const db    = getDb();
    const today = new Date();
    const m     = today.getMonth() + 1;
    const y     = today.getFullYear();
    const monthStart = `${y}-${String(m).padStart(2,'0')}-01`;
    const prevM = m === 1 ? 12 : m - 1;
    const prevY = m === 1 ? y - 1 : y;
    const prevMonthStart = `${prevY}-${String(prevM).padStart(2,'0')}-01`;
    const prevMonthEnd   = `${y}-${String(m).padStart(2,'0')}-01`;

    const totalPolicies   = db.prepare('SELECT COUNT(*) as c FROM Policy_Register').get().c;
    const totalProposals  = db.prepare('SELECT COUNT(*) as c FROM Proposer_Register').get().c;
    const totalSRs        = db.prepare('SELECT COUNT(*) as c FROM SR').get().c;
    const totalSMs        = db.prepare('SELECT COUNT(*) as c FROM SM').get().c;
    const totalSSMs       = db.prepare('SELECT COUNT(*) as c FROM SSM').get().c;

    const currentMonthPrem = db.prepare(`SELECT COALESCE(SUM(premium),0) as t FROM Policy_Register WHERE strftime('%Y-%m', issue_date)=strftime('%Y-%m',?)`).get(monthStart).t;
    const prevMonthPrem    = db.prepare(`SELECT COALESCE(SUM(premium),0) as t FROM Policy_Register WHERE issue_date >= ? AND issue_date < ?`).get(prevMonthStart, prevMonthEnd).t;
    const ytdPrem          = db.prepare(`SELECT COALESCE(SUM(premium),0) as t FROM Policy_Register WHERE strftime('%Y',issue_date)=?`).get(String(y)).t;

    const todayStr  = today.toISOString().split('T')[0];
    const due7  = db.prepare(`SELECT COUNT(*) as c FROM Policy_Register WHERE due_date BETWEEN ? AND date(?,'+7 days') AND (last_paid_date IS NULL OR last_paid_date < due_date)`).get(todayStr, todayStr).c;
    const due15 = db.prepare(`SELECT COUNT(*) as c FROM Policy_Register WHERE due_date BETWEEN ? AND date(?,'+15 days') AND (last_paid_date IS NULL OR last_paid_date < due_date)`).get(todayStr, todayStr).c;
    const due30 = db.prepare(`SELECT COUNT(*) as c FROM Policy_Register WHERE due_date BETWEEN ? AND date(?,'+30 days') AND (last_paid_date IS NULL OR last_paid_date < due_date)`).get(todayStr, todayStr).c;

    const renewals = db.prepare(`SELECT COUNT(*) as c FROM Policy_Register WHERE last_paid_date <= date('now','-11 months')`).get().c;

    // Trailing 12 months chart
    const monthlyChart = [];
    const tempDate = new Date();
    for (let i = 11; i >= 0; i--) {
      const d = new Date(tempDate.getFullYear(), tempDate.getMonth() - i, 1);
      const year = d.getFullYear();
      const month = d.getMonth() + 1;
      const monthStr = `${year}-${String(month).padStart(2, '0')}`;
      const t = db.prepare(`SELECT COALESCE(SUM(premium),0) as t FROM Policy_Register WHERE strftime('%Y-%m',issue_date)=?`).get(monthStr).t;
      monthlyChart.push({ month, year, premium: t });
    }

    // Top SR & SM this month
    const srRows = db.prepare(`SELECT sr.id, sr.sr_name, sr.sr_code, COALESCE(SUM(p.premium),0) as biz
      FROM SR sr LEFT JOIN Policy_Register p ON p.sr_id=sr.id AND strftime('%Y-%m',p.issue_date)=strftime('%Y-%m',?)
      GROUP BY sr.id ORDER BY biz DESC LIMIT 1`).get(monthStart);
    const smRows = db.prepare(`SELECT sm.id, sm.sm_name, sm.sm_code, COALESCE(SUM(p.premium),0) as biz
      FROM SM sm LEFT JOIN SR sr ON sr.sm_id=sm.id LEFT JOIN Policy_Register p ON p.sr_id=sr.id AND strftime('%Y-%m',p.issue_date)=strftime('%Y-%m',?)
      GROUP BY sm.id ORDER BY biz DESC LIMIT 1`).get(monthStart);

    const config = {};
    const cfgRows = db.prepare('SELECT key, value FROM Config').all();
    cfgRows.forEach(r => { config[r.key] = r.value; });

    return {
      totalPolicies, totalProposals, totalSRs, totalSMs, totalSSMs,
      currentMonthPrem, prevMonthPrem, ytdPrem,
      due7, due15, due30,
      renewals, monthlyChart,
      topSR: srRows ? { ...srRows, sr_name: decrypt(srRows.sr_name) } : null,
      topSM: smRows ? { ...smRows, sm_name: decrypt(smRows.sm_name) } : null,
      config,
    };
  });

  ipcMain.handle('dashboard:saveTarget', (_e, { key, value }) => {
    getDb().prepare('INSERT OR REPLACE INTO Config (key, value) VALUES (?,?)').run(key, String(value));
    log().info(`Target saved: ${key}=${value}`);
    return { ok: true };
  });
}

/* ──────────────────────────── BUSINESS FIGURE ──────────────────────────── */
function handleBusinessFigure() {
  ipcMain.handle('business:srFigure', (_e, { from, to }) => {
    const db = getDb();
    const rows = db.prepare(`SELECT sr.id, sr.sr_code, sr.sr_name, sm.sm_code,
        COALESCE(SUM(p.premium),0) as total_business,
        COUNT(p.id) as no_of_policies,
        COALESCE((SELECT SUM(syl.premium) FROM Second_Year_Log syl WHERE syl.sr_id=sr.id AND syl.detected_at BETWEEN ? AND ?),0) as second_year_premium
      FROM SR sr
      LEFT JOIN SM sm ON sr.sm_id=sm.id
      LEFT JOIN Policy_Register p ON p.sr_id=sr.id AND p.issue_date BETWEEN ? AND ?
      GROUP BY sr.id ORDER BY total_business DESC`).all(from, to, from, to);
    return rows.map(r => ({ ...r, sr_name: decrypt(r.sr_name) }));
  });

  ipcMain.handle('business:smFigure', (_e, { from, to }) => {
    const db = getDb();
    const rows = db.prepare(`SELECT sm.id, sm.sm_code, sm.sm_name, ssm.ssm_code,
        COALESCE(SUM(p.premium),0) as total_business,
        COUNT(p.id) as no_of_policies,
        (SELECT COUNT(*) FROM SR sr2 WHERE sr2.sm_id=sm.id AND sr2.created_at BETWEEN ? AND ?) as no_of_srs_added,
        COALESCE((SELECT SUM(syl.premium) FROM Second_Year_Log syl WHERE syl.sm_id=sm.id AND syl.detected_at BETWEEN ? AND ?),0) as second_year_premium
      FROM SM sm
      LEFT JOIN SSM ssm ON sm.ssm_id=ssm.id
      LEFT JOIN SR sr ON sr.sm_id=sm.id
      LEFT JOIN Policy_Register p ON p.sr_id=sr.id AND p.issue_date BETWEEN ? AND ?
      GROUP BY sm.id ORDER BY total_business DESC`).all(from, to, from, to, from, to);
    return rows.map(r => ({ ...r, sm_name: decrypt(r.sm_name) }));
  });

  ipcMain.handle('business:ssmFigure', (_e, { from, to }) => {
    const db = getDb();
    const rows = db.prepare(`SELECT ssm.id, ssm.ssm_code, ssm.ssm_name, am.am_name,
        COALESCE(SUM(p.premium),0) as total_business,
        COUNT(p.id) as no_of_policies,
        (SELECT COUNT(*) FROM SR sr2 LEFT JOIN SM sm2 ON sr2.sm_id=sm2.id WHERE sm2.ssm_id=ssm.id AND sr2.created_at BETWEEN ? AND ?) as no_of_srs_added,
        (SELECT COUNT(*) FROM SM sm3 WHERE sm3.ssm_id=ssm.id AND sm3.created_at BETWEEN ? AND ?) as no_of_sms_added,
        COALESCE((SELECT SUM(syl.premium) FROM Second_Year_Log syl WHERE syl.ssm_id=ssm.id AND syl.detected_at BETWEEN ? AND ?),0) as second_year_premium
      FROM SSM ssm
      LEFT JOIN Area_Managers am ON ssm.am_id=am.id
      LEFT JOIN SM sm ON sm.ssm_id=ssm.id
      LEFT JOIN SR sr ON sr.sm_id=sm.id
      LEFT JOIN Policy_Register p ON p.sr_id=sr.id AND p.issue_date BETWEEN ? AND ?
      GROUP BY ssm.id ORDER BY total_business DESC`).all(from, to, from, to, from, to, from, to);
    return rows.map(r => ({ ...r, ssm_name: decrypt(r.ssm_name), am_name: r.am_name ? decrypt(r.am_name) : '' }));
  });
}

/* ──────────────────────────── CONFIG ──────────────────────────── */
function handleConfig() {
  ipcMain.handle('config:get', (_e, key) => {
    const row = getDb().prepare('SELECT value FROM Config WHERE key=?').get(key);
    return row ? row.value : null;
  });
  ipcMain.handle('config:set', (_e, { key, value }) => {
    getDb().prepare('INSERT OR REPLACE INTO Config (key, value) VALUES (?,?)').run(key, String(value));
    return { ok: true };
  });
}

/* ──────────────────────────── BACKUP ──────────────────────────── */
function handleBackup() {
  ipcMain.handle('backup:download', async () => {
    const archiver = require('archiver');
    const result = await dialog.showSaveDialog({ defaultPath: `InsuranceBackup_${Date.now()}.zip`, filters: [{ name: 'ZIP', extensions: ['zip'] }] });
    if (result.canceled) return { ok: false };
    const output  = fs.createWriteStream(result.filePath);
    const archive = archiver('zip', { zlib: { level: 9 } });
    archive.pipe(output);
    const dbPath  = path.join(app.getPath('userData'), 'appdata', 'sysconfig.dat');
    const imgPath = path.join(app.getPath('userData'), 'images');
    if (fs.existsSync(dbPath)) archive.file(dbPath, { name: 'sysconfig.dat' });
    if (fs.existsSync(imgPath)) archive.directory(imgPath, 'images');
    await archive.finalize();
    log().info(`Backup downloaded to: ${result.filePath}`);
    return { ok: true, path: result.filePath };
  });
}

/* ──────────────────────────── PDF GENERATION ──────────────────────────── */
function handlePdfGenerators() {
  ipcMain.handle('dashboard:exportPDF', async () => {
    const db = getDb();
    const today = new Date();
    const m     = today.getMonth() + 1;
    const y     = today.getFullYear();
    const monthStart = `${y}-${String(m).padStart(2,'0')}-01`;
    const prevM = m === 1 ? 12 : m - 1;
    const prevY = m === 1 ? y - 1 : y;
    const prevMonthStart = `${prevY}-${String(prevM).padStart(2,'0')}-01`;
    const prevMonthEnd   = `${y}-${String(m).padStart(2,'0')}-01`;

    const totalPolicies   = db.prepare('SELECT COUNT(*) as c FROM Policy_Register').get().c;
    const totalProposals  = db.prepare('SELECT COUNT(*) as c FROM Proposer_Register').get().c;
    const totalSRs        = db.prepare('SELECT COUNT(*) as c FROM SR').get().c;
    const totalSMs        = db.prepare('SELECT COUNT(*) as c FROM SM').get().c;
    const totalSSMs       = db.prepare('SELECT COUNT(*) as c FROM SSM').get().c;

    const currentMonthPrem = db.prepare(`SELECT COALESCE(SUM(premium),0) as t FROM Policy_Register WHERE strftime('%Y-%m', issue_date)=strftime('%Y-%m',?)`).get(monthStart).t;
    const prevMonthPrem    = db.prepare(`SELECT COALESCE(SUM(premium),0) as t FROM Policy_Register WHERE issue_date >= ? AND issue_date < ?`).get(prevMonthStart, prevMonthEnd).t;
    const ytdPrem          = db.prepare(`SELECT COALESCE(SUM(premium),0) as t FROM Policy_Register WHERE strftime('%Y',issue_date)=?`).get(String(y)).t;

    // Trailing 12 months chart
    const monthlyChart = [];
    const tempDate = new Date();
    for (let i = 11; i >= 0; i--) {
      const d = new Date(tempDate.getFullYear(), tempDate.getMonth() - i, 1);
      const year = d.getFullYear();
      const month = d.getMonth() + 1;
      const monthStr = `${year}-${String(month).padStart(2, '0')}`;
      const t = db.prepare(`SELECT COALESCE(SUM(premium),0) as t FROM Policy_Register WHERE strftime('%Y-%m',issue_date)=?`).get(monthStr).t;
      monthlyChart.push({ month, year, premium: t });
    }

    const PDFDocument = require('pdfkit');
    const result = await dialog.showSaveDialog({
      defaultPath: `Dashboard_Monthly_Report_${y}_${String(m).padStart(2,'0')}.pdf`,
      filters: [{ name: 'PDF', extensions: ['pdf'] }]
    });
    if (result.canceled) return { ok: false, canceled: true };
    const filePath = result.filePath;

    const doc = new PDFDocument({ margin: 50 });
    const writeStream = fs.createWriteStream(filePath);
    doc.pipe(writeStream);

    doc.fontSize(20).text('Insurance ERP - Dashboard Executive Summary', { align: 'center' });
    doc.moveDown();
    doc.fontSize(10).text(`Report Date: ${new Date().toLocaleString()}`, { align: 'right' });
    doc.moveDown(1.5);

    // Summary Section
    doc.fontSize(14).font('Helvetica-Bold').text('System Statistics');
    doc.moveDown(0.5);
    doc.fontSize(10).font('Helvetica');
    doc.text(`Total Active Policies: ${totalPolicies}`);
    doc.text(`Total Customer Proposals: ${totalProposals}`);
    doc.text(`Total SSM Recruitments: ${totalSSMs}`);
    doc.text(`Total SM Recruitments: ${totalSMs}`);
    doc.text(`Total SR Recruitments: ${totalSRs}`);
    doc.moveDown();

    doc.fontSize(14).font('Helvetica-Bold').text('Financial Metrics');
    doc.moveDown(0.5);
    doc.fontSize(10).font('Helvetica');
    doc.text(`Current Month Premium Volume: Rs. ${Number(currentMonthPrem).toLocaleString()}`);
    doc.text(`Previous Month Premium Volume: Rs. ${Number(prevMonthPrem).toLocaleString()}`);
    doc.text(`Year-to-Date Premium Volume: Rs. ${Number(ytdPrem).toLocaleString()}`);
    doc.moveDown(1.5);

    // Monthly Chart Table representation
    doc.fontSize(14).font('Helvetica-Bold').text('Premium Collection Trend (Trailing 12 Months)');
    doc.moveDown(0.5);
    
    // Draw columns
    doc.fontSize(10).font('Helvetica-Bold');
    doc.text('Month/Year', 50, doc.y, { width: 250 });
    doc.text('Total Premium Collection', 300, doc.y, { width: 250 });
    doc.strokeColor('#cccccc').lineWidth(1).moveTo(50, doc.y + 12).lineTo(550, doc.y + 12).stroke();
    doc.moveDown(1.5);
    
    doc.font('Helvetica');
    const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    for (const mData of monthlyChart) {
      const monthLabel = `${MONTHS[mData.month - 1]} ${mData.year}`;
      const rowY = doc.y;
      doc.text(monthLabel, 50, rowY, { width: 250 });
      doc.text(`Rs. ${Number(mData.premium).toLocaleString()}`, 300, rowY, { width: 250 });
      doc.moveDown(1.2);
    }

    doc.end();
    return new Promise((resolve) => {
      writeStream.on('finish', () => {
        resolve({ ok: true, path: filePath });
      });
      writeStream.on('error', (err) => {
        resolve({ ok: false, error: err.message });
      });
    });
  });

  ipcMain.handle('business:exportPDF', async (_e, { from, to, role, data }) => {
    const PDFDocument = require('pdfkit');
    const result = await dialog.showSaveDialog({
      defaultPath: `${role}_Performance_Report_${from}_to_${to}.pdf`,
      filters: [{ name: 'PDF', extensions: ['pdf'] }]
    });
    if (result.canceled) return { ok: false, canceled: true };
    const filePath = result.filePath;
    
    const doc = new PDFDocument({ margin: 50 });
    const writeStream = fs.createWriteStream(filePath);
    doc.pipe(writeStream);
    
    doc.fontSize(20).text('Insurance ERP - Performance Report', { align: 'center' });
    doc.moveDown();
    doc.fontSize(12).text(`Role: ${role}`, { align: 'left' });
    doc.text(`Period: ${from} to ${to}`, { align: 'left' });
    doc.text(`Generated At: ${new Date().toLocaleString()}`, { align: 'left' });
    doc.moveDown(2);
    
    const startY = doc.y;
    doc.fontSize(10).font('Helvetica-Bold');
    
    let colWidths = [];
    let headers = [];
    let keys = [];
    if (role === 'SR') {
      headers = ['SR Code', 'SR Name', 'SM Code', 'Business', 'Policies', '2nd Yr Prem'];
      colWidths = [70, 150, 70, 90, 50, 90];
      keys = ['sr_code', 'sr_name', 'sm_code', 'total_business', 'no_of_policies', 'second_year_premium'];
    } else if (role === 'SM') {
      headers = ['SM Code', 'SM Name', 'SSM Code', 'Business', 'Policies', 'SRs Add', '2nd Yr Prem'];
      colWidths = [60, 130, 60, 80, 50, 50, 85];
      keys = ['sm_code', 'sm_name', 'ssm_code', 'total_business', 'no_of_policies', 'no_of_srs_added', 'second_year_premium'];
    } else {
      headers = ['SSM Code', 'SSM Name', 'AM Name', 'Business', 'Policies', 'SRs Add', 'SMs Add', '2nd Yr Prem'];
      colWidths = [60, 110, 80, 70, 40, 40, 40, 75];
      keys = ['ssm_code', 'ssm_name', 'am_name', 'total_business', 'no_of_policies', 'no_of_srs_added', 'no_of_sms_added', 'second_year_premium'];
    }
    
    let currentX = 50;
    for (let i = 0; i < headers.length; i++) {
      doc.text(headers[i], currentX, startY, { width: colWidths[i], align: 'left' });
      currentX += colWidths[i];
    }
    
    doc.moveDown();
    doc.strokeColor('#cccccc').lineWidth(1).moveTo(50, doc.y).lineTo(550, doc.y).stroke();
    doc.moveDown(0.5);
    
    doc.font('Helvetica');
    let grandTotalRow = null;
    
    for (const row of data) {
      if (row.id === '__grand__' || row.sr_name === 'GRAND TOTAL' || row.sm_name === 'GRAND TOTAL' || row.ssm_name === 'GRAND TOTAL') {
        grandTotalRow = row;
        continue;
      }
      
      if (doc.y > 700) {
        doc.addPage();
        let tempX = 50;
        doc.font('Helvetica-Bold');
        for (let i = 0; i < headers.length; i++) {
          doc.text(headers[i], tempX, 50, { width: colWidths[i], align: 'left' });
          tempX += colWidths[i];
        }
        doc.strokeColor('#cccccc').lineWidth(1).moveTo(50, doc.y + 12).lineTo(550, doc.y + 12).stroke();
        doc.moveDown(1.5);
        doc.font('Helvetica');
      }
      
      const rowY = doc.y;
      let xPos = 50;
      for (let i = 0; i < keys.length; i++) {
        let val = row[keys[i]];
        if (keys[i] === 'total_business' || keys[i] === 'second_year_premium') {
          val = `Rs. ${Number(val || 0).toLocaleString()}`;
        }
        doc.text(String(val ?? '—'), xPos, rowY, { width: colWidths[i], align: 'left' });
        xPos += colWidths[i];
      }
      doc.moveDown(1.2);
    }
    
    if (grandTotalRow) {
      doc.moveDown(0.5);
      doc.strokeColor('#334155').lineWidth(1.5).moveTo(50, doc.y).lineTo(550, doc.y).stroke();
      doc.moveDown(0.5);
      doc.font('Helvetica-Bold');
      const rowY = doc.y;
      let xPos = 50;
      for (let i = 0; i < keys.length; i++) {
        let val = grandTotalRow[keys[i]];
        if (keys[i] === 'total_business' || keys[i] === 'second_year_premium') {
          val = `Rs. ${Number(val || 0).toLocaleString()}`;
        }
        doc.text(String(val ?? '—'), xPos, rowY, { width: colWidths[i], align: 'left' });
        xPos += colWidths[i];
      }
    }
    
    doc.end();
    return new Promise((resolve) => {
      writeStream.on('finish', () => {
        resolve({ ok: true, path: filePath });
      });
      writeStream.on('error', (err) => {
        resolve({ ok: false, error: err.message });
      });
    });
  });
}

/* ──────────────────────────── EXCEL GENERATION ──────────────────────────── */
function handleExcelGenerators() {
  ipcMain.handle('business:exportExcel', async (_e, { from, to, role, data }) => {
    try {
      const ExcelJS = require('exceljs');
      const result = await dialog.showSaveDialog({
        defaultPath: `${role}_Performance_Report_${from}_to_${to}.xlsx`,
        filters: [{ name: 'Excel Workbook', extensions: ['xlsx'] }]
      });
      if (result.canceled) return { ok: false, canceled: true };
      const filePath = result.filePath;

      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Performance Report');

      let columns = [];
      if (role === 'SR') {
        columns = [
          { header: 'SR Code', key: 'sr_code', width: 15 },
          { header: 'SR Name', key: 'sr_name', width: 25 },
          { header: 'SM Code', key: 'sm_code', width: 15 },
          { header: 'Total Business (PKR)', key: 'total_business', width: 20 },
          { header: 'No of Policies', key: 'no_of_policies', width: 15 },
          { header: '2nd Year Premium (PKR)', key: 'second_year_premium', width: 20 }
        ];
      } else if (role === 'SM') {
        columns = [
          { header: 'SM Code', key: 'sm_code', width: 15 },
          { header: 'SM Name', key: 'sm_name', width: 25 },
          { header: 'SSM Code', key: 'ssm_code', width: 15 },
          { header: 'Total Business (PKR)', key: 'total_business', width: 20 },
          { header: 'No of Policies', key: 'no_of_policies', width: 15 },
          { header: 'SRs Added', key: 'no_of_srs_added', width: 15 },
          { header: '2nd Year Premium (PKR)', key: 'second_year_premium', width: 20 }
        ];
      } else {
        columns = [
          { header: 'SSM Code', key: 'ssm_code', width: 15 },
          { header: 'SSM Name', key: 'ssm_name', width: 25 },
          { header: 'Area Manager', key: 'am_name', width: 25 },
          { header: 'Total Business (PKR)', key: 'total_business', width: 20 },
          { header: 'No of Policies', key: 'no_of_policies', width: 15 },
          { header: 'SRs Added', key: 'no_of_srs_added', width: 15 },
          { header: 'SMs Added', key: 'no_of_sms_added', width: 15 },
          { header: '2nd Year Premium (PKR)', key: 'second_year_premium', width: 20 }
        ];
      }
      worksheet.columns = columns;

      for (const r of data) {
        worksheet.addRow(r);
      }

      // Formatting header row
      worksheet.getRow(1).font = { bold: true };
      
      // Auto-formatting total values as currencies if needed, or keeping simple numeric styles
      await workbook.xlsx.writeFile(filePath);
      log().info(`Excel report saved successfully to: ${filePath}`);
      return { ok: true, path: filePath };
    } catch (err) {
      log().error(`Failed to generate Excel report: ${err.message}`);
      return { ok: false, error: err.message };
    }
  });

  ipcMain.handle('policy:exportExcel', async (_e, data) => {
    try {
      const ExcelJS = require('exceljs');
      const result = await dialog.showSaveDialog({
        defaultPath: `Policies_Export_${Date.now()}.xlsx`,
        filters: [{ name: 'Excel Workbook', extensions: ['xlsx'] }]
      });
      if (result.canceled) return { ok: false, canceled: true };
      const filePath = result.filePath;

      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Policies');

      worksheet.columns = [
        { header: 'Policy No', key: 'policy_no', width: 18 },
        { header: 'Holder Name', key: 'holder_name', width: 25 },
        { header: 'CNIC', key: 'cnic', width: 20 },
        { header: 'Contact', key: 'contact_1', width: 15 },
        { header: 'Premium (PKR)', key: 'premium', width: 18 },
        { header: 'Issue Date', key: 'issue_date', width: 15 },
        { header: 'Due Date', key: 'due_date', width: 15 },
        { header: 'Last Paid Date', key: 'last_paid_date', width: 15 },
        { header: 'SR Code', key: 'sr_code', width: 15 },
        { header: 'SM Code', key: 'sm_code', width: 15 }
      ];

      for (const r of data) {
        worksheet.addRow(r);
      }

      worksheet.getRow(1).font = { bold: true };

      await workbook.xlsx.writeFile(filePath);
      log().info(`Policies list exported to Excel successfully: ${filePath}`);
      return { ok: true, path: filePath };
    } catch (err) {
      log().error(`Failed to export policies to Excel: ${err.message}`);
      return { ok: false, error: err.message };
    }
  });
}

/* ──────────────────────────── REGISTER ALL ──────────────────────────── */
function registerAllHandlers() {
  handleAuth();
  handleLicense();
  handleUsers();
  handleAreaManagers();
  handleSSM();
  handleSM();
  handleSR();
  handleProposer();
  handlePolicy();
  handleNotifications();
  handleDashboard();
  handleBusinessFigure();
  handleConfig();
  handleBackup();
  handlePdfGenerators();
  handleExcelGenerators();
  handleDatabaseReset();
  handleFileOpening();
}

function handleFileOpening() {
  ipcMain.handle('app:openFile', async (_e, filePath) => {
    try {
      if (!filePath) {
        return { ok: false, error: 'No file path provided' };
      }
      if (!fs.existsSync(filePath)) {
        return { ok: false, error: 'File does not exist on disk' };
      }
      const err = await shell.openPath(filePath);
      if (err) {
        return { ok: false, error: err };
      }
      return { ok: true };
    } catch (err) {
      log().error(`Failed to open file ${filePath}: ${err.message}`);
      return { ok: false, error: err.message };
    }
  });
}

function handleDatabaseReset() {
  ipcMain.handle('database:reset', async () => {
    const db = getDb();
    try {
      db.transaction(() => {
        db.prepare('DELETE FROM Notifications').run();
        db.prepare('DELETE FROM Second_Year_Log').run();
        db.prepare('DELETE FROM Policy_Register').run();
        db.prepare('DELETE FROM Proposer_Register').run();
        db.prepare('DELETE FROM SR').run();
        db.prepare('DELETE FROM SM').run();
        db.prepare('DELETE FROM SSM').run();
        db.prepare('DELETE FROM Area_Managers').run();
        
        // Reset target config
        db.prepare('DELETE FROM Config').run();
        db.prepare("INSERT INTO Config (key, value) VALUES ('monthly_target', '0')").run();
        db.prepare("INSERT INTO Config (key, value) VALUES ('yearly_target', '0')").run();
        db.prepare("INSERT INTO Config (key, value) VALUES ('license_sent', '0')").run();
      })();
      log().info('System database cleared successfully.');
      return { ok: true };
    } catch (err) {
      log().error(`Database reset failed: ${err.message}`);
      return { ok: false, error: err.message };
    }
  });

  ipcMain.handle('database:seed', async () => {
    const db = getDb();
    try {
      db.transaction(seedSampleData)(db);
      log().info('Database seeded with sample data manually.');
      return { ok: true };
    } catch (err) {
      log().error(`Database seeding failed: ${err.message}`);
      return { ok: false, error: err.message };
    }
  });
}

module.exports = { registerAllHandlers };
