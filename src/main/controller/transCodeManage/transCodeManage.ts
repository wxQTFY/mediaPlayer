import { FfmpegCommand } from 'fluent-ffmpeg';
import fs from 'fs';
import path from 'path';
import { CONFIG_DIR } from '../../config/config';
import { isValidMediaId } from '../../tools/mediaAccess';

// 全局状态
const activeTasks = new Map<string, FfmpegCommand>();
const idleTimers = new Map<string, NodeJS.Timeout>();
const cacheRemovalRequests = new Set<string>();
let currentActiveId: string | null = null;
let cacheCleanupTimer: NodeJS.Timeout | null = null;

export const TRANSCODE_CACHE_MAX_AGE = 30 * 24 * 60 * 60 * 1000;
const TRANSCODE_CACHE_CLEANUP_INTERVAL = 24 * 60 * 60 * 1000;

/**
 * 主动销毁 (切换时) + 被动销毁 (定时器) + 自动结束 (FFmpeg 事件)。
 */
export const stopTranscode = (id: string): void => {
    if (activeTasks.has(id)) {
        console.log(`[FFmpeg] 用户主动停止任务: ${id}`);
        activeTasks.get(id)?.kill('SIGKILL');
        activeTasks.delete(id);
    }
    clearTimer(id);
    if (currentActiveId === id) currentActiveId = null;
}

/**
 * 清除闲置计时器
 */
export const clearTimer = (id: string): void => {
    if (idleTimers.has(id)) {
        clearTimeout(idleTimers.get(id)!);
        idleTimers.delete(id);
    }
};  

/**
 * 设置闲置清理计时器（被动销毁）
 */
export const setIdleTimer = (id: string, delay = 300000): void => {
    clearTimer(id);
    const timer = setTimeout(() => {
        console.log(`[Manager] 视频 ${id} 超过 5 分钟无操作，自动销毁进程`);
        stopTranscode(id);
    }, delay);
    idleTimers.set(id, timer);
};

export { activeTasks, currentActiveId };
export const setCurrentId = (id: string | null): void => { currentActiveId = id; };

export const stopAllTranscodes = (): void => {
    for (const id of [...activeTasks.keys()]) stopTranscode(id);
}

export const removeTranscodeCache = async (
    id: string,
    cacheRoot = CONFIG_DIR.TEMP_HLS_DIR
): Promise<boolean> => {
    if (!isValidMediaId(id)) throw new Error('无效的视频 ID');
    cacheRemovalRequests.add(id);
    setTimeout(() => cacheRemovalRequests.delete(id), 60000).unref();
    stopTranscode(id);
    const cacheDir = path.join(cacheRoot, id);
    if (!fs.existsSync(cacheDir)) return false;
    await fs.promises.rm(cacheDir, { recursive: true, force: true, maxRetries: 3, retryDelay: 100 });
    return true;
}

export const clearCacheRemovalRequest = (id: string): void => {
    cacheRemovalRequests.delete(id);
}

export const isCacheRemovalRequested = (id: string): boolean => cacheRemovalRequests.has(id);

export const cleanupExpiredTranscodeCaches = async (
    maxAge = TRANSCODE_CACHE_MAX_AGE,
    cacheRoot = CONFIG_DIR.TEMP_HLS_DIR,
    now = Date.now()
): Promise<number> => {
    if (!fs.existsSync(cacheRoot)) return 0;
    const entries = await fs.promises.readdir(cacheRoot, { withFileTypes: true });
    let removedCount = 0;

    for (const entry of entries) {
        if (!entry.isDirectory() || !isValidMediaId(entry.name) || activeTasks.has(entry.name)) continue;
        const cacheDir = path.join(cacheRoot, entry.name);
        const stat = await fs.promises.stat(cacheDir);
        if (now - stat.mtimeMs < maxAge) continue;
        await fs.promises.rm(cacheDir, { recursive: true, force: true, maxRetries: 3, retryDelay: 100 });
        removedCount += 1;
    }

    return removedCount;
}

export const startTranscodeCacheCleanup = (): void => {
    if (cacheCleanupTimer) return;
    const cleanup = (): void => {
        void cleanupExpiredTranscodeCaches()
            .then((removedCount) => {
                if (removedCount > 0) console.log(`[Manager] 已清理 ${removedCount} 个过期转码缓存`);
            })
            .catch((error) => console.error('[Manager] 清理过期转码缓存失败:', error));
    };
    cleanup();
    cacheCleanupTimer = setInterval(cleanup, TRANSCODE_CACHE_CLEANUP_INTERVAL);
    cacheCleanupTimer.unref();
}

export const stopTranscodeCacheCleanup = (): void => {
    if (!cacheCleanupTimer) return;
    clearInterval(cacheCleanupTimer);
    cacheCleanupTimer = null;
}
