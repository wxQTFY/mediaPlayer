import ffmpeg from 'fluent-ffmpeg';
import ffmpegPath from 'ffmpeg-static';
import ffporbePath from 'ffprobe-static';
// import path from 'path';

/**
 * ffmpeg 工具类,获取视频元数据
 */

// 设置 ffmpeg 和 ffprobe 的路径
ffmpeg.setFfmpegPath(ffmpegPath!);  
ffmpeg.setFfprobePath(ffporbePath.path); 

//分析单个视频文件的元数据
export const analyzeSingleVideo = async (filePath:string): Promise<any> => {
    return new Promise((resolve, reject) => {
        ffmpeg.ffprobe(filePath, (err, metadata) => {
            if (err) return reject(err);
  
            const videoStream = metadata.streams.find(stream => stream.codec_type === 'video');
            const vCodec = videoStream?.codec_name || '';
            // const ext = path.extname(filePath).toLowerCase();

            // const isNative = vCodec === 'h264' && ext === '.mp4'; // 判断是否为原生格式
            resolve({
                vCodec,
                duration: metadata.format.duration,
                bite_rate: metadata.format.bit_rate,
                size: metadata.format.size,
            });
        });
    });
}   