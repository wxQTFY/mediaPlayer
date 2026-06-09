import { app, Tray, Menu , nativeImage,BrowserWindow } from 'electron';
import path from 'path'; // 必须引入 path

export class TrayClass {
    private window: BrowserWindow;
    private tray: Tray | null = null;
    constructor(window: BrowserWindow) {
        this.window = window;
    } 

    public updateWindow(window: BrowserWindow): void {
        this.window = window;
    }

    public initTray(): void {
        const imgPath = path.join(app.getAppPath(), 'resources/icon.png'); // 替换为你的图标路径
        const iconPath = nativeImage.createFromPath(imgPath); // 替换为你的图标路径
        this.tray = new Tray(iconPath);
        const contextMenu = Menu.buildFromTemplate([
            {
                label: '退出',
                click: () => { 
                    app.quit();
                }
            }
        ]);
        this.tray.setToolTip('播放器'); 
        this.tray.setContextMenu(contextMenu);

        this.tray.on('click', () => {
            this.window.show();
        });
        
    }
}

