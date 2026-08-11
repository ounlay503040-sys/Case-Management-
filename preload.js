const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  setZoom: (level) => ipcRenderer.send('set-zoom', level),
  getZoom: () => ipcRenderer.invoke('get-zoom'),
  generatePDF: () => ipcRenderer.invoke('generate-pdf')
});
