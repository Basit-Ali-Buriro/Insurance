'use strict';
const path      = require('path');
const fs        = require('fs');
const { app }   = require('electron');
const { machineIdSync } = require('node-machine-id');
const { encryptObject, decryptObject, generateLicenseKey, validateRenewalKey } = require('./crypto');
const { getLogger } = require('./logger');

const CONFIG_PATH = path.join(app.getPath('userData'), 'appdata', '.lc');
const ONE_YEAR_MS = 365 * 24 * 60 * 60 * 1000;

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
    config = { machineId, installTs, expiryTs, licenseKey, licenseSent: false };
    saveConfig(config);
    log.info(`First launch — license generated. Expires: ${new Date(expiryTs).toISOString()}`);
  }

  const now      = Date.now();
  const msLeft   = config.expiryTs - now;
  const daysLeft = Math.ceil(msLeft / (24 * 60 * 60 * 1000));

  let status;
  if (daysLeft <= 0)  status = 'expired';
  else if (daysLeft <= 30) status = 'expiring';
  else                status = 'valid';

  log.info(`License check — status: ${status}, daysLeft: ${daysLeft}`);
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
  config.expiryTs    = Date.now() + ONE_YEAR_MS;
  config.licenseKey  = keyInput;
  config.licenseSent = false;
  saveConfig(config);
  log.info('License renewed successfully for 1 year');
  return true;
}

module.exports = { checkLicense, renewLicense };
