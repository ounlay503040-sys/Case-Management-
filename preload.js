const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  setZoom: (level) => ipcRenderer.send('set-zoom', level),
  getZoom: () => ipcRenderer.invoke('get-zoom'),
  generatePDF: (options) => ipcRenderer.invoke('generate-pdf', options),
  googleAuth: (clientId) => ipcRenderer.invoke('google-auth', clientId),
  openFolder: (folderPath) => ipcRenderer.send('open-folder', folderPath),
  pickFolder: (startPath) => ipcRenderer.invoke('dialog:pick-folder', startPath || ''),
  folderExists: (p) => ipcRenderer.invoke('fs:folder-exists', p),
  letterTags: (templateId) => ipcRenderer.invoke('letters:tags', templateId),
  generateLetter: (req) => ipcRenderer.invoke('letters:generate', req),
  exportAll: (data) => ipcRenderer.send('data:export-all', data),
  autoBackup: (json) => ipcRenderer.invoke('backup:auto-save', json),
  getBackupFolder: () => ipcRenderer.invoke('backup:get-folder'),
  getAppVersion: () => ipcRenderer.invoke('app:get-version'),
  setTitleBarTheme: (dark) => ipcRenderer.send('titlebar:set-theme', !!dark),
  toggleDevTools: () => ipcRenderer.send('toggle-dev-tools')
});
