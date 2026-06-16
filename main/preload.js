'use strict';
const { contextBridge, ipcRenderer } = require('electron');

// Expose a safe, typed API to the renderer process
contextBridge.exposeInMainWorld('electronAPI', {
  // App
  getLicenseInfo: ()       => ipcRenderer.invoke('app:getLicenseInfo'),
  getVersion:     ()       => ipcRenderer.invoke('app:getVersion'),

  // Auth
  login: (creds)           => ipcRenderer.invoke('auth:login', creds),

  // License
  licenseCheck:  ()        => ipcRenderer.invoke('license:check'),
  licenseRenew:  (key)     => ipcRenderer.invoke('license:renew', key),

  // Users
  listUsers:     ()        => ipcRenderer.invoke('users:list'),
  createUser:    (d)       => ipcRenderer.invoke('users:create', d),
  updateUser:    (d)       => ipcRenderer.invoke('users:update', d),
  deleteUser:    (id)      => ipcRenderer.invoke('users:delete', id),
  changePassword:(d)       => ipcRenderer.invoke('users:changePassword', d),
  updateProfile: (d)       => ipcRenderer.invoke('users:updateProfile', d),

  // Area Managers
  listAM:   ()             => ipcRenderer.invoke('am:list'),
  createAM: (d)            => ipcRenderer.invoke('am:create', d),
  updateAM: (d)            => ipcRenderer.invoke('am:update', d),
  deleteAM: (id)           => ipcRenderer.invoke('am:delete', id),

  // SSM
  listSSM:   ()            => ipcRenderer.invoke('ssm:list'),
  createSSM: (d)           => ipcRenderer.invoke('ssm:create', d),
  updateSSM: (d)           => ipcRenderer.invoke('ssm:update', d),
  deleteSSM: (id)          => ipcRenderer.invoke('ssm:delete', id),

  // SM
  listSM:   ()             => ipcRenderer.invoke('sm:list'),
  createSM: (d)            => ipcRenderer.invoke('sm:create', d),
  updateSM: (d)            => ipcRenderer.invoke('sm:update', d),
  deleteSM: (id)           => ipcRenderer.invoke('sm:delete', id),

  // SR
  listSR:        ()        => ipcRenderer.invoke('sr:list'),
  createSR:      (d)       => ipcRenderer.invoke('sr:create', d),
  updateSR:      (d)       => ipcRenderer.invoke('sr:update', d),
  deleteSR:      (id)      => ipcRenderer.invoke('sr:delete', id),
  uploadSRImage: (d)       => ipcRenderer.invoke('sr:uploadImage', d),
  uploadRecruitmentFile: (d) => ipcRenderer.invoke('recruitment:uploadFile', d),
  openFile: (filePath)     => ipcRenderer.invoke('app:openFile', filePath),

  // Proposer
  listProposers:          ()   => ipcRenderer.invoke('proposer:list'),
  createProposer:         (d)  => ipcRenderer.invoke('proposer:create', d),
  updateProposer:         (d)  => ipcRenderer.invoke('proposer:update', d),
  deleteProposer:         (id) => ipcRenderer.invoke('proposer:delete', id),
  convertProposerToPolicy:(id) => ipcRenderer.invoke('proposer:convertToPolicy', id),

  // Policy
  listPolicies:  ()        => ipcRenderer.invoke('policy:list'),
  createPolicy:  (d)       => ipcRenderer.invoke('policy:create', d),
  updatePolicy:  (d)       => ipcRenderer.invoke('policy:update', d),
  deletePolicy:  (id)      => ipcRenderer.invoke('policy:delete', id),
  exportPolicyExcel: (d)   => ipcRenderer.invoke('policy:exportExcel', d),

  // Notifications
  listNotifications:    ()    => ipcRenderer.invoke('notifications:list'),
  notificationCount:    ()    => ipcRenderer.invoke('notifications:count'),
  markWhatsapp:         (id)  => ipcRenderer.invoke('notifications:markWhatsapp', id),
  openWhatsapp:         (d)   => ipcRenderer.invoke('notifications:openWhatsapp', d),

  // Dashboard
  dashboardKpis:   ()         => ipcRenderer.invoke('dashboard:kpis'),
  saveTarget:      (d)        => ipcRenderer.invoke('dashboard:saveTarget', d),
  exportDashboardPDF: ()      => ipcRenderer.invoke('dashboard:exportPDF'),

  // Business Figure
  srFigure:  (d)              => ipcRenderer.invoke('business:srFigure', d),
  smFigure:  (d)              => ipcRenderer.invoke('business:smFigure', d),
  ssmFigure: (d)              => ipcRenderer.invoke('business:ssmFigure', d),
  exportBusinessPDF: (d)      => ipcRenderer.invoke('business:exportPDF', d),
  exportBusinessExcel: (d)    => ipcRenderer.invoke('business:exportExcel', d),

  // Config
  getConfig: (key)            => ipcRenderer.invoke('config:get', key),
  setConfig: (d)              => ipcRenderer.invoke('config:set', d),

  // Backup
  downloadBackup: ()          => ipcRenderer.invoke('backup:download'),

  // Database Reset / Seed
  resetDatabase:  ()          => ipcRenderer.invoke('database:reset'),
  seedDatabase:   ()          => ipcRenderer.invoke('database:seed'),
});
