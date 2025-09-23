// import { app, shell, BrowserWindow, ipcMain } from 'electron'
// import { join } from 'path'
// import { electronApp, optimizer, is } from '@electron-toolkit/utils'
// import icon from '../../resources/icon.png?asset'
// import dotenv from 'dotenv'
// import { execFile } from 'child_process'

// // ----------------------
// // 1. Load .env file
// // ----------------------
// dotenv.config({ path: join(__dirname, '../../resources/.env') }) // adjust relative to main.js

// // ----------------------
// // 2. Launch backend.exe
// // ----------------------
// const backendPath = join(__dirname, '../../resources/backend.exe')

// let backendProcess
// function startBackend() {
//   backendProcess = execFile(backendPath, {
//     env: { ...process.env } // pass all env variables to backend
//   }, (error, stdout, stderr) => {
//     if (error) console.error('Backend failed to start:', error)
//     if (stdout) console.log('Backend output:', stdout)
//     if (stderr) console.error('Backend error output:', stderr)
//   })
// }

// // ----------------------
// // 3. Create main window
// // ----------------------
// function createWindow() {
//   const mainWindow = new BrowserWindow({
//     width: 900,
//     height: 670,
//     show: false,
//     autoHideMenuBar: true,
//     ...(process.platform === 'linux' ? { icon } : {}),
//     webPreferences: {
//       preload: join(__dirname, '../preload/index.js'),
//       sandbox: false
//     }
//   })

//   mainWindow.on('ready-to-show', () => mainWindow.show())

//   mainWindow.webContents.setWindowOpenHandler((details) => {
//     shell.openExternal(details.url)
//     return { action: 'deny' }
//   })

//   // Load dev URL or local HTML
//   if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
//     mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
//   } else {
//     mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
//   }
// }

// // ----------------------
// // 4. App ready
// // ----------------------
// app.whenReady().then(() => {
//   electronApp.setAppUserModelId('com.electron')

//   // Dev shortcuts
//   app.on('browser-window-created', (_, window) => optimizer.watchWindowShortcuts(window))

//   // Start backend
//   startBackend()

//   // IPC test
//   ipcMain.on('ping', () => console.log('pong'))

//   createWindow()

//   app.on('activate', () => {
//     if (BrowserWindow.getAllWindows().length === 0) createWindow()
//   })
// })

// // ----------------------
// // 5. Quit handling
// // ----------------------
// app.on('window-all-closed', () => {
//   if (process.platform !== 'darwin') app.quit()
// })

// app.on('will-quit', () => {
//   if (backendProcess && !backendProcess.killed) backendProcess.kill()
// })
import { app, shell, BrowserWindow, ipcMain } from 'electron'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import icon from '../../resources/icon.png?asset'
import { execFile } from 'child_process'

// ----------------------
// 1. Launch backend.exe directly
// ----------------------
const backendPath = join(__dirname, '../../resources/backend.exe') // path to backend.exe

let backendProcess
function startBackend() {
  backendProcess = execFile(backendPath, (error, stdout, stderr) => {
    if (error) console.error('Backend failed to start:', error)
    if (stdout) console.log('Backend output:', stdout)
    if (stderr) console.error('Backend error output:', stderr)
  })
}

// ----------------------
// 2. Create main window
// ----------------------
function createWindow() {
  const mainWindow = new BrowserWindow({
    width: 900,
    height: 670,
    show: false,
    autoHideMenuBar: true,
    ...(process.platform === 'linux' ? { icon } : {}),
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false
    }
  })

  mainWindow.on('ready-to-show', () => mainWindow.show())

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  // Load dev URL or local HTML
  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

// ----------------------
// 3. App ready
// ----------------------
app.whenReady().then(() => {
  electronApp.setAppUserModelId('com.electron')

  app.on('browser-window-created', (_, window) => optimizer.watchWindowShortcuts(window))

  // Start backend
  startBackend()

  // IPC test
  ipcMain.on('ping', () => console.log('pong'))

  createWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

// ----------------------
// 4. Quit handling
// ----------------------
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})

app.on('will-quit', () => {
  if (backendProcess && !backendProcess.killed) backendProcess.kill()
})
