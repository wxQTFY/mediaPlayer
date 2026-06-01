import  {type Option } from 'artplayer';
export const defaultPlayerConf:Partial<Option> = {
    // --- 基础配置 ---
    autoplay: true,        // 自动播放
    volume: 0.5,           // 默认音量 0-1
    muted: false,           // 默认非静音（注意：浏览器通常要求自动播放必须静音）
    autoSize: true,        // 自动调整播放器大小以适应容器
    autoMini: true,        // 滚动到视口外时自动开启小窗模式
    
    // --- 界面控制 ---
    theme: '#23ade5',      // 播放器主题颜色
    backdrop: false,       // 关闭背景毛玻璃效果
    screenshot: true,      // 开启截图功能
    setting: true,         // 显示设置按钮
    hotkey: true,          // 开启热键（空格播放、左右键快进等）
    fullscreen: true,      // 显示全屏按钮
    fullscreenWeb: false,   // 显示网页全屏按钮
    pip: true,             // 开启画中画模式
    playbackRate: true,    // 开启播放速度设置
    aspectRatio: true,     // 开启画面比例设置
    subtitleOffset: true,  // 开启字幕偏移调整
    
    // --- 进阶功能 ---
    miniProgressBar: true, // 播放器失去焦点或暂停时显示微型进度条
    mutex: true,           // 多个播放器实例时，开启互斥播放
    lock: true,            // 移动端锁定界面功能
    fastForward: true,     // 开启长按快进
    autoPlayback: true,    // 自动跳转到上次播放进度

    //---视频属性---
    moreVideoAttr:{
        preload: 'metadata', // 预加载视频元数据
        // controlsList: 'nodownload', // 禁止下载按钮
    },
    //---画质--
    // quality:{
    //     // defaultQuality: 0, // 默认画质索引
    //     // type: 'string', // 画质类型
    //     // text: ['标清', '高清', '超清'], // 画质文本
    //     // url: ['https://xxx.mp4', 'https://xxx.mp4', 'https://xxx.mp4'] // 画质链接
    // }
}