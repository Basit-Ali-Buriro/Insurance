'use strict';
const path = require('path');
const { app, BrowserWindow, ipcMain } = require('electron');

const { initializeDatabase } = require('./database');
const { registerAllHandlers } = require('./ipcHandlers');
const { checkLicense }        = require('./licenseManager');
const { getLogger }           = require('./logger');

const isDev = !app.isPackaged;

let mainWindow = null;

function createWindow() {
  mainWindow = new BrowserWindow({
    width:  1280,
    height: 800,
    minWidth:  1024,
    minHeight: 680,
    show: false,
    frame: true,
    backgroundColor: '#0f1117',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
    },
    icon: path.join(__dirname, '..', 'assets', 'icon.png'),
  });

  if (isDev) {
    mainWindow.webContents.session.clearCache().then(() => {
      mainWindow.loadURL('http://127.0.0.1:5173');
    }).catch(err => {
      console.error('Failed to clear cache:', err);
      mainWindow.loadURL('http://127.0.0.1:5173');
    });
    mainWindow.webContents.openDevTools({ mode: 'detach' });
  } else {
    mainWindow.loadFile(path.join(__dirname, '..', 'dist', 'index.html'));
  }

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
    getLogger().info('Main window shown');
  });

  mainWindow.on('closed', () => { mainWindow = null; });
}

app.whenReady().then(() => {
  const log = getLogger();

  try {
    initializeDatabase();
    log.info('Database ready');
  } catch (err) {
    log.error(`Database init error: ${err.message}`);
  }

  // Run license check and pass result to renderer via a global
  let licenseInfo = { status: 'valid', daysLeft: 365 };
  try {
    licenseInfo = checkLicense();
  } catch (err) {
    log.error(`License check error: ${err.message}`);
  }

  registerAllHandlers();

  // Allow renderer to get initial license state synchronously
  ipcMain.handle('app:getLicenseInfo', () => licenseInfo);
  ipcMain.handle('app:getVersion',     () => app.getVersion());

  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
