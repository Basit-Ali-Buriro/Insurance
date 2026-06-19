'use strict';
const path = require('path');
const fs = require('fs');
const { app } = require('electron');
const Database = require('better-sqlite3');
const bcrypt = require('bcrypt');
const { encrypt, decrypt } = require('./crypto');
const { getLogger } = require('./logger');

const DB_DIR  = path.join(app.getPath('userData'), 'appdata');
const DB_PATH = path.join(DB_DIR, 'sysconfig.dat');

let _db = null;

function getDb() {
  if (_db) return _db;
  if (!fs.existsSync(DB_DIR)) fs.mkdirSync(DB_DIR, { recursive: true });
  _db = new Database(DB_PATH);
  _db.pragma('journal_mode = WAL');
  _db.pragma('foreign_keys = ON');
  return _db;
}

function closeDb() {
  if (_db) {
    try {
      _db.close();
      getLogger().info('Database connection closed');
    } catch (err) {
      getLogger().error(`Error closing database: ${err.message}`);
    }
    _db = null;
  }
}

/* ───────────────────────────── SCHEMA ───────────────────────────── */
const SCHEMA = `
  CREATE TABLE IF NOT EXISTS Users (
    user_id       INTEGER PRIMARY KEY AUTOINCREMENT,
    name          TEXT NOT NULL,
    username      TEXT NOT NULL,
    password_hash TEXT NOT NULL,
    role          TEXT CHECK(role IN ('developer','admin')) NOT NULL,
    status        TEXT CHECK(status IN ('active','inactive')) DEFAULT 'active',
    contact       TEXT,
    contact_email TEXT,
    contact_number TEXT,
    created_at    DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS Area_Managers (
    id                INTEGER PRIMARY KEY AUTOINCREMENT,
    am_code           TEXT UNIQUE NOT NULL,
    am_name           TEXT NOT NULL,
    address           TEXT,
    cnic              TEXT NOT NULL,
    contact_1         TEXT,
    contact_2         TEXT,
    status            TEXT CHECK(status IN ('active','inactive')) DEFAULT 'active',
    relation          TEXT,
    registration_no   TEXT,
    registration_date DATE,
    created_at        DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS SSM (
    id                  INTEGER PRIMARY KEY AUTOINCREMENT,
    ssm_code            TEXT UNIQUE NOT NULL,
    ssm_name            TEXT NOT NULL,
    address             TEXT,
    cnic                TEXT NOT NULL,
    contact_1           TEXT,
    contact_2           TEXT,
    am_id               INTEGER REFERENCES Area_Managers(id),
    cnic_pic            TEXT,
    nominee_cnic_pic    TEXT,
    matric_cert         TEXT,
    intermediate_cert   TEXT,
    degree_cert         TEXT,
    status              TEXT CHECK(status IN ('active','inactive')) DEFAULT 'active',
    second_year_premium REAL DEFAULT 0.0,
    relation            TEXT,
    registration_no     TEXT,
    registration_date   DATE,
    passport_pic        TEXT,
    created_at          DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS SM (
    id                  INTEGER PRIMARY KEY AUTOINCREMENT,
    sm_code             TEXT UNIQUE NOT NULL,
    sm_name             TEXT NOT NULL,
    address             TEXT,
    cnic                TEXT NOT NULL,
    contact_1           TEXT,
    contact_2           TEXT,
    ssm_id              INTEGER REFERENCES SSM(id),
    am_id               INTEGER REFERENCES Area_Managers(id),
    cnic_pic            TEXT,
    nominee_cnic_pic    TEXT,
    matric_cert         TEXT,
    intermediate_cert   TEXT,
    degree_cert         TEXT,
    status              TEXT CHECK(status IN ('active','inactive')) DEFAULT 'active',
    second_year_premium REAL DEFAULT 0.0,
    relation            TEXT,
    registration_no     TEXT,
    registration_date   DATE,
    passport_pic        TEXT,
    created_at          DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS SR (
    id                  INTEGER PRIMARY KEY AUTOINCREMENT,
    sr_code             TEXT UNIQUE NOT NULL,
    sr_name             TEXT NOT NULL,
    address             TEXT,
    cnic                TEXT NOT NULL,
    contact_1           TEXT,
    contact_2           TEXT,
    sm_id               INTEGER REFERENCES SM(id),
    ssm_id              INTEGER REFERENCES SSM(id),
    am_id               INTEGER REFERENCES Area_Managers(id),
    cnic_pic            TEXT,
    nominee_cnic_pic    TEXT,
    matric_cert         TEXT,
    intermediate_cert   TEXT,
    degree_cert         TEXT,
    status              TEXT CHECK(status IN ('active','inactive')) DEFAULT 'active',
    second_year_premium REAL DEFAULT 0.0,
    relation            TEXT,
    registration_no     TEXT,
    registration_date   DATE,
    passport_pic        TEXT,
    total_business      REAL DEFAULT 0.0,
    created_at          DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS Proposer_Register (
    id                  INTEGER PRIMARY KEY AUTOINCREMENT,
    proposal_no         TEXT UNIQUE NOT NULL,
    holder_name         TEXT NOT NULL,
    premium             REAL NOT NULL,
    pr_no               TEXT,
    pr_date             DATE,
    amount_type         TEXT CHECK(amount_type IN ('cash','cheque')),
    requirements        TEXT,
    sr_id               INTEGER REFERENCES SR(id),
    sm_id               INTEGER REFERENCES SM(id),
    ssm_id              INTEGER REFERENCES SSM(id),
    status              TEXT CHECK(status IN ('ok','not_ok')) DEFAULT 'not_ok',
    converted_to_policy INTEGER DEFAULT 0,
    contact_1           TEXT,
    contact_2           TEXT,
    created_at          DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS Policy_Register (
    id                 INTEGER PRIMARY KEY AUTOINCREMENT,
    policy_no          TEXT UNIQUE NOT NULL,
    holder_name        TEXT NOT NULL,
    cnic               TEXT NOT NULL,
    address            TEXT,
    contact_1          TEXT,
    contact_2          TEXT,
    premium            REAL NOT NULL,
    issue_date         DATE NOT NULL,
    due_date           DATE,
    table_term         TEXT,
    last_paid_date     DATE,
    previous_paid_date DATE,
    sr_id              INTEGER REFERENCES SR(id),
    sm_id              INTEGER REFERENCES SM(id),
    ssm_id             INTEGER REFERENCES SSM(id),
    proposal_id        INTEGER REFERENCES Proposer_Register(id),
    relation           TEXT,
    created_at         DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS Notifications (
    id               INTEGER PRIMARY KEY AUTOINCREMENT,
    policy_id        INTEGER REFERENCES Policy_Register(id),
    triggered_date   DATE,
    whatsapp_sent    INTEGER DEFAULT 0,
    whatsapp_sent_at DATETIME,
    created_at       DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS Second_Year_Log (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    policy_id   INTEGER REFERENCES Policy_Register(id),
    sr_id       INTEGER,
    sm_id       INTEGER,
    ssm_id      INTEGER,
    premium     REAL,
    detected_at DATE DEFAULT (date('now'))
  );

  CREATE TABLE IF NOT EXISTS Config (
    key   TEXT PRIMARY KEY,
    value TEXT NOT NULL
  );

  CREATE INDEX IF NOT EXISTS idx_policy_no   ON Policy_Register(policy_no);
  CREATE INDEX IF NOT EXISTS idx_due_date    ON Policy_Register(due_date);
  CREATE INDEX IF NOT EXISTS idx_issue_date  ON Policy_Register(issue_date);
  CREATE INDEX IF NOT EXISTS idx_last_paid   ON Policy_Register(last_paid_date);
  CREATE INDEX IF NOT EXISTS idx_sr_code     ON SR(sr_code);
  CREATE INDEX IF NOT EXISTS idx_sm_code     ON SM(sm_code);
  CREATE INDEX IF NOT EXISTS idx_ssm_code    ON SSM(ssm_code);
  CREATE INDEX IF NOT EXISTS idx_am_code     ON Area_Managers(am_code);
  CREATE INDEX IF NOT EXISTS idx_proposal_no ON Proposer_Register(proposal_no);
`;

