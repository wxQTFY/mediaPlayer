import Store from 'electron-store';

const schema = {
  // 在这里定义你的数据结构和默认值
  videoList: {
    type: 'array',
    default: []
  }
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

// 关键点：动态获取构造函数
const _Store = (Store as any).default || Store

export const store = new _Store({
  name: 'dbStore', // 存储文件名为 dbStore.json
  schema
})

export const initStore = () => {
    console.log('Store 数据文件路径:', store.path); // 输出数据文件的路径，方便调试
  if (_Store.initRenderer) _Store.initRenderer()
}