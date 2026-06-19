'use strict';
const path      = require('path');
const fs        = require('fs');
const { app, shell } = require('electron');
const { machineIdSync } = require('node-machine-id');
const nodemailer = require('nodemailer');
const { getDb } = require('./database');
const { encryptObject, decryptObject, generateLicenseKey, validateRenewalKey, decrypt } = require('./crypto');
const { getLogger } = require('./logger');

const CONFIG_PATH = path.join(app.getPath('userData'), 'appdata', '.lc');
const ONE_YEAR_MS = 365 * 24 * 60 * 60 * 1000;

// ==================== DEVELOPER SMTP & ALERTS CONFIG ====================
// To receive automatic installation & expiry notifications, configure your SMTP sender details below.
const SMTP_CONFIG = {
  host: 'smtp.gmail.com',      // Your SMTP provider host (e.g. smtp.gmail.com)
  port: 465,                   // SMTP port (465 for secure SSL, 587 for TLS)
  secure: true,                // true for port 465, false for other ports
  auth: {
    user: 'basitaliburiro1110@gmail.com',  // The email address that will SEND the notifications
    pass: 'kwpf batd bsqt duxy',     // The App Password generated from your Google Account
  }
};

const RECEIVER_EMAIL = 'basit.web24@gmail.com, subhashprem4@gmail.com'; // Your email address where you want to receive alerts
const DEVELOPER_WHATSAPP = '923243859337'; // Your WhatsApp number (with country code, e.g. 923XXXXXXXXX)
// ========================================================================

function getConfig() {
  try {
    if (!fs.existsSync(CONFIG_PATH)) return null;
    const raw = fs.readFileSync(CONFIG_PATH, 'utf8');
    return decryptObject(raw);
  } catch {
    return null;
  }
}

function saveConfig(obj) {
  const dir = path.dirname(CONFIG_PATH);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(CONFIG_PATH, encryptObject(obj), 'utf8');
}

/**
 * Fetch name and contact info of the customer from local database Users table
 */
function getCustomerDetails() {
  try {
    const db = getDb();
    const admins = db.prepare("SELECT name, username, contact, contact_email, contact_number, created_at FROM Users WHERE role = 'admin'").all();
    
    // Scan all admin accounts. Choose the one that has non-empty email or contact number.
    let chosen = null;
    for (const admin of admins) {
      const contact = admin.contact ? decrypt(admin.contact) : '';
      const email = admin.contact_email ? decrypt(admin.contact_email) : '';
      const number = admin.contact_number ? decrypt(admin.contact_number) : '';
      
      const realEmail = email || (contact && contact.includes('@') ? contact : '');
      const realNumber = number || (contact && !contact.includes('@') ? contact : '');

      if (realEmail || realNumber) {
        chosen = {
          name: decrypt(admin.name) || 'Admin User',
          username: decrypt(admin.username) || 'admin',
          contact_email: realEmail || 'Not Provided',
          contact_number: realNumber || 'Not Provided',
          created_at: admin.created_at || 'Not Provided'
        };
        break;
      }
    }

    if (chosen) return chosen;

    if (admins.length > 0) {
      const admin = admins[0];
      const contact = admin.contact ? decrypt(admin.contact) : '';
      return {
        name: decrypt(admin.name) || 'Admin User',
        username: decrypt(admin.username) || 'admin',
        contact_email: (admin.contact_email ? decrypt(admin.contact_email) : null) || contact || 'Not Provided',
        contact_number: (admin.contact_number ? decrypt(admin.contact_number) : null) || (contact && !contact.includes('@') ? contact : 'Not Provided'),
        created_at: admin.created_at || 'Not Provided'
      };
    }
  } catch (err) {
    // silent fallback
  }
  return { name: 'Admin User', username: 'admin', contact_email: 'Not Provided', contact_number: 'Not Provided', created_at: 'Not Provided' };
}

/**
 * Send licensing email to developer
 */
