import Store from 'electron-store';
import type { VideoItem } from '../../../common/types';

interface StoreData {
  videoList: VideoItem[]
}

// console.log( Store); // 输出数据文件的路径，方便调试
// // 实例化并自定义设置
// export const store = new Store({
//     name: 'video-data', // 存储文件名为 video-data.json
//     schema, // 使用定义的 schema 进行数据验证和默认值设置
// });

// // 1. 初始化 Store
// // 它会自动创建文件在: C:\Users\用户名\AppData\Roaming\你的应用名\config.json
// // Store.initRenderer()

// export const initStore = () => {
//     // 初始化 Store
//     Store.initRenderer()
// }

// src/main/db.ts

export const store = new Store<StoreData>({
  name: 'dbStore', // 存储文件名为 dbStore.json
  defaults: {
    videoList: []
  }
})

export const initStore = (): void => {
  console.log('Store 数据文件路径:', store.path); // 输出数据文件的路径，方便调试
}
