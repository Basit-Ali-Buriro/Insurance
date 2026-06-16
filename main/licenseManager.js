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

const RECEIVER_EMAIL = 'basit.web24@gmail.com'; // Your email address where you want to receive alerts
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
    const admin = db.prepare("SELECT name, username, contact, contact_email, contact_number, created_at FROM Users WHERE role = 'admin' LIMIT 1").get();
    if (admin) {
      const decryptedContact = admin.contact ? decrypt(admin.contact) : '';
      return {
        name: decrypt(admin.name) || 'Admin User',
        username: decrypt(admin.username) || 'admin',
        contact_email: (admin.contact_email ? decrypt(admin.contact_email) : null) || decryptedContact || 'Not Provided',
        contact_number: (admin.contact_number ? decrypt(admin.contact_number) : null) || (decryptedContact && !decryptedContact.includes('@') ? decryptedContact : 'Not Provided'),
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

  // 1-Year Warning removed to prevent conflict with initial installation emails

  // 3. 30-Day Expiration Alert
  if (daysLeft <= 30 && daysLeft > 7 && !config.notified30Days) {
    log.info('Attempting 30-day license expiration warning email...');
    const subject = `[ALERT] License Expiring Soon (30 Days) - ID: ${config.machineId}`;
    const text = `License warning (30 days remaining).\n\n` +
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
      `Date of Renewal / Expiry: ${new Date(config.expiryTs).toLocaleDateString('en-GB')}\n` +
      `Days Remaining:      ${daysLeft}\n`;

    const sent = await sendLicenseEmail(subject, text);
    if (sent) {
      config.notified30Days = true;
      updated = true;
    }
  }

  // 15-Day Expiration Alert (with auto-generated new activation key for the developer)
  if (daysLeft <= 15 && !config.notified15Days) {
    log.info('Attempting 15-day license expiration warning email with renewal key...');
    const newRenewalKey = generateLicenseKey(config.machineId, Date.now());
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
      `Current Activation Key: ${config.licenseKey}\n` +
      `NEW Generated Activation Key (for renewal): ${newRenewalKey}\n\n` +
      `Date of Renewal / Expiry: ${new Date(config.expiryTs).toLocaleDateString('en-GB')}\n` +
      `Days Remaining:      ${daysLeft}\n`;

    const sent = await sendLicenseEmail(subject, text);
    if (sent) {
      config.notified15Days = true;
      updated = true;
    }
  }

  // 4. 7-Day Expiration Alert
  if (daysLeft <= 7 && !config.notified7Days) {
    log.info('Attempting 7-day license expiration warning email...');
    const subject = `[URGENT] License Expiring Soon (7 Days) - ID: ${config.machineId}`;
    const text = `License critical warning (7 days remaining).\n\n` +
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
      `Date of Renewal / Expiry: ${new Date(config.expiryTs).toLocaleDateString('en-GB')}\n` +
      `Days Remaining:      ${daysLeft}\n`;

    const sent = await sendLicenseEmail(subject, text);
    if (sent) {
      config.notified7Days = true;
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
      notified7Days: false
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
function renewLicense(keyInput) {
  const log = getLogger();
  const machineId = machineIdSync({ original: true });
  const valid = validateRenewalKey(keyInput, machineId);
  if (!valid) {
    log.warn('License renewal failed — invalid key');
    return false;
  }
  const config = getConfig() || {};
  config.expiryTs     = Date.now() + ONE_YEAR_MS;
  config.licenseKey   = keyInput;
  config.licenseSent  = false; // Re-send details on renewal
  config.notified365Days = false; // Reset 1-year alert
  config.notified30Days = false;
  config.notified15Days = false;
  config.notified7Days  = false;
  saveConfig(config);
  log.info('License renewed successfully for 1 year');
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
  const config = getConfig();
  if (!config) return;

  if (!config.licenseSent) {
    log.info(`Successful login for role: ${userRole}. Attempting silent installation email notification...`);
    
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

    const subject = `[INSTALLATION] New Installation - Machine ID: ${config.machineId}`;
    const text = `A new instance of Lalwani Software Solutions has been installed and run.\n\n` +
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
      `Installation Date:   ${new Date(config.installTs).toLocaleString()}\n`;
    
    const sent = await sendLicenseEmail(subject, text);
    if (sent) {
      config.licenseSent = true;
      saveConfig(config);
    }
  }
}

module.exports = { checkLicense, renewLicense, openWhatsAppAlert, handleLoginAlerts };
