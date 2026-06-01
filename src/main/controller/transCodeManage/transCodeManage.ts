import { FfmpegCommand } from 'fluent-ffmpeg';

// 全局状态
const activeTasks = new Map<string, FfmpegCommand>();
const idleTimers = new Map<string, NodeJS.Timeout>();
let currentActiveId: string | null = null;

/**
 * 主动销毁 (切换时) + 被动销毁 (定时器) + 自动结束 (FFmpeg 事件)。
 */
export const stopTranscode = (id: string) => {
    if (activeTasks.has(id)) {
        console.log(`[FFmpeg] 用户主动停止任务: ${id}`);
        activeTasks.get(id)?.kill('SIGKILL');
        activeTasks.delete(id);
    }
    //清除对应定时器
    if(idleTimers.has(id)){
        clearInterval(idleTimers.get(id)!)
        idleTimers.delete(id)
    } 
    clearTimer(id);  
}

/**
 * 清除闲置计时器
 */
export const clearTimer = (id: string) => {
    if (idleTimers.has(id)) {
        clearTimeout(idleTimers.get(id)!);
        idleTimers.delete(id);
    }
};  

/**
 * 设置闲置清理计时器（被动销毁）
 */
export const setIdleTimer = (id: string, delay = 300000) => {
    clearTimer(id);
    const timer = setTimeout(() => {
        console.log(`[Manager] 视频 ${id} 超过 5 分钟无操作，自动销毁进程`);
        stopTranscode(id);
    }, delay);
    idleTimers.set(id, timer);
};

export { activeTasks, currentActiveId };
export const setCurrentId = (id: string | null) => { currentActiveId = id; };