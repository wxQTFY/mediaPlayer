import { ipcMain,dialog } from "electron";
// import {readdir,stat } from 'fs/promises'

// import iconv from "iconv-lite";
import path from "path";
// import { serverConfig } from "../../config/conf.json"

import { analyzeSingleVideo  } from "../../tools/ffmpeg"; 
import { type VideoItem } from '../../../common/types';

// import { CONFIG_CONST } from "../../config/config";
import crypto from 'crypto';

const VIDEO_EXTS = ['.mp4', '.mkv', '.avi', '.flv', '.mov', '.wmv','.rmvb','.mpd','.m3u8','.m4v','.webm']
const TRANSCODE_EXTS = ['.avi','.mov', '.wmv','.rmvb','.m4v']
// const HOST = serverConfig.host
// const PORT = serverConfig.port

// 定义错误状态下的播放策略和模式
// const ERROR_STRATEGY = 'none' as 'none';
// const ERROR_MODE = 'none' as 'none';
export const fileDialogController = async () => {
    ipcMain.handle('dialog:openFile', async (_event, currentList: VideoItem[]):Promise<VideoItem[]> => {
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
    let url:string;
    if(strategy === 'direct'){
         // 1. 将所有反斜杠 \ 转换为正斜杠 /
        // 使用正则 /\\/g 确保全局替换  
        let normalizedPath = absolutePath.replace(/\\/g, '/');
        // 2. 确保路径开头没有重复的斜杠（如果是从某些库获取的路径可能带盘符前缀）
        normalizedPath = normalizedPath.startsWith('/')? normalizedPath.substring(1):normalizedPath;
        //拼接协议头
        url = `${protocol}://${normalizedPath}`;
    }else{
         url = absolutePath;
    }
   return url;
}  

//遍历所有选择的文件路径，根据探测结果返回加工后的最终格式
const mapAndFormatFfmpegResult = async (filePaths:string[], currentList: VideoItem[]) => {
    return Promise.all(filePaths.map(async filePath => {
        // let mode:'copy'| 'transcode' | 'direct' | 'ERROR_MODE';
        let strategy:'direct' | 'stream' | 'ERROR_STRATEGY';
     // 1. 生成基于路径的固定 ID (这是解决你之前转码目录重复的关键)
        const fixedId = crypto.createHash('md5').update(filePath).digest('hex')
        // 2. 查重判定
        const existedVideo = currentList.find(v => v.id === fixedId || v.realPath === filePath);
        if(existedVideo){
            // console.log('existedVideo',existedVideo)
            return existedVideo;
        }
        try{
            // let playerUrl:string;
            // 3. 只有新视频才进行耗时的元数据分析
            let playerUrl:string;
            const metadata = await analyzeSingleVideo(filePath);
            const ext = path.extname(filePath).toLowerCase(); // 获取文件扩展名并转换为小写
            if(TRANSCODE_EXTS.includes(ext)){
                strategy = 'stream';
                playerUrl = formatPath(filePath, strategy)
            }else {
                strategy = 'direct';
                playerUrl = formatPath(filePath, strategy)
            }
            return {
                id: fixedId,
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
        }catch(err){

           return {
                id: fixedId,
                success: false,
                date: Date.now(), // 当前时间戳
                videoPath: '', // 由于出错无法生成播放路径，置空
                videoName: path.basename(filePath), // 从路径中提取文件名
                errorMsg: "文件损坏或格式不支持",
                readPath: filePath, // 原始路径，供后端读取使用
           } 
        }
       
    }))

}
 