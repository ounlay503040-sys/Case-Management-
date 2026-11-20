const { app, BrowserWindow, dialog, ipcMain } = require('electron');
const path = require('path');
const { autoUpdater } = require('electron-updater');

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 640,
    minHeight: 480,
    icon: path.join(__dirname, 'favicon.ico'),
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    },
    // Custom title bar: the page draws the bar and its own Mac-style
    // close / minimize / maximize buttons (see "win:*" handlers below).
    titleBarStyle: 'hidden',
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
  const sendMax = () => { try { mainWindow.webContents.send('win:maximized', mainWindow.isMaximized()); } catch (e) {} };
  mainWindow.on('maximize', sendMax);
  mainWindow.on('unmaximize', sendMax);

  mainWindow.on('closed', function () {
    mainWindow = null;
  });
}

const gotTheLock = app.requestSingleInstanceLock();

if (!gotTheLock) {
  app.quit();
} else {
  app.on('second-instance', (event, commandLine, workingDirectory) => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.show();
      mainWindow.focus();
    }
  });

  app.whenReady().then(() => {
    // Export all data
    ipcMain.on('data:export-all', (event, jsonData) => {
      try {
        const backupPath = path.join(app.getPath('userData'), `backup-all-${Date.now()}.json`);
        const fs = require('fs');
        fs.writeFileSync(backupPath, jsonData);
        dialog.showMessageBox({
          type: 'info',
          title: 'នាំចេញជោគជ័យ',
          message: `ទិន្នន័យទាំងអស់ត្រូវបានរក្សាទុកដោយជោគជ័យនៅ៖\n${backupPath}`
        });
      } catch (e) {
        dialog.showErrorBox('បរាជ័យក្នុងការនាំចេញ', e.toString());
      }
    });

    // Automatic daily backup of case data to Documents\NADR CMS Backups (keeps the newest 30 days)
    ipcMain.handle('backup:auto-save', async (event, jsonData) => {
      const fs = require('fs');
      const dir = path.join(app.getPath('documents'), 'NADR CMS Backups');
      fs.mkdirSync(dir, { recursive: true });
      const d = new Date();
      const pad = n => String(n).padStart(2, '0');
      const file = path.join(dir, `NADR_AutoBackup_${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}.json`);
      const tmp = file + '.tmp';
      fs.writeFileSync(tmp, jsonData, 'utf8');
      fs.renameSync(tmp, file);
      const old = fs.readdirSync(dir)
        .filter(f => /^NADR_AutoBackup_\d{4}-\d{2}-\d{2}\.json$/.test(f))
        .sort()
        .reverse()
        .slice(30);
      old.forEach(f => { try { fs.unlinkSync(path.join(dir, f)); } catch (e) {} });
      return file;
    });

    ipcMain.handle('backup:get-folder', () => path.join(app.getPath('documents'), 'NADR CMS Backups'));

    ipcMain.handle('app:get-version', () => app.getVersion());

    // The window buttons are drawn by the page now; kept so older calls do nothing.
    ipcMain.on('titlebar:set-theme', () => {});

    // Mac-style window buttons drawn by the page
    ipcMain.on('win:minimize', () => { if (mainWindow) mainWindow.minimize(); });
    ipcMain.on('win:toggle-maximize', () => {
      if (!mainWindow) return;
      if (mainWindow.isMaximized()) mainWindow.unmaximize(); else mainWindow.maximize();
    });
    ipcMain.on('win:close', () => { if (mainWindow) mainWindow.close(); });
    ipcMain.on('win:set-fullscreen', (e, on) => { if (mainWindow) mainWindow.setFullScreen(!!on); });
    ipcMain.handle('win:is-maximized', () => !!(mainWindow && mainWindow.isMaximized()));

    // Toggle DevTools for admins
    ipcMain.on('toggle-dev-tools', (event) => {
      if (mainWindow && mainWindow.webContents) {
        mainWindow.webContents.toggleDevTools();
      }
    });

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

  const { shell } = require('electron');

  // Handle opening local folders or URLs
  ipcMain.on('open-folder', (event, folderPath) => {
    if (!folderPath) return;
    if (folderPath.startsWith('http://') || folderPath.startsWith('https://')) {
      shell.openExternal(folderPath);
    } else {
      shell.openPath(folderPath);
    }
  });

  // Pick a case folder on this computer (letters are saved inside it)
  ipcMain.handle('dialog:pick-folder', async (event, startPath) => {
    const fs = require('fs');
    const opts = { title: 'ជ្រើស Folder សំណុំរឿង', properties: ['openDirectory'] };
    if (startPath && fs.existsSync(startPath)) opts.defaultPath = startPath;
    const r = await dialog.showOpenDialog(mainWindow, opts);
    return (r.canceled || !r.filePaths.length) ? '' : r.filePaths[0];
  });
  ipcMain.handle('fs:folder-exists', (event, p) => {
    try { return !!p && require('fs').statSync(p).isDirectory(); } catch (e) { return false; }
  });

  // ---- Letters: fill a .docx template and open it in Word ----
  let letterEngine = null;
  const engine = () => (letterEngine = letterEngine || require('./lib/letter-engine.js'));
  ipcMain.handle('letters:tags', (event, templateId) => {
    try {
      const p = engine().listTemplates()[templateId];
      if (!p) return { ok: false, error: 'រកគម្រូមិនឃើញ៖ ' + templateId };
      return { ok: true, tags: engine().inspectTemplate(p) };
    } catch (e) { return { ok: false, error: e.message }; }
  });
  ipcMain.handle('letters:generate', async (event, req) => {
    const fs = require('fs');
    try {
      const { templateId, data, dir, fileName, open } = req || {};
      const p = engine().listTemplates()[templateId];
      if (!p) return { ok: false, error: 'រកគម្រូមិនឃើញ៖ ' + templateId };
      if (!dir || !fileName) return { ok: false, error: 'មិនទាន់មានទីតាំងរក្សាទុក' };
      const ZW = /[​-‍⁠﻿]/g;
      const cleanDir = path.normalize(String(dir).replace(ZW, ''));
      let base = String(fileName).replace(ZW, '').replace(/[\\/:*?"<>|]/g, '-').replace(/\.docx$/i, '').trim();
      // Keep the full path ≤ 240 characters, leaving room for " (99).docx".
      const MAX = 240, room = MAX - (cleanDir.length + 1) - ' (99).docx'.length;
      if (room < 12) return { ok: false, error: `ផ្លូវ Folder វែងពេក (${cleanDir.length} តួអក្សរ)។ សូមជ្រើស Folder សំណុំរឿងដែលខ្លីជាងនេះ។` };
      let shortened = false;
      if (base.length > room) {
        base = base.slice(0, room).replace(/[\p{M}្]+$/u, '');
        // Don't leave a half "(…" at the end.
        const open = base.lastIndexOf('(');
        if (open > 8 && open > base.lastIndexOf(')')) base = base.slice(0, open);
        base = base.replace(/[\s\-–,(]+$/, '').trim();
        shortened = true;
      }
      const r = engine().renderTemplate(p, data || {});
      fs.mkdirSync(cleanDir, { recursive: true });
      // Never overwrite: "name.docx" → "name (2).docx" → "name (3).docx" …
      let out = path.join(cleanDir, base + '.docx');
      for (let i = 2; fs.existsSync(out); i++) out = path.join(cleanDir, `${base} (${i}).docx`);
      fs.writeFileSync(out, r.buffer, { flag: 'wx' });
      if (open !== false) {
        const err = await shell.openPath(out);
        if (err) return { ok: true, path: out, shortened, openError: err };
      }
      return { ok: true, path: out, shortened };
    } catch (e) { return { ok: false, error: e.message, details: e.details || [] }; }
  });

  // Native PDF Generation Handler (Prints the current window to PDF, ensuring all fonts are loaded)
  ipcMain.handle('generate-pdf', async (event, customOptions = {}) => {
    // The window's navy background colour shows in the PDF page margins; print on white.
    const win = BrowserWindow.fromWebContents(event.sender);
    const prevBg = win ? win.getBackgroundColor() : null;
    if (win) win.setBackgroundColor('#ffffff');
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
    } finally {
      if (win && prevBg) win.setBackgroundColor(prevBg);
    }
  });

  // Google OAuth via System Browser
  const http = require('http');
  const url = require('url');

  let activeAuthServer = null;

  ipcMain.handle('google-auth', async (event, clientId) => {
    return new Promise((resolve, reject) => {
      // Close existing server if user clicks multiple times
      if (activeAuthServer) {
        try { activeAuthServer.close(); } catch(e) {}
        activeAuthServer = null;
      }

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
            if (activeAuthServer === server) {
              server.close();
              activeAuthServer = null;
            }
          } else {
            res.writeHead(404);
            res.end();
          }
        });
        
        activeAuthServer = server;

        server.listen(3456, '127.0.0.1', () => {
          const redirectUri = encodeURIComponent('http://127.0.0.1:3456/callback');
          const scope = encodeURIComponent('https://www.googleapis.com/auth/calendar.events');
          const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}&redirect_uri=${redirectUri}&response_type=token&scope=${scope}&prompt=consent`;
          
          shell.openExternal(authUrl);
        });
        
        // Timeout after 5 minutes
        setTimeout(() => {
          if (activeAuthServer === server) {
            server.close();
            activeAuthServer = null;
            reject(new Error('Authentication timeout'));
          }
        }, 5 * 60 * 1000);
        
      } catch (err) {
        if (activeAuthServer === server) {
          server.close();
          activeAuthServer = null;
        }
        reject(err);
      }
    });
  });

  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});
}

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
