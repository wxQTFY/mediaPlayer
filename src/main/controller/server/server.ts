import express from 'express';
import ffmpeg from 'fluent-ffmpeg';
import ffmpegPath from 'ffmpeg-static';
import { ipcMain } from 'electron';
import type { Server } from 'http';

import { hlsTranscode } from '../transCodeManage/transcode';

import { CONFIG_DIR,CONFIG_CONST } from '../../config/config'

import { removeTranscodeCache, setIdleTimer } from '../transCodeManage/transCodeManage';
import { getAuthorizedMediaPath, isValidMediaId } from '../../tools/mediaAccess';
import { assertTrustedIpcSender } from '../../tools/ipcSecurity';
import path from 'path';
console.log('--- 后端服务启动检查 ---');
// import cors from 'cors';
// app.use(cors()); // 必须在所有路由之前
// 设置 ffmpeg 和 ffprobe 的路径
// 设置 FFmpeg 路径
ffmpeg.setFfmpegPath(ffmpegPath!); // 设置 FFprobe 路径

const app = express();
let server: Server | null = null;
let serverUrl = '';
// 假设你使用 Express
app.get('/temp_hls/:id/:file', (req, res) => {
    const { id, file } = req.params;
    if (
        !isValidMediaId(id) ||
        !getAuthorizedMediaPath(id) ||
        !/^(index\.m3u8|seg_\d+\.ts)$/.test(file)
    ) {
        res.sendStatus(403);
        return;
    }
    setIdleTimer(id, 300000);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.sendFile(path.join(CONFIG_DIR.TEMP_HLS_DIR, id, file));
});

app.get('/media/:id/:file', (req, res) => {
    const { id, file } = req.params;
    const realPath = getAuthorizedMediaPath(id);
    if (!isValidMediaId(id) || !realPath || path.basename(realPath) !== file) {
        res.sendStatus(403);
        return;
    }
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
    res.sendFile(realPath);
});

// let ffmpegCommand: ffmpeg.FfmpegCommand | null = null;

export const registerMediaServerIpc = (): void => {
    ipcMain.handle('media:prepareFile', (_event, id: string) => {
        assertTrustedIpcSender(_event);
        if (!isValidMediaId(id)) throw new Error('无效的视频 ID');
        const realPath = getAuthorizedMediaPath(id);
        if (!realPath || !serverUrl) throw new Error('媒体文件尚未授权');
        return { url: `${serverUrl}/media/${id}/${encodeURIComponent(path.basename(realPath))}` };
    });

    ipcMain.handle('media:prepareStream', async (_event, id: string, duration: number) => {
    assertTrustedIpcSender(_event);
    if (!isValidMediaId(id)) throw new Error('无效的视频 ID');
    const realPath = getAuthorizedMediaPath(id);
    const parsedDuration = Number(duration);
    if (!realPath || !Number.isFinite(parsedDuration) || parsedDuration < 0 || parsedDuration > 86400) {
        throw new Error('无效的视频参数');
    }
    try{
        await hlsTranscode(realPath, id, parsedDuration);
        if (!serverUrl) throw new Error('媒体服务尚未启动');
        const url = `${serverUrl}/temp_hls/${id}/${CONFIG_CONST.INDEX_EXT}`;
        setIdleTimer(id as string, 300000); // 5 分钟后销毁
        return { url };
    }catch{
        throw new Error('无法启动视频流');
    }
    });

    ipcMain.handle('media:removeTranscodeCaches', async (_event, ids: string[]) => {
        assertTrustedIpcSender(_event);
        if (!Array.isArray(ids) || ids.some((id) => !isValidMediaId(id))) {
            throw new Error('无效的视频 ID');
        }
        await Promise.all([...new Set(ids)].map((id) => removeTranscodeCache(id)));
    });
}

// function getGpuCodec(): string{
//     // 根据系统环境选择合适的 GPU 编码器
//     if (process.platform === 'win32') {
//         return 'h264_nvenc'; // Windows 系统使用 NVIDIA 的 H.264 编码器
//     } else if (process.platform === 'darwin') {
//         return 'h264_videotoolbox'; // macOS VideoToolbox
//     }else{
//         return 'libx264'; // Linux 系统使用 CPU 编码器
//     }
// }

export const startMediaServer = (): Promise<void> => {
    if (server) return Promise.resolve();
    return new Promise((resolve, reject) => {
        server = app.listen(0, '127.0.0.1', () => {
            const address = server?.address();
            if (!address || typeof address === 'string') {
                reject(new Error('无法获取媒体服务地址'));
                return;
            }
            serverUrl = `http://127.0.0.1:${address.port}`;
            console.log(`Backend running on ${serverUrl}`);
            resolve();
        });
        server.on('error', (error) => {
            console.error('媒体服务启动失败:', error);
            reject(error);
        });
    });
}

export const stopMediaServer = (): void => {
    server?.close();
    server = null;
    serverUrl = '';
}
