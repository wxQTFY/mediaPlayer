/**
 * 视频对象标准接口
 * 用于在主进程探测、Pinia 存储、以及前端渲染之间传递数据
 */
export interface VideoItem {
  id: string;           // 唯一标识 (UUID)
  date: number;         // 添加日期 (时间戳)，用于排序
  videoName: string;    // 文件名或自定义显示名称
  videoPath?: string;    // 最终交付给播放器的 URL (可能是 local-file 协议或 http 流地址)
  success: boolean;    // 是否成功
  realPath?: string;     // 物理路径，主要用于去重判断
  type?: 'local' | 'url'; // 资源类型
  poster?: string;       // 封面图
  playback?: {
    strategy: 'direct' | 'stream' ;      // 播放策略：直接播放或中转流
    // mode: 'copy' | 'transcode'| 'direct' ; // 处理模式
  };
  
  meta?: {
    vCodec?: string;      // 视频编码格式
    duration: number;    // 视频时长 (秒)
    resolution?: string; // 分辨率，如 1920x1080
    size?: number;       // 文件大小 (字节)
  };
  
  isNew?: boolean;       // 交互辅助：标记是否为本次新添加
}

export interface GPUInfo {
  gpuDevice:Array<{
    vendorId: string;
    deviceId: string;
  }>;
  auxAttributes?: {
    driverVersion?: string;
  };
}

// export interface encoder{

// }