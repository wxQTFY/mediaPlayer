import { ipcMain } from "electron"
import { store } from "./db"

ipcMain.handle('store:get', async () => {
    // console.log('📬 [DEBUG] 收到读取请求:'); // 加这一行
    // console.log('store');
    return store.get('videoList')
})


ipcMain.handle('store:set', async (_e,key, value) => {
    // console.log('更新本地存储:', value);
    store.set(key, value)
})
