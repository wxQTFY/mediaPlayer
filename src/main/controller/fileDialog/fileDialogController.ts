import { ipcMain,dialog } from "electron";
// import {readdir,stat } from 'fs/promises'

// import iconv from "iconv-lite";
import path from "path";
// import { serverConfig } from "../../config/conf.json"

import { analyzeSingleVideo  } from "../../tools/ffmpeg"; 
import { type VideoItem } from '../../../common/types';

// import { CONFIG_CONST } from "../../config/config";
import crypto from 'crypto';
import { pathToFileURL } from 'url';
import { authorizeMedia } from '../../tools/mediaAccess';
import { assertTrustedIpcSender } from '../../tools/ipcSecurity';

const VIDEO_EXTS = ['.mp4', '.mkv', '.avi', '.flv', '.mov', '.wmv','.rmvb','.mpd','.m3u8','.m4v','.webm']
const TRANSCODE_EXTS = ['.avi','.mov', '.wmv','.rmvb','.m4v']
const DIRECT_PLAYBACK_FALLBACK_EXTS = ['.webm']
// const HOST = serverConfig.host
// const PORT = serverConfig.port

// 定义错误状态下的播放策略和模式
// const ERROR_STRATEGY = 'none' as 'none';
// const ERROR_MODE = 'none' as 'none';
export const fileDialogController = (): void => {
    ipcMain.handle('dialog:openFile', async (_event, currentList: VideoItem[]):Promise<VideoItem[]> => {
        assertTrustedIpcSender(_event)
        // console.log('videoList',currentList)
        const { canceled, filePaths } = await dialog.showOpenDialog({
            title: '选择视频文件',
            properties: ['openFile', 'multiSelections'], // 只允许选择文件夹
            filters: [
                { name: '视频文件', extensions: VIDEO_EXTS.map(ext => ext.slice(1)) },
                // { name: 'All Files', extensions: ['*'] }
            ]
        })
        if (canceled && filePaths.length === 0) return [];
        
       return  await mapAndFormatFfmpegResult(filePaths, currentList);
    })
}


//路径转换，将\\替换为/，并解码中文路径
/**
 * 将本地绝对路径转换为 Electron 可识别的自定义协议 URL
 * @param {string} absolutePath - 原始路径，如 C:\Users\wangxin\Desktop\video.mp4
 * @param {string} protocol - 自定义协议名，默认为 'local-file'
 * @returns {string} 转换后的 URL
 */
const formatPath = (absolutePath: string, strategy:string,protocol: string = 'local-file'): string => {
    if (!absolutePath) return '';
    if(strategy === 'direct'){
        return pathToFileURL(absolutePath).toString().replace(/^file:/, `${protocol}:`);
    }
    return absolutePath;
}  

//遍历所有选择的文件路径，根据探测结果返回加工后的最终格式
const mapAndFormatFfmpegResult = async (filePaths:string[], currentList: VideoItem[]): Promise<VideoItem[]> => {
    return Promise.all(filePaths.map(async filePath => {
        // let mode:'copy'| 'transcode' | 'direct' | 'ERROR_MODE';
        let strategy:'direct' | 'stream' | 'ERROR_STRATEGY';
        // 1. 使用不可预测 ID，避免通过已知本地路径推测 HLS 缓存地址
        const mediaId = crypto.randomUUID()
        // 2. 查重判定
        const existedVideo = currentList.find(v => v.realPath === filePath && v.success);
        if(existedVideo){
            // console.log('existedVideo',existedVideo)
            return existedVideo;
        }
        const ext = path.extname(filePath).toLowerCase(); // 获取文件扩展名并转换为小写
        try{
            // let playerUrl:string;
            // 3. 只有新视频才进行耗时的元数据分析
            let playerUrl:string;
            let metadata: NonNullable<VideoItem['meta']>;
            try {
                metadata = await analyzeSingleVideo(filePath);
            } catch (error) {
                // Chromium can play WebM directly even when ffprobe cannot read all of its metadata.
                // Keep the file playable and let the video element report a real decode error if needed.
                if (!DIRECT_PLAYBACK_FALLBACK_EXTS.includes(ext)) throw error;
                console.warn('WebM 元数据探测失败，将尝试直接播放:', filePath, error);
                metadata = { duration: 0 };
            }
            if(TRANSCODE_EXTS.includes(ext)){
                strategy = 'stream';
                playerUrl = formatPath(filePath, strategy)
            }else {
                strategy = 'direct';
                playerUrl = formatPath(filePath, strategy)
            }
            authorizeMedia(mediaId, filePath)
            return {
                id: mediaId,
                date: Date.now(), // 当前时间戳
                success: true,
                videoName: path.basename(filePath), // 从路径中提取文件名
                videoPath: playerUrl,
                realPath: filePath, // 原始路径，供后端读取使用
                playback: {
                    strategy, // 播放策略：直接播放或流式播放
                },
                meta:{
                    ...metadata
                }
             }
        }catch(error){
           console.error('视频文件导入失败:', filePath, error);

           return {
                id: mediaId,
                success: false,
                date: Date.now(), // 当前时间戳
                videoPath: '', // 由于出错无法生成播放路径，置空
                videoName: path.basename(filePath), // 从路径中提取文件名
                errorMsg: "文件损坏或格式不支持",
                realPath: filePath, // 原始路径，供后端读取使用
           } 
        }
       
    }))

}