async function sendLicenseEmail(subject, text) {
  const log = getLogger();
  
  if (SMTP_CONFIG.auth.user.includes('your-sender-email') || SMTP_CONFIG.auth.pass.includes('your-gmail-app-password')) {
    log.warn('License Alert email skipped: SMTP credentials not configured by developer.');
    return false;
  }

  const customer = getCustomerDetails();
  const toEmail = RECEIVER_EMAIL;

  try {
    const transporter = nodemailer.createTransport(SMTP_CONFIG);
    const fromName = customer.name || 'Client Admin';
    const fromEmail = customer.contact_email && customer.contact_email.includes('@') ? customer.contact_email : SMTP_CONFIG.auth.user;
    await transporter.sendMail({
      from: `"${fromName}" <${fromEmail}>`,
      replyTo: fromEmail,
      to: toEmail,
      subject: subject,
      text: text,
    });
    log.info(`License alert email sent successfully: ${subject} to ${toEmail}`);
    return true;
  } catch (err) {
    log.error(`Failed to send license alert email: ${err.message}`);
    return false;
  }
}

/**
 * Handle background alerting (silent retry)
 */
async function sendAlertsInBackground(config, daysLeft) {
  const log = getLogger();
  let updated = false;
  const customer = getCustomerDetails();

  // Send only the 15-day Expiration Alert (with the current active activation key) to the developer.
  // Must check daysLeft > 0 to prevent triggering warning emails when the license has already expired.
  if (daysLeft <= 15 && daysLeft > 0 && !config.notified15Days) {
    log.info('Attempting 15-day license expiration warning email with active key...');
    const subject = `[RENEWAL KEY] License Expiring in 15 Days - ID: ${config.machineId}`;
    const text = `A client's software license is expiring soon (15 days remaining).\n\n` +
      `CLIENT DETAILS:\n` +
      `----------------------------------------\n` +
      `Customer Name:       ${customer.name}\n` +
      `Operator Username:   ${customer.username}\n` +
      `Contact Email:       ${customer.contact_email}\n` +
      `Contact Number:      ${customer.contact_number}\n` +
      `Account Created At:  ${customer.created_at}\n\n` +
      `LICENSE & MACHINE DETAILS:\n` +
      `----------------------------------------\n` +
      `Machine ID:          ${config.machineId}\n` +
      `Activation Key (for renewal): ${config.licenseKey}\n` +
      `Date of Renewal / Expiry: ${new Date(config.expiryTs).toLocaleDateString('en-GB')}\n` +
      `Days Remaining:      ${daysLeft}\n`;

    const sent = await sendLicenseEmail(subject, text);
    if (sent) {
      config.notified15Days = true;
      updated = true;
    }
  }

  if (updated) {
    saveConfig(config);
  }
}

/**
 * Run on every app launch.
 * Returns: { status: 'valid'|'expiring'|'expired', daysLeft: number, licenseKey: string }
 */
function checkLicense() {
  const log = getLogger();
  const machineId = machineIdSync({ original: true });
  let config = getConfig();

  if (!config) {
    // First launch — generate and save license
    const installTs  = Date.now();
    const expiryTs   = installTs + ONE_YEAR_MS;
    const licenseKey = generateLicenseKey(machineId, installTs);
    config = { 
      machineId, 
      installTs, 
      expiryTs, 
      licenseKey, 
      licenseSent: false,
      notified365Days: false,
      notified30Days: false,
      notified15Days: false,
      notified7Days: false,
      usedKeys: []
    };
    saveConfig(config);
    log.info(`First launch — license generated. Expires: ${new Date(expiryTs).toISOString()}`);
  }

  // Ensure these properties exist on loaded config (backward compatibility)
  if (config.licenseSent === undefined) config.licenseSent = false;
  if (config.notified365Days === undefined) config.notified365Days = false;
  if (config.notified30Days === undefined) config.notified30Days = false;
  if (config.notified15Days === undefined) config.notified15Days = false;
  if (config.notified7Days === undefined) config.notified7Days = false;
  if (config.usedKeys === undefined) config.usedKeys = [];

  const now      = Date.now();
  const msLeft   = config.expiryTs - now;
  const daysLeft = Math.ceil(msLeft / (24 * 60 * 60 * 1000));

  let status;
  if (daysLeft <= 0)  status = 'expired';
  else if (daysLeft <= 30) status = 'expiring';
  else                status = 'valid';

  log.info(`License check — status: ${status}, daysLeft: ${daysLeft}`);

  // Trigger background alerts
  sendAlertsInBackground(config, daysLeft).catch(err => {
    log.error(`Error in sendAlertsInBackground: ${err.message}`);
  });

  return { status, daysLeft, licenseKey: config.licenseKey, machineId, expiryTs: config.expiryTs };
}

