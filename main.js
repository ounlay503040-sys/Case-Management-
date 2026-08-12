const { app, BrowserWindow, dialog, ipcMain } = require('electron');
const path = require('path');
const { autoUpdater } = require('electron-updater');

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 1024,
    minHeight: 768,
    icon: path.join(__dirname, 'favicon.ico'),
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    },
    show: false, // Wait until ready-to-show to prevent visual flash
    backgroundColor: '#0a1128'
  });

  // Remove default menu bar for a cleaner app look
  mainWindow.setMenuBarVisibility(false);

  // Set initial zoom factor to 80%
  mainWindow.webContents.setZoomFactor(0.8);

  // Load the app's index.html
  mainWindow.loadFile('index.html');

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  mainWindow.on('closed', function () {
    mainWindow = null;
  });
}

app.whenReady().then(() => {
  createWindow();

  // Check for updates
  autoUpdater.checkForUpdatesAndNotify();

  // Zoom handlers
  ipcMain.on('set-zoom', (event, level) => {
    if (mainWindow && mainWindow.webContents) {
      mainWindow.webContents.setZoomFactor(level);
    }
  });

  ipcMain.handle('get-zoom', (event) => {
    if (mainWindow && mainWindow.webContents) {
      return mainWindow.webContents.getZoomFactor();
    }
    return 1;
  });

  // Native PDF Generation Handler (Prints the current window to PDF, ensuring all fonts are loaded)
  ipcMain.handle('generate-pdf', async (event, customOptions = {}) => {
    try {
      const options = {
        landscape: true,
        printBackground: true,
        pageSize: 'A4',
        margins: { marginType: 'printableArea' },
        ...customOptions
      };
      const pdfBuffer = await event.sender.printToPDF(options);
      return pdfBuffer;
    } catch (error) {
      console.error('Failed to generate PDF:', error);
      throw error;
    }
  });

  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') app.quit();
});

// Auto Updater Events
autoUpdater.on('update-available', () => {
  dialog.showMessageBox({
    type: 'info',
    title: 'មានកំណែថ្មី (Update Available)',
    message: 'កំណែថ្មីនៃកម្មវិធីត្រូវបានរកឃើញ។ តើអ្នកចង់ទាញយកវាឥឡូវនេះទេ?',
    buttons: ['យល់ព្រម (Yes)', 'ពេលក្រោយ (Later)']
  }).then(result => {
    if (result.response === 0) {
      // User clicked Yes, start downloading
      autoUpdater.downloadUpdate();
    }
  });
});

autoUpdater.on('update-downloaded', () => {
  dialog.showMessageBox({
    type: 'info',
    title: 'ទាញយករួចរាល់ (Update Ready)',
    message: 'កំណែថ្មីត្រូវបានទាញយករួចរាល់ហើយ។ កម្មវិធីនឹងចាប់ផ្តើមឡើងវិញដើម្បីដំឡើងកំណែថ្មីនេះ។',
    buttons: ['ចាប់ផ្តើមឡើងវិញឥឡូវនេះ (Restart Now)']
  }).then(() => {
    autoUpdater.quitAndInstall(false, true);
  });
});

autoUpdater.on('error', (err) => {
  console.error('Error in auto-updater. ' + err);
});
