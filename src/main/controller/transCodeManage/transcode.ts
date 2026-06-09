/**
 * 视频转码工具
 */
import ffmpeg from 'fluent-ffmpeg';
import ffmpegPath from 'ffmpeg-static';

import fs from 'fs';
import path from 'path';

import { encoderSelect } from '../../tools/encoderManage'

import { CONFIG_DIR } from '../../config/config';

import { 
    activeTasks, stopTranscode, clearTimer, 
    currentActiveId, setCurrentId 
} from './transCodeManage';

ffmpeg.setFfmpegPath(ffmpegPath!); // 设置 FFprobe 路径
const pendingTasks = new Map<string, Promise<void>>();

// 使用 Map 管理正在运行的命令，方便销毁和防抖
// const activeTasks = new Map<string, ffmpeg.FfmpegCommand>();
// const idleTimers = new Map<string, NodeJS.Timeout>();
// let currentId: string | null = null;

export const hlsTranscode = async (realPath: string,id:string,duration: number): Promise<void> => {
    const pendingTask = pendingTasks.get(id);
    if (pendingTask) return pendingTask;

    const task = prepareHlsTranscode(realPath, id, duration);
    pendingTasks.set(id, task);
    try {
        await task;
    } finally {
        pendingTasks.delete(id);
    }
}

const prepareHlsTranscode = async (realPath: string,id:string,duration: number): Promise<void> => {
    const outputDir = path.join(CONFIG_DIR.TEMP_HLS_DIR, id) // 设置输出文件路径
     const m3u8Path = path.join(outputDir, 'index.m3u8') // 设置输出文件路径

     // --- 1. 主动销毁逻辑：如果切换了视频，杀掉上一个 ---
    if (currentActiveId && currentActiveId !== id) {
        stopTranscode(currentActiveId);
    }
    setCurrentId(id); // 设置当前正在转码的视频 ID

    // 2. 防抖/复用逻辑：如果该视频正在转码，直接返回
    if (activeTasks.has(id)) {
        clearTimer(id); // 取消该任务的闲置倒计时
        return await waitForM3u8(m3u8Path);
    }

    // 3. 缓存检查：如果 index.m3u8 已存在，无需再次启动 FFmpeg
    if (fs.existsSync(m3u8Path)) {
        return;
    }

    // 3. 准备工作
    if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });
    const { bestEncoder } = await encoderSelect();
    return startTranscode(realPath, id, duration, outputDir, m3u8Path, bestEncoder)
        .catch(async (error) => {
            if (bestEncoder === 'libx264') throw error
            console.warn(`[FFmpeg] ${bestEncoder} 不可用，回退到 CPU 编码`)
            stopTranscode(id)
            await startTranscode(realPath, id, duration, outputDir, m3u8Path, 'libx264')
        })
}

const startTranscode = (
    realPath: string,
    id: string,
    duration: number,
    outputDir: string,
    m3u8Path: string,
    encoder: string
): Promise<void> => {
    const ffmpegCommand = ffmpeg(realPath)
    return new Promise<void>((resolve, reject) => {
        const globalOptions = [
        '-pix_fmt yuv420p',    // 【关键】强制像素格式，解决所有显卡对 WMV 的兼容性
        '-g 60',               // 关键帧间隔（GOP），建议为帧率的 2-5 倍
        '-keyint_min 60',
        '-sc_threshold 0',
        ...(encoder === 'h264_nvenc' ? ['-preset p1'] : []),
        ...(encoder === 'libx264' ? ['-preset veryfast'] : [])
    ];
    const outOptions = [
        '-f hls',
        '-hls_time 2',         // 每个切片 2 秒
        '-hls_list_size 0',    // 0 = 保留所有切片，支持全进度条拖动
        '-hls_playlist_type vod',      // 标记为点播(VOD)，解决进度条跳动问题
        '-hls_segment_filename', path.join(outputDir, 'seg_%d.ts'), // 切片命名
        '-hls_flags independent_segments',// 确保每个切片都能独立跳转
        // '-preset superfast',    // 优化：后端转码求快，使用 superfast 预设
    ]   
    ffmpegCommand
        .videoCodec(encoder)
        .duration(duration)
        .audioCodec('aac')
        .addOptions(globalOptions)
        .outputOptions(outOptions) 
        .on('start', (cmd) => {
            console.log('HLS 转码启动:', cmd)
            // 启动后开始轮询 index.m3u8
            waitForM3u8(m3u8Path)
                .then(resolve)
                .catch((error) => {
                    ffmpegCommand.kill('SIGKILL');
                    activeTasks.delete(id);
                    reject(error);
                });
        })
        .on('error', (err) => {
            console.error('转码失败:', err.message)
            // console.error('FFmpeg 标准错误输出:', stderr); // 这行是解决问题的金钥匙
            activeTasks.delete(id);
            reject(err);
        })
        .on('end', () => {
            console.log(`[FFmpeg] ID: ${id} 全部切片完成`);
            activeTasks.delete(id);
        })
        // 保存引用到全局 Map
        activeTasks.set(id, ffmpegCommand); // 保存引用到全局 Map
        ffmpegCommand.save(m3u8Path); // 保存到指定路径
    })
}

/**
 * 辅助函数：轮询检查 index.m3u8 是否生成
 */
function waitForM3u8(filePath: string, timeout = 15000): Promise<void> {
    return new Promise((resolve, reject) => {
        const startTime = Date.now();
        const timer = setInterval(() => {
            if (fs.existsSync(filePath)) {
                clearInterval(timer);
                resolve();
            } else if (Date.now() - startTime > timeout) {
                clearInterval(timer);
                reject(new Error('等待 HLS 索引文件超时'));
            }
        }, 500);
    });
}


