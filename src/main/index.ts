import { app, shell, BrowserWindow, ipcMain } from 'electron'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import icon from '../../resources/icon.png?asset'
import './controller/electronStore/localStore' // 引入 Store 模块，确保它在 app ready 之前被加载和初始化
import {
  registerMediaServerIpc,
  startMediaServer,
  stopMediaServer
} from './controller/server/server'
import {
  startTranscodeCacheCleanup,
  stopAllTranscodes,
  stopTranscodeCacheCleanup
} from './controller/transCodeManage/transCodeManage'

// import { WindowController } from './controller/Window/windowController'

// import { createTray } from './controller/Tray/tray'

//引入统一管理器，用于管理所有控制器
import { initAll } from './controller/InitManager/initManager'
import { windowConfig } from './config/conf.json'
import { fileDialogController } from './controller/fileDialog/fileDialogController'

import {
  registerLocalFileProtocol,
  registerLocalFileProtocolHandler
} from './tools/localFileProtocol'
import { downloadVideoFromUrl, probeVideoDownload } from './tools/videoDownload'
import { assertTrustedIpcSender } from './tools/ipcSecurity'

// --- 第一步：在最顶部（ready 之前）执行 ---
registerLocalFileProtocol() // 注册协议

function createWindow(): void {
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    minWidth: windowConfig.minWidth,
    minHeight: windowConfig.minHeight,
    // height: 670,
    // width: 900,
    // height: 670,
    show: false,
    autoHideMenuBar: true,
    frame: false,
    ...(process.platform === 'linux' ? { icon } : {}),
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: true,
      contextIsolation: true, //核心配置，开启上下文隔离
      nodeIntegration: false //核心配置，禁止在渲染进程使用 Node.js API
    }
  })

  mainWindow.on('ready-to-show', () => {
    // --- 第二步：在 ready 之后执行 ---
    //registerLocalFileProtocolHandler() // 注册协议处理器
    mainWindow.show()
  })

  // 实例化控制器并启动监听
  // const windowCtrl = new WindowController(mainWindow)
  // windowCtrl.init()

  //纯函数方式实例化托盘
  // createTray(mainWindow)

  //统一实例化管理器，并启动window窗口操作监听和托盘
  initAll(mainWindow)

  mainWindow.webContents.setWindowOpenHandler((details) => {
    try {
      const url = new URL(details.url)
      if (url.protocol === 'https:' || url.protocol === 'http:') {
        void shell.openExternal(details.url)
      }
    } catch {
      // Malformed URLs are denied below.
    }
    return { action: 'deny' }
  })
  mainWindow.webContents.on('will-navigate', (event, url) => {
    if (url !== mainWindow.webContents.getURL()) event.preventDefault()
  })

  // HMR for renderer base on electron-vite cli.
  // Load the remote URL for development or the local html file for production.
  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }

  if (is.dev) mainWindow.webContents.openDevTools({ mode: 'bottom' })
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(async () => {
  // Set app user model id for windows
  electronApp.setAppUserModelId('com.electron')
  registerLocalFileProtocolHandler() // 注册协议处理器，确保在 app ready 之后调用
  // getGpuInfo() // 获取 GPU 信息

  // Default open or close DevTools by F12 in development
  // and ignore CommandOrControl + R in production.
  // see https://github.com/alex8088/electron-toolkit/tree/master/packages/utils
  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  // IPC test
  ipcMain.on('ping', () => console.log('pong'))
  ipcMain.handle('media:probeDownload', async (_event, url: string) => {
    assertTrustedIpcSender(_event)
    return probeVideoDownload(url)
  })
  ipcMain.handle('media:downloadUrl', async (_event, url: string, suggestedName?: string) => {
    assertTrustedIpcSender(_event)
    return downloadVideoFromUrl(url, suggestedName)
  })
  fileDialogController() // 初始化文件对话框控制器，设置相关监听
  registerMediaServerIpc()
  await startMediaServer()
  startTranscodeCacheCleanup()
  createWindow()

  app.on('activate', function () {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('before-quit', () => {
  stopTranscodeCacheCleanup()
  stopAllTranscodes()
  stopMediaServer()
})

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.
