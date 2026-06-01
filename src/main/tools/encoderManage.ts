/**
 * 检测当前电脑的编码器，选择最优编码器进行转码
 * 优先级顺序：NVIDIA -> AMD-> Intel -> CPU
 * 
 */
import ffmpeg from "fluent-ffmpeg";
import ffmpegPath from "ffmpeg-static";

ffmpeg.setFfmpegPath(ffmpegPath!); // 设置ffmpeg路径

interface encoderType {
    bestEncoder: string,
    isGpu: boolean
}

export const encoderSelect=  ():Promise<encoderType> =>{
    return new Promise((resolve,reject)=>{
        ffmpeg.getAvailableEncoders((err, encoders) => {
            let bestEncoder: string = 'libx264';
            let isGpu: boolean = false;
            if (err || !encoders) {
                console.log('无法获取编码器,默认使用CPU(libx264)');
                return;
            }
            //优先级顺序：NVIDIA -> AMD-> Intel -> CPU
            if(encoders['h264_nvenc']){
                bestEncoder = 'h264_nvenc';
                isGpu = true;
            }else if(encoders['h264_amf']){
                bestEncoder = 'h264_amf';
                isGpu = true;
            }else if(encoders['h264_qsv']){
                bestEncoder = 'h264_qsv';
                isGpu = true;
            }else{
                bestEncoder = 'libx264';
                isGpu = false;
            }
            resolve({bestEncoder,isGpu})
        })
    })
    
   
}