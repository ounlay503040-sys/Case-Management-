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
  // Fix for Google OAuth "400 invalid_request" block for Embedded Browsers
  app.userAgentFallback = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";

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

  // Google OAuth via System Browser
  const http = require('http');
  const { shell } = require('electron');
  const url = require('url');

  ipcMain.handle('google-auth', async (event, clientId) => {
    return new Promise((resolve, reject) => {
      let server;
      try {
        server = http.createServer((req, res) => {
          const reqUrl = url.parse(req.url, true);
          if (reqUrl.pathname === '/callback') {
            // Serve HTML to parse hash fragment and send to /store-token
            res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
            res.end(`
              <html>
              <body>
                <h2>កំពុងដំណើរការ (Processing)...</h2>
                <script>
                  const hash = window.location.hash.substring(1);
                  const params = new URLSearchParams(hash);
                  const token = params.get('access_token');
                  const error = params.get('error') || new URLSearchParams(window.location.search).get('error');
                  if (token) {
                    fetch('/store-token?token=' + encodeURIComponent(token))
                      .then(() => {
                        document.body.innerHTML = '<h2 style="color:green;">ជោគជ័យ! អ្នកអាចបិទផ្ទាំងនេះបាន។ (Success! You can close this tab)</h2>';
                        setTimeout(() => window.close(), 2000);
                      });
                  } else if (error) {
                    fetch('/store-token?error=' + encodeURIComponent(error))
                      .then(() => {
                        document.body.innerHTML = '<h2 style="color:red;">បរាជ័យ (Error): ' + error + '</h2>';
                      });
                  } else {
                    document.body.innerHTML = '<h2 style="color:red;">រកមិនឃើញកូដភ្ជាប់ទេ (No token found)</h2>';
                  }
                </script>
              </body>
              </html>
            `);
          } else if (reqUrl.pathname === '/store-token') {
            const token = reqUrl.query.token;
            const error = reqUrl.query.error;
            res.writeHead(200, { 'Content-Type': 'text/plain' });
            res.end('OK');
            
            if (token) {
              resolve({ access_token: token });
            } else {
              reject(new Error(error || 'No token provided'));
            }
            
            // Close server after resolving
            if (server) {
              server.close();
              server = null;
            }
          } else {
            res.writeHead(404);
            res.end();
          }
        });
        
        server.listen(3456, '127.0.0.1', () => {
          const redirectUri = encodeURIComponent('http://127.0.0.1:3456/callback');
          const scope = encodeURIComponent('https://www.googleapis.com/auth/calendar.events');
          const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}&redirect_uri=${redirectUri}&response_type=token&scope=${scope}&prompt=consent`;
          
          shell.openExternal(authUrl);
        });
        
        // Timeout after 5 minutes
        setTimeout(() => {
          if (server) {
            server.close();
            reject(new Error('Authentication timeout'));
          }
        }, 5 * 60 * 1000);
        
      } catch (err) {
        if (server) server.close();
        reject(err);
      }
    });
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
