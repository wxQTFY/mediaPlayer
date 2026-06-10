import ElectronStore from 'electron-store';
import type { VideoItem } from '../../../common/types';

interface StoreData {
  videoList: VideoItem[]
}

// electron-vite 的 CommonJS 主进程产物可能将 ESM 默认导出包装在 default 中。
const Store = (
  (ElectronStore as unknown as { default?: typeof ElectronStore }).default ?? ElectronStore
)

export const store = new Store<StoreData>({
  name: 'dbStore', // 存储文件名为 dbStore.json
  defaults: {
    videoList: []
  }
})

export const initStore = (): void => {
  console.log('Store 数据文件路径:', store.path); // 输出数据文件的路径，方便调试
}