/**
 * Attempt to renew the license with a key provided by the developer.
 */
async function renewLicense(keyInput) {
  const log = getLogger();
  const machineId = machineIdSync({ original: true });
  
  // 1. Decrypt and check if key matches machine ID
  const valid = validateRenewalKey(keyInput, machineId);
  if (!valid) {
    log.warn('License renewal failed — invalid key structure or machine mismatch');
    return false;
  }

  const config = getConfig() || {};
  config.usedKeys = config.usedKeys || [];

  // 2. Check if the key has already been used
  if (config.usedKeys.includes(keyInput)) {
    log.warn('License renewal failed — activation key has already been used');
    return false;
  }

  // 3. Mark this key as used immediately
  config.usedKeys.push(keyInput);

  // 4. Extend the software license for 1 full year
  config.expiryTs = Date.now() + ONE_YEAR_MS;

  // 5. Generate a brand new active license key for the upcoming year
  const newActiveKey = generateLicenseKey(machineId, Date.now());
  config.licenseKey = newActiveKey;

  // 6. Reset all warning flags
  config.licenseSent = false; // Set to false initially, will be marked true if immediate email succeeds or upon subsequent login
  config.notified365Days = false;
  config.notified30Days = false;
  config.notified15Days = false;
  config.notified7Days = false;

  // 7. Save config
  saveConfig(config);
  log.info('License renewed successfully. Expiry extended and new active key generated.');

  // 8. Send renewal email immediately
  try {
    const customer = getCustomerDetails();
    const subject = `[RENEWAL] Software License Renewed - Machine ID: ${config.machineId}`;
    const text = `A license renewal of Lalwani Software Solutions has been successfully completed.\n\n` +
      `CLIENT DETAILS:\n` +
      `----------------------------------------\n` +
      `Customer Name:       ${customer.name}\n` +
      `Operator Username:   ${customer.username}\n` +
      `Contact Email:       ${customer.contact_email}\n` +
      `Contact Number:      ${customer.contact_number}\n` +
      `Account Created At:  ${customer.created_at}\n\n` +
      `MACHINE & LICENSE DETAILS:\n` +
      `----------------------------------------\n` +
      `Machine ID:          ${config.machineId}\n` +
      `Activation Key:      ${config.licenseKey}\n` +
      `Software Created At: ${new Date(config.installTs).toLocaleString()}\n` +
      `Date of Renewal / Expiry: ${new Date(config.expiryTs).toLocaleDateString('en-GB')}\n` +
      `Days Remaining:      365\n` +
      `Activation/Renewal Date: ${new Date().toLocaleString()}\n`;

    const sent = await sendLicenseEmail(subject, text);
    if (sent) {
      config.licenseSent = true;
      saveConfig(config);
      log.info('Immediate renewal email notification sent successfully.');
    }
  } catch (err) {
    log.error(`Failed to send immediate renewal email: ${err.message}`);
  }

  return true;
}

/**
 * Open external WhatsApp link with prefilled alert message
 */
function openWhatsAppAlert(message) {
  const log = getLogger();
  try {
    const encoded = encodeURIComponent(message);
    const url = `https://wa.me/${DEVELOPER_WHATSAPP}?text=${encoded}`;
    shell.openExternal(url);
    log.info('Opened WhatsApp license alert in external browser');
    return true;
  } catch (err) {
    log.error(`Failed to open WhatsApp alert: ${err.message}`);
    return false;
  }
}

/**
 * Run on successful login.
 * Sends installation details to developer if not already sent.
 */