/* ───────────────────────────── SEED DATA ───────────────────────────── */
function seedSampleData(db) {
  // Clear tables to prevent UNIQUE/FOREIGN KEY errors on duplicate seeds
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

  // ── 3 Area Managers ──────────────────────────────────────────
  const insAM = db.prepare(`
    INSERT INTO Area_Managers (am_code, am_name, address, cnic, contact_1, contact_2, status)
    VALUES (?, ?, ?, ?, ?, ?, 'active')
  `);
  const am1 = insAM.run('AM001', encrypt('Muhammad Aslam Khan'),      encrypt('House 12, Street 4, Model Town, Lahore'), encrypt('35201-1234567-8'), encrypt('03001234567'), encrypt('03211234567'));
  const am2 = insAM.run('AM002', encrypt('Rashid Mehmood Chaudhry'),  encrypt('Plot 45, Gulberg III, Lahore'),           encrypt('35202-2345678-9'), encrypt('03012345678'), encrypt(''));
  const am3 = insAM.run('AM003', encrypt('Tariq Hassan Siddiqui'),    encrypt('House 7, DHA Phase 1, Karachi'),         encrypt('42101-3456789-0'), encrypt('03213456789'), encrypt(''));

  // ── 3 SSMs ───────────────────────────────────────────────────
  const insSSM = db.prepare(`
    INSERT INTO SSM (ssm_code, ssm_name, address, cnic, contact_1, contact_2, am_id, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, 'active')
  `);
  const ssm1 = insSSM.run('SSM001', encrypt('Imran Ali Butt'),       encrypt('House 22, Model Town Ext, Lahore'),      encrypt('35201-4567890-1'), encrypt('03334567890'), encrypt(''), am1.lastInsertRowid);
  const ssm2 = insSSM.run('SSM002', encrypt('Naveed Iqbal Raja'),    encrypt('House 15, Johar Town, Lahore'),          encrypt('35202-5678901-2'), encrypt('03445678901'), encrypt(''), am2.lastInsertRowid);
  const ssm3 = insSSM.run('SSM003', encrypt('Zulfiqar Ahmed Mirza'), encrypt('Flat 8, Gulshan-e-Iqbal, Karachi'),     encrypt('42101-6789012-3'), encrypt('03556789012'), encrypt(''), am3.lastInsertRowid);

  // ── 3 SMs ────────────────────────────────────────────────────
  const insSM = db.prepare(`
    INSERT INTO SM (sm_code, sm_name, address, cnic, contact_1, contact_2, ssm_id, am_id, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'active')
  `);
  const sm1 = insSM.run('SM001', encrypt('Ahsan Raza Qureshi'),  encrypt('Street 7, Faisal Town, Lahore'),    encrypt('35201-7890123-4'), encrypt('03367890123'), encrypt(''), ssm1.lastInsertRowid, am1.lastInsertRowid);
  const sm2 = insSM.run('SM002', encrypt('Bilal Hussain Rana'),  encrypt('House 33, Township, Lahore'),       encrypt('35202-8901234-5'), encrypt('03478901234'), encrypt(''), ssm2.lastInsertRowid, am2.lastInsertRowid);
  const sm3 = insSM.run('SM003', encrypt('Kamran Shah Afridi'),  encrypt('House 18, PECHS Block 6, Karachi'), encrypt('42101-9012345-6'), encrypt('03589012345'), encrypt(''), ssm3.lastInsertRowid, am3.lastInsertRowid);

  // ── 3 SRs ────────────────────────────────────────────────────
  const insSR = db.prepare(`
    INSERT INTO SR (sr_code, sr_name, address, cnic, contact_1, contact_2, sm_id, ssm_id, am_id, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'active')
  `);
  const sr1 = insSR.run('SR001', encrypt('Usman Ghani Malik'),  encrypt('House 5, Garden Town, Lahore'),     encrypt('35201-0123456-7'), encrypt('03300123456'), encrypt(''), sm1.lastInsertRowid, ssm1.lastInsertRowid, am1.lastInsertRowid);
  const sr2 = insSR.run('SR002', encrypt('Faisal Khan Lodhi'),  encrypt('House 11, Bahria Town, Lahore'),    encrypt('35202-1234568-9'), encrypt('03411234567'), encrypt(''), sm2.lastInsertRowid, ssm2.lastInsertRowid, am2.lastInsertRowid);
  const sr3 = insSR.run('SR003', encrypt('Hamid Shaikh Baloch'),encrypt('Flat 3, Defence View, Karachi'),    encrypt('42101-2345678-9'), encrypt('03522345678'), encrypt(''), sm3.lastInsertRowid, ssm3.lastInsertRowid, am3.lastInsertRowid);

  // ── 3 Proposals ──────────────────────────────────────────────
  const insProp = db.prepare(`
    INSERT INTO Proposer_Register
      (proposal_no, holder_name, premium, pr_no, pr_date, amount_type, requirements, sr_id, sm_id, ssm_id, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'not_ok')
  `);
  insProp.run('PRO-2026-001', encrypt('Ali Ahmed Siddiqui'), 25000, 'PR-001', '2026-01-15', 'cash',   'Life insurance with family coverage option', sr1.lastInsertRowid, sm1.lastInsertRowid, ssm1.lastInsertRowid);
  insProp.run('PRO-2026-002', encrypt('Sara Malik Ansari'),  18000, 'PR-002', '2026-02-20', 'cheque', 'Health and hospitalization insurance plan',  sr2.lastInsertRowid, sm2.lastInsertRowid, ssm2.lastInsertRowid);
  insProp.run('PRO-2026-003', encrypt('Khalid Rehman Dar'),  30000, 'PR-003', '2026-03-10', 'cash',   'Vehicle and life insurance combo package',   sr3.lastInsertRowid, sm3.lastInsertRowid, ssm3.lastInsertRowid);

  // ── 3 Policies (due dates set to trigger notifications) ───────
  const today = new Date();
  const fmt   = (d) => d.toISOString().split('T')[0];
  const due1  = new Date(today); due1.setDate(due1.getDate() + 10);
  const due2  = new Date(today); due2.setDate(due2.getDate() + 5);
  const due3  = new Date(today); due3.setDate(due3.getDate() + 20);

  const insP = db.prepare(`
    INSERT INTO Policy_Register
      (policy_no, holder_name, cnic, address, contact_1, contact_2,
       premium, issue_date, due_date, table_term, last_paid_date, sr_id, sm_id, ssm_id)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  const p1 = insP.run('POL-2026-001', encrypt('Ali Ahmed Siddiqui'), encrypt('35201-5678901-2'), encrypt('House 10, Model Town, Lahore'), encrypt('03001111111'), encrypt(''), 25000, '2025-06-01', fmt(due1), '20 Years', '2026-06-01', sr1.lastInsertRowid, sm1.lastInsertRowid, ssm1.lastInsertRowid);
  const p2 = insP.run('POL-2026-002', encrypt('Sara Malik Ansari'),  encrypt('35202-6789012-3'), encrypt('House 8, Gulberg II, Lahore'),  encrypt('03002222222'), encrypt(''), 18000, '2025-07-15', fmt(due2), '15 Years', '2026-05-15', sr2.lastInsertRowid, sm2.lastInsertRowid, ssm2.lastInsertRowid);
  const p3 = insP.run('POL-2026-003', encrypt('Khalid Rehman Dar'),  encrypt('42101-7890123-4'), encrypt('House 3, DHA Phase 4, Karachi'), encrypt('03003333333'), encrypt(''), 30000, '2025-08-20', fmt(due3), '25 Years', '2026-04-20', sr3.lastInsertRowid, sm3.lastInsertRowid, ssm3.lastInsertRowid);

  // Notifications for all 3 policies
  const insN = db.prepare(`INSERT INTO Notifications (policy_id, triggered_date) VALUES (?, ?)`);
  [p1, p2, p3].forEach(p => insN.run(p.lastInsertRowid, fmt(today)));
}

/* ───────────────────────────── INIT ───────────────────────────── */
function initializeDatabase() {
  const log = getLogger();
  const dbDir = path.dirname(DB_PATH);

  if (!fs.existsSync(DB_PATH)) {
    // If the database doesn't exist, check if a pre-seeded template database exists in the app package root
    const templatePath = path.join(app.getAppPath(), 'sysconfig.dat');
    if (fs.existsSync(templatePath)) {
      log.info(`Found pre-seeded template database at ${templatePath}. Copying to AppData...`);
      try {
        if (!fs.existsSync(dbDir)) fs.mkdirSync(dbDir, { recursive: true });
        const dbContent = fs.readFileSync(templatePath);
        fs.writeFileSync(DB_PATH, dbContent);
      } catch (err) {
        log.error(`Failed to copy template database: ${err.message}`);
      }
    }
  }

  const db = getDb();

  db.exec(SCHEMA);

  // Schema alterations for Area_Managers, SSM, SM, SR
  const tables = ['Area_Managers', 'SSM', 'SM', 'SR'];
  for (const table of tables) {
    // 1. Rename license_date to registration_date
    try {
      db.prepare(`ALTER TABLE ${table} RENAME COLUMN license_date TO registration_date`).run();
      log.info(`Renamed license_date to registration_date on ${table} table`);
    } catch (err) {
      // If renaming failed (e.g. license_date doesn't exist), try to add registration_date directly
      try {
        db.prepare(`ALTER TABLE ${table} ADD COLUMN registration_date DATE`).run();
        log.info(`Added registration_date column to ${table} table`);
      } catch (addErr) {
        // Already exists or other issue, safe to ignore
      }
    }

    // 2. Add relation column
    try {
      db.prepare(`ALTER TABLE ${table} ADD COLUMN relation TEXT`).run();
      log.info(`Added relation column to ${table} table`);
    } catch (err) {}

    // 3. Add registration_no column
    try {
      db.prepare(`ALTER TABLE ${table} ADD COLUMN registration_no TEXT`).run();
      log.info(`Added registration_no column to ${table} table`);
    } catch (err) {}

    // 4. Add passport_pic column (only SSM, SM, SR)
    if (table !== 'Area_Managers') {
      try {
        db.prepare(`ALTER TABLE ${table} ADD COLUMN passport_pic TEXT`).run();
        log.info(`Added passport_pic column to ${table} table`);
      } catch (err) {}
    }
  }

  // Migrations for Policy_Register relation
  try {
    db.prepare('ALTER TABLE Policy_Register ADD COLUMN relation TEXT').run();
    log.info('Added relation column to Policy_Register table');
  } catch (err) {}

  // Migrations for SR total_business
  try {
    db.prepare('ALTER TABLE SR ADD COLUMN total_business REAL DEFAULT 0.0').run();
    log.info('Added total_business column to SR table');
  } catch (err) {}

  // Synchronize total_business for all SRs based on Policy_Register premiums
  try {
    db.prepare(`
      UPDATE SR SET total_business = (
        SELECT COALESCE(SUM(premium), 0) FROM Policy_Register WHERE Policy_Register.sr_id = SR.id
      )
    `).run();
    log.info('Synchronized total_business column for all SR records');
  } catch (err) {
    log.error(`Failed to synchronize total_business for SRs: ${err.message}`);
  }

  // Migrations for Proposer_Register contact columns
  try {
    db.prepare('ALTER TABLE Proposer_Register ADD COLUMN contact_1 TEXT').run();
    log.info('Added contact_1 column to Proposer_Register table');
  } catch (err) {}
  try {
    db.prepare('ALTER TABLE Proposer_Register ADD COLUMN contact_2 TEXT').run();
    log.info('Added contact_2 column to Proposer_Register table');
  } catch (err) {}

  // Migrations for Users contact column
  try {
    db.prepare('ALTER TABLE Users ADD COLUMN contact TEXT').run();
    log.info('Added contact column to Users table');
  } catch (err) {}

  try {
    db.prepare('ALTER TABLE Users ADD COLUMN contact_email TEXT').run();
    log.info('Added contact_email column to Users table');
  } catch (err) {}

  try {
    db.prepare('ALTER TABLE Users ADD COLUMN contact_number TEXT').run();
    log.info('Added contact_number column to Users table');
  } catch (err) {}

  // Config defaults
  const upsertConfig = db.prepare(`INSERT OR IGNORE INTO Config (key, value) VALUES (?, ?)`);
  upsertConfig.run('monthly_target',  '0');
  upsertConfig.run('yearly_target',   '0');
  upsertConfig.run('license_sent',    '0');

  // Seed only if no users exist
  const { cnt } = db.prepare('SELECT COUNT(*) as cnt FROM Users').get();
  if (cnt === 0) {
    const devHash   = bcrypt.hashSync('Dev@1234',   10);
    const adminHash = bcrypt.hashSync('Admin@1234', 10);

    const insUser = db.prepare(`
      INSERT INTO Users (name, username, password_hash, role, status, contact_email, contact_number)
      VALUES (?, ?, ?, ?, 'active', ?, ?)
    `);
    insUser.run(encrypt('Super Administrator'), encrypt('developer'), devHash,   'developer', encrypt(''), encrypt(''));
    insUser.run(encrypt('Admin User'),          encrypt('admin'),     adminHash, 'admin',     encrypt(''), encrypt(''));

    db.transaction(seedSampleData)(db);
    log.info('Database seeded with initial users and sample data');
  }

  log.info('Database initialized');
}

/* ─── Helpers used by ipcHandlers ─── */
function decryptRow(row, fields) {
  if (!row) return null;
  const out = { ...row };
  for (const f of fields) {
    if (out[f] !== undefined && out[f] !== null) out[f] = decrypt(out[f]);
  }
  return out;
}

module.exports = { getDb, initializeDatabase, decryptRow, seedSampleData, closeDb };
