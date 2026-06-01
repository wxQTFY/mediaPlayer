//  import Hls from 'hls.js'; // 导入 Hls.js 库
//  import flvjs from 'flv.js';
//  import * as dashjs from 'dashjs';

import artplayerPluginHlsControl from 'artplayer-plugin-hls-control';
  import artplayerPluginDashControl from 'artplayer-plugin-dash-control';

 export const playM3u8 = async (video: HTMLVideoElement, url: string,art: any) => {
    const Hls = (await import('hls.js')).default;
  if (Hls.isSupported()) {
    if(art.hls)
      art.hls.destroy();
      const hls = new Hls();
      hls.loadSource(url);
      hls.attachMedia(video);
      art.hls = hls;
      art.on('destroy', () => hls.destroy());
      // artplayerPluginHlsControl({
      //   quality: {
      //     control: true,
      //     setting: true,
      //     title: '画质',
      //     auto: '自动',
      //   }
      // })(art)
  } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
    video.src = url;
  } else {
    art.notice.show = '当前浏览器不支持播放该格式:m3u8';
  }
}

export const playFlv = async (video: HTMLVideoElement, url: string, art: any) => {
  console.log('正在使用 mpegts.js 播放 FLV:', url);
    const flvjs = (await import('flv.js')).default;
  if (flvjs.isSupported()) {
    if (art.flv)
      art.flv.destroy()
    const flv = flvjs.createPlayer({ type: 'flv', url })
    flv.attachMediaElement(video)
    flv.load()
    art.flv = flv
    art.on('destroy', () => flv.destroy())
  }
  else {
    art.notice.show = 'Unsupported playback format: flv'
  }
}


export const  playMpd = async (video: HTMLVideoElement, url: string, art: any) => {
    const dashjs = (await import('dashjs'));
  if (dashjs.supportsMediaSource()) {
    if (art.dash)
      art.dash.destroy()
      const dash = dashjs.MediaPlayer().create()
      dash.initialize(video, url, art.option.autoplay)
      art.dash = dash
      art.on('destroy', () => dash.destroy())
      // artplayerPluginDashControl({
      //   quality: {
      //     control: true,
      //     setting: true,
      //     title: '画质',
      //     auto: '自动',
      //   }
      // })(art)
  }
  else {
    art.notice.show = 'Unsupported playback format: mpd'
  }
}


//插件