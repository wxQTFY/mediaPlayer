import { ipcMain, BrowserWindow } from "electron";

/**
 * 窗口控制器类，用于管理窗口的各种操作和事件监听
 */
export class WindowController {
  private window: BrowserWindow; // 私有属性，存储窗口实例

  /**
   * 构造函数，接收一个BrowserWindow实例
   * @param windows - BrowserWindow窗口实例
   */
  constructor(windows: BrowserWindow) {
    this.window = windows; // 将传入的窗口对象赋值给当前实例的window属性
  }

  //初始化所有监听器
  public init():void {
      ipcMain.on("window-minimize", () => {
        this.window.minimize();
      })

      ipcMain.on("window-maximize", () => {
        if (this.window.isMaximized()) {
            this.window.unmaximize();
        } else {
            this.window.maximize();
        }
      })

      ipcMain.on("window-close", () => {
        this.window.hide();
      })
  }
  
}