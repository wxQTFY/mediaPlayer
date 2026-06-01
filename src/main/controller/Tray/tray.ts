import  { app,Tray, Menu , nativeImage,BrowserWindow } from 'electron'


//纯函数封装 (src/main/tray.ts)
//小型项目、追求极致简洁的首选
//如果你只是想要一个简单的“点一下显示窗口”的功能，且之后不太会去改动它，函数式更好。
export function createTray(win: BrowserWindow) {
    const iconPath = nativeImage.createFromPath('./resources/icon.png')
    const tray = new Tray(iconPath)
    const contextMenu = Menu.buildFromTemplate([
        { label: '退出', click: () => { app.quit() } }
    ])
    tray.setToolTip('播放器')
    tray.setContextMenu(contextMenu)

    // 点击托盘图标显示应用窗口
    tray.on('click', () => {
        win.show()
    })
}