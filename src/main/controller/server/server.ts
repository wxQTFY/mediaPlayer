import express from 'express';
import ffmpeg from 'fluent-ffmpeg';
import ffmpegPath from 'ffmpeg-static';

import { hlsTranscode } from '../transCodeManage/transcode';

import { CONFIG_DIR,CONFIG_CONST } from '../../config/config'
import { SERVER_CONFIG } from '../../../conf/conf.json'

import { setIdleTimer } from '../transCodeManage/transCodeManage';
console.log('--- 后端服务启动检查 ---');
// import cors from 'cors';
// app.use(cors()); // 必须在所有路由之前
// 设置 ffmpeg 和 ffprobe 的路径
// 设置 FFmpeg 路径
ffmpeg.setFfmpegPath(ffmpegPath!); // 设置 FFprobe 路径

const app = express();
// 假设你使用 Express
app.use('/temp_hls', express.static(CONFIG_DIR.TEMP_HLS_DIR));

// let ffmpegCommand: ffmpeg.FfmpegCommand | null = null;

app.get('/video', async (req, res) => {

    const { realPath,id,duration} = req.query;
    try{
        await hlsTranscode(realPath as string,id as string ,duration as string,req);
        // 只有转码启动并生成了 m3u8，才会执行到这里
        res.json({ 
            code: 200,
            status: 'success',
            url: `${SERVER_CONFIG.FRONTEND_URL}/temp_hls/${id}/${CONFIG_CONST.INDEX_EXT}`
        });
        // --- 5. 被动销毁：启动闲置计时器 ---
        setIdleTimer(id as string, 300000); // 5 分钟后销毁
    }catch(err){
        res.json({ 
            code: 400,
            status: 'error',
            message: '无法启动视频流'
        });
    }
    
});

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

app.listen(9999, () => console.log('Backend running on http://localhost:9999'));