const { app, BrowserWindow, ipcMain, screen } = require('electron');
const path = require('path');

let mainWindow;
let notifWindow;
const RAM_LIMIT_MB = 200;

function createWindow() {
    mainWindow = new BrowserWindow({
        width: 1440, height: 900,
        minWidth: 1024, minHeight: 768,
        autoHideMenuBar: true,
        icon: path.join(__dirname, 'Design.png'),
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false
        }
    });

    mainWindow.loadFile(path.join(__dirname, 'pages', 'index.html'));

    // THE ASSASSINATION SCRIPT: Kills the main UI and the hidden notification window instantly.
    mainWindow.on('closed', () => {
        mainWindow = null;
        app.quit();
    });

    setInterval(checkMemoryUsage, 30000);
}

async function checkMemoryUsage() {
    if (!mainWindow) return;

    const metrics = await app.getAppMetrics();
    const totalMemory = metrics.reduce((acc, process) => acc + (process.memory.workingSetSize / 1024), 0);

    if (totalMemory > RAM_LIMIT_MB) {
        console.warn(`RAM Limit exceeded (${totalMemory.toFixed(2)} MB)! Forcefully resetting...`);
        mainWindow.webContents.session.clearCache().then(() => {
            mainWindow.reload();
        });
    }
}

function createNotificationWindow() {
    notifWindow = new BrowserWindow({
        width: 340, height: 160,
        frame: false, transparent: true,
        alwaysOnTop: true, skipTaskbar: true,
        show: false, resizable: false, focusable: false,
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false
        }
    });

    notifWindow.loadFile(path.join(__dirname, 'pages', 'notification.html'));

    notifWindow.on('closed', () => {
        notifWindow = null;
    });
}

app.whenReady().then(() => {
    createWindow();
    createNotificationWindow();

    app.on('activate', function () {
        if (BrowserWindow.getAllWindows().length === 0) createWindow();
    });
});

ipcMain.on('trigger-notification', (event, data) => {
    if (!notifWindow) return;
    const primaryDisplay = screen.getPrimaryDisplay();
    const { width, height } = primaryDisplay.workAreaSize;
    notifWindow.setPosition(width - 350, height - 170);
    notifWindow.webContents.send('set-data', data);
    notifWindow.showInactive();
});

ipcMain.on('notification-action', (event, action) => {
    if (notifWindow) notifWindow.hide();
    if (mainWindow) mainWindow.webContents.send('notification-reply', action);
});

app.on('window-all-closed', function () {
    if (process.platform !== 'darwin') app.quit();
});