'use strict';
const crypto = require('crypto');

// 32-byte key derived from passphrase
const PASSPHRASE = 'InsurancePMS_AES256_SecretKey_Dev2026!';
const KEY = crypto.createHash('sha256').update(PASSPHRASE).digest();
const IV_LENGTH = 16;

/**
 * Encrypt a string value (AES-256-CBC with random IV)
 * @param {string|null} text
 * @returns {string|null}
 */
function encrypt(text) {
  if (text === null || text === undefined) return null;
  const str = String(text);
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv('aes-256-cbc', KEY, iv);
  let encrypted = cipher.update(str, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return iv.toString('hex') + ':' + encrypted;
}

/**
 * Decrypt a string value
 * @param {string|null} text
 * @returns {string} decrypted value or 'DATA_ERROR' if corrupted
 */
function decrypt(text) {
  if (text === null || text === undefined) return null;
  try {
    const colonIdx = text.indexOf(':');
    if (colonIdx === -1) return 'DATA_ERROR';
    const iv = Buffer.from(text.substring(0, colonIdx), 'hex');
    const encryptedText = text.substring(colonIdx + 1);
    const decipher = crypto.createDecipheriv('aes-256-cbc', KEY, iv);
    let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  } catch {
    return 'DATA_ERROR';
  }
}

/**
 * Encrypt a JS object into a single encrypted string (for config files)
 */
function encryptObject(obj) {
  const json = JSON.stringify(obj);
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv('aes-256-cbc', KEY, iv);
  let encrypted = cipher.update(json, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return iv.toString('hex') + ':' + encrypted;
}

/**
 * Decrypt an object from an encrypted string
 */
function decryptObject(text) {
  try {
    const colonIdx = text.indexOf(':');
    if (colonIdx === -1) return null;
    const iv = Buffer.from(text.substring(0, colonIdx), 'hex');
    const encryptedText = text.substring(colonIdx + 1);
    const decipher = crypto.createDecipheriv('aes-256-cbc', KEY, iv);
    let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return JSON.parse(decrypted);
  } catch {
    return null;
  }
}

/**
 * Generate a machine-bound license key
 */
function generateLicenseKey(machineId, installTimestamp, salt = 'LIC_SALT_DEV_2026') {
  const input = `${machineId}|${installTimestamp}|${salt}`;
  return encrypt(input);
}

/**
 * Validate a renewal key against current machine
 */
function validateRenewalKey(keyInput, machineId, salt = 'LIC_SALT_DEV_2026') {
  try {
    const decoded = decrypt(keyInput);
    if (decoded === 'DATA_ERROR') return false;
    const parts = decoded.split('|');
    if (parts.length < 2) return false;
    return parts[0] === machineId;
  } catch {
    return false;
  }
}

module.exports = { encrypt, decrypt, encryptObject, decryptObject, generateLicenseKey, validateRenewalKey };
