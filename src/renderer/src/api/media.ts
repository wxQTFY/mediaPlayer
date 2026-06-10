
import { type VideoItem } from '@common/types';
import { toRaw } from 'vue';
export const openLocalFile = async (videoList: VideoItem[]):Promise<VideoItem[]> => {
    console.log('打开本地文件', videoList);
    const filePaths = await window.api.media.openFiles(toRaw(videoList));
    return filePaths;
}

export const importDroppedFiles = async (
    files: File[],
    videoList: VideoItem[]
): Promise<VideoItem[]> => {
    const filePaths = files
        .map(file => window.api.media.getPathForFile(file))
        .filter(Boolean)
    return await window.api.media.importDroppedFiles(filePaths, toRaw(videoList))
}

// export const localStore = async (key: string): Promise<any> => {
//     console.log('获取本地存储数据');
//     return await window.electron.ipcRenderer.invoke('store:get', key);
// }

export const localStore = async (type: 'get' | 'set', _key: 'videoList', value?: VideoItem[]): Promise<VideoItem[] | void> => {
    
//    return await window.electron.ipcRenderer.invoke('store:get', key);
    if(type === 'get'){
        return await window.api.store.getVideoList();
    }else if(type === 'set'){
        console.log('设置本地存储数据', value);
        if (!value) throw new Error('videoList is required')
        await window.api.store.setVideoList(value);
    }
}
