
import { type VideoItem } from '@common/types';
import { toRaw } from 'vue';
export const openLocalFile = async (videoList):Promise<VideoItem[]> => {
    console.log('打开本地文件', videoList);
    const filePaths = await window.electron.ipcRenderer.invoke('dialog:openFile',toRaw(videoList));
    return filePaths;
}

// export const localStore = async (key: string): Promise<any> => {
//     console.log('获取本地存储数据');
//     return await window.electron.ipcRenderer.invoke('store:get', key);
// }

export const localStore = async (type:string,key: string,value?:any): Promise<any> => {
    
//    return await window.electron.ipcRenderer.invoke('store:get', key);
    if(type === 'get'){
        return await window.electron.ipcRenderer.invoke('store:get', key);
    }else if(type === 'set'){
        console.log('设置本地存储数据', value);
        window.electron.ipcRenderer.invoke('store:set', key, value);
    }
}