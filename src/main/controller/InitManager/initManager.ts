import { BrowserWindow } from 'electron'
import { WindowController } from '../Window/windowController'
import { TrayClass } from '../Tray/trayClass'
import { initStore } from '../electronStore/db'; //引入store

//初始化管理器
export const initAll = (window: BrowserWindow) => {
    //1. 初始化 Store ,核心存储服务
    initStore()

    //2.窗口与托盘，直接初始化
    new WindowController(window).init()
    new TrayClass(window).initTray()
}

// export class initManager {

//     private windowCtrl: WindowController
//     private trayClass: TrayClass
//     private store: initStore

//     constructor(private window: BrowserWindow) {
//         //统一管理控制器的实例化，减少main.ts的代码量
//         this.windowCtrl = new WindowController(this.window)
//         this.trayClass = new TrayClass(this.window)
//     }

//     //统一管理控制器的初始化，减少main.ts的代码量
//     public  init(): void {
//         this.windowCtrl.init()
//         this.trayClass.initTray()
//     }
// }