async function handleLoginAlerts(userRole, loggedInUser) {
  const log = getLogger();
  if (userRole === 'developer') {
    log.info('Developer login detected, skipping license email alerts.');
    return;
  }
  const config = getConfig();
  if (!config) return;

  if (!config.licenseSent) {
    const isRenewal = config.usedKeys && config.usedKeys.length > 0;
    log.info(`Successful login for role: ${userRole}. Attempting silent ${isRenewal ? 'renewal' : 'installation'} email notification...`);
    
    let customer;
    if (loggedInUser) {
      customer = {
        name: decrypt(loggedInUser.name) || 'Admin User',
        username: decrypt(loggedInUser.username) || 'admin',
        contact_email: (loggedInUser.contact_email ? decrypt(loggedInUser.contact_email) : null) || (loggedInUser.contact ? decrypt(loggedInUser.contact) : '') || 'Not Provided',
        contact_number: (loggedInUser.contact_number ? decrypt(loggedInUser.contact_number) : null) || (loggedInUser.contact && !decrypt(loggedInUser.contact).includes('@') ? decrypt(loggedInUser.contact) : '') || 'Not Provided',
        created_at: loggedInUser.created_at || 'Not Provided'
      };
    } else {
      customer = getCustomerDetails();
    }

    const subject = isRenewal
      ? `[RENEWAL] Software License Renewed - Machine ID: ${config.machineId}`
      : `[INSTALLATION] New Installation - Machine ID: ${config.machineId}`;

    const text = (isRenewal
      ? `A license renewal of Lalwani Software Solutions has been successfully completed.\n\n`
      : `A new instance of Lalwani Software Solutions has been installed and run.\n\n`) +
      `CLIENT DETAILS:\n` +
      `----------------------------------------\n` +
      `Customer Name:       ${customer.name}\n` +
      `Operator Username:   ${customer.username}\n` +
      `Contact Email:       ${customer.contact_email}\n` +
      `Contact Number:      ${customer.contact_number}\n` +
      `Account Created At:  ${customer.created_at}\n\n` +
      `MACHINE & LICENSE DETAILS:\n` +
      `----------------------------------------\n` +
      `Machine ID:          ${config.machineId}\n` +
      `Activation Key:      ${config.licenseKey}\n` +
      `Software Created At: ${new Date(config.installTs).toLocaleString()}\n` +
      `Date of Renewal / Expiry: ${new Date(config.expiryTs).toLocaleDateString('en-GB')}\n` +
      `Days Remaining:      365\n` +
      `Activation/Renewal Date: ${new Date().toLocaleString()}\n`;
    
    const sent = await sendLicenseEmail(subject, text);
    if (sent) {
      config.licenseSent = true;
      saveConfig(config);
    }
  }
}

async function sendNewUserCredentialsEmail(toEmail, name, userName, plainPassword) {
  const log = getLogger();
  if (SMTP_CONFIG.auth.user.includes('your-sender-email') || SMTP_CONFIG.auth.pass.includes('your-gmail-app-password')) {
    log.warn('Account Credentials email skipped: SMTP credentials not configured.');
    return false;
  }
  try {
    const transporter = nodemailer.createTransport(SMTP_CONFIG);
    const subject = 'Welcome to Lalwani Software Solutions - Your Account Details';
    const text = `Dear ${name},\n\n` +
      `Your account has been created successfully in Lalwani Software Solutions.\n\n` +
      `Here are your login credentials:\n` +
      `Username: ${userName}\n` +
      `Password: ${plainPassword}\n\n` +
      `Please log in using the desktop application.\n\n` +
      `Best regards,\n` +
      `Lalwani Software Solutions Team`;

    await transporter.sendMail({
      from: `"Lalwani Software Solutions" <${SMTP_CONFIG.auth.user}>`,
      to: toEmail,
      subject: subject,
      text: text,
    });
    log.info(`Account credentials email sent to ${toEmail}`);
    return true;
  } catch (err) {
    log.error(`Failed to send account credentials email to ${toEmail}: ${err.message}`);
    return false;
  }
}

module.exports = { checkLicense, renewLicense, openWhatsAppAlert, handleLoginAlerts, sendNewUserCredentialsEmail };
