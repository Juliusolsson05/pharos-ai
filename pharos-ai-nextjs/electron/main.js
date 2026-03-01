const { app, BrowserWindow, Menu, utilityProcess } = require('electron');
const path = require('path');
const net  = require('net');

const isDev     = !app.isPackaged;
const DEV_URL   = 'http://localhost:3000';
const PROD_PORT = 3745;

let nextChild = null;

// ─── Wait until a TCP port accepts connections ────────────────────────────────
function waitForPort(port, timeoutMs = 30_000) {
  return new Promise((resolve, reject) => {
    const deadline = Date.now() + timeoutMs;
    function probe() {
      const sock = net.createConnection(port, '127.0.0.1');
      sock.once('connect', () => { sock.destroy(); resolve(); });
      sock.once('error', () => {
        if (Date.now() >= deadline) return reject(new Error(`Port ${port} not ready after ${timeoutMs}ms`));
        setTimeout(probe, 300);
      });
    }
    probe();
  });
}

// ─── Spawn the embedded Next.js standalone server (prod only) ─────────────────
// utilityProcess.fork() runs in a Node.js context — NOT the Electron binary.
// This is the correct way to run server-side scripts from Electron's main process.
async function startNextServer() {
  const serverScript = path.join(
    process.resourcesPath,
    'standalone',
    'server.js',
  );

  nextChild = utilityProcess.fork(serverScript, [], {
    env: {
      ...process.env,
      PORT:     String(PROD_PORT),
      HOSTNAME: '127.0.0.1',
      NODE_ENV: 'production',
    },
    stdio: 'pipe',
  });

  nextChild.on('exit', code => console.log('[Next] exited with code', code));

  await waitForPort(PROD_PORT);
  console.log('[Next] server ready on', PROD_PORT);
}

// ─── Create the browser window ────────────────────────────────────────────────
async function createWindow() {
  const win = new BrowserWindow({
    width:     1440,
    height:    900,
    minWidth:  1024,
    minHeight: 700,
    backgroundColor: '#1C2127',
    titleBarStyle: 'hiddenInset',
    trafficLightPosition: { x: 16, y: 14 },
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
    },
    title: 'Pharos Intelligence',
    show: false,
  });

  Menu.setApplicationMenu(null);

  if (isDev) {
    win.loadURL(DEV_URL);
  } else {
    try {
      await startNextServer();
      win.loadURL(`http://127.0.0.1:${PROD_PORT}/dashboard`);
    } catch (err) {
      console.error('[Pharos] Failed to start Next.js server:', err);
      // Show error page rather than looping
      win.loadURL(`data:text/html,<body style="background:#1C2127;color:#E84C4C;font-family:monospace;padding:40px"><h2>Failed to start server</h2><pre>${err}</pre></body>`);
    }
  }

  win.once('ready-to-show', () => {
    win.show();
    win.maximize();
  });
}

// ─── Lifecycle ────────────────────────────────────────────────────────────────
app.whenReady().then(createWindow);

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});

app.on('window-all-closed', () => {
  if (nextChild) nextChild.kill();
  if (process.platform !== 'darwin') app.quit();
});

app.on('before-quit', () => {
  if (nextChild) nextChild.kill();
});
