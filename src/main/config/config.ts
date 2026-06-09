/**
 * 定义全局变量
 */
import path from 'path';
import fs from 'fs';
import os from 'os';

export const CONFIG_DIR ={
    // // 项目根目录
    // ROOT_PATH: path.resolve(__dirname, '../../..'),
    // // 项目配置文件目录
    // CONFIG_PATH: path.resolve(__dirname, '../config'),
    // // 项目日志目录
    // LOG_PATH: path.resolve(__dirname, '../log'),
    // // 项目静态资源目录
    // STATIC_PATH: path.resolve(__dirname, '../../static'),
    // 项目临时文件目录
    TEMP_HLS_DIR: path.join(os.tmpdir(), 'sanjin-mediaplayer', 'temp_hls'),
    // // 项目上传文件目录
    // UPLOAD_PATH: path.resolve(__dirname, '../../upload'),
    // // 项目缓存目录
}
if (!fs.existsSync(CONFIG_DIR.TEMP_HLS_DIR)) {
    fs.mkdirSync(CONFIG_DIR.TEMP_HLS_DIR,{ recursive: true });
}

export const CONFIG_CONST = {
    INDEX_EXT:'index.m3u8'
}
