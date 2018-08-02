'use strict'

const {app, BrowserWindow, Menu} = require('electron')
const path = require('path')
const url = require('url')

let win

// Keep a reference for dev mode
let dev = false
if (process.defaultApp || /[\\/]electron-prebuilt[\\/]/.test(process.execPath) || /[\\/]electron[\\/]/.test(process.execPath)) {
  dev = true
}

function createWindow () {
  win = new BrowserWindow({
    width: 1024,
    height: 768,
    show: false
  })

  let indexPath
  if (dev && process.argv.indexOf('--noDevServer') === -1) {
    indexPath = url.format({
      protocol: 'http:',
      host: 'localhost:8080',
      pathname: 'index.html',
      slashes: true
    })
  } else {
    indexPath = url.format({
      protocol: 'file:',
      pathname: path.join(__dirname, 'dist', 'index.html'),
      slashes: true
    })
  }
  win.loadURL(indexPath)

  // Don't show until we are ready and loaded
  win.once('ready-to-show', () => {
    win.show()
    // Open the DevTools automatically if developing
    if (dev) win.webContents.openDevTools()
  })

  // Emitted when the window is closed.
  win.on('closed', () => win = null)
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', () => {
  Menu.setApplicationMenu(null)
  createWindow()
})

// Quit when all windows are closed.
app.on('window-all-closed', () => {
  // On macOS it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', () => {
  // On macOS it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (win === null) createWindow()
})
