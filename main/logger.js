'use strict';
const path = require('path');
const fs = require('fs');
const { app } = require('electron');
const winston = require('winston');

let _logger = null;

function getLogger() {
  if (_logger) return _logger;

  const logDir = path.join(app.getPath('userData'), 'logs');
  if (!fs.existsSync(logDir)) fs.mkdirSync(logDir, { recursive: true });

  _logger = winston.createLogger({
    level: 'info',
    format: winston.format.combine(
      winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
      winston.format.printf(({ timestamp, level, message }) => {
        return `[${timestamp}] ${level.toUpperCase()}: ${message}`;
      })
    ),
    transports: [
      new winston.transports.File({
        filename: path.join(logDir, 'app.log'),
        maxsize: 5 * 1024 * 1024, // 5MB
        maxFiles: 5,
        tailable: true,
      }),
    ],
  });

  return _logger;
}

module.exports = { getLogger };
