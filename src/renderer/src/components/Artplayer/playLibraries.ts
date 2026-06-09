//  import Hls from 'hls.js'; // 导入 Hls.js 库
//  import flvjs from 'flv.js';
//  import * as dashjs from 'dashjs';
import type Artplayer from 'artplayer'

interface Destroyable {
  destroy: () => void
}

type PlayerAdapter = Artplayer & {
  hls?: Destroyable
  flv?: Destroyable
  dash?: Destroyable
}

 export const playM3u8 = async (video: HTMLVideoElement, url: string,art: Artplayer): Promise<void> => {
    const player = art as PlayerAdapter
    const Hls = (await import('hls.js')).default;
  if (Hls.isSupported()) {
    if(player.hls)
      player.hls.destroy();
      const hls = new Hls();
      hls.loadSource(url);
      hls.attachMedia(video);
      player.hls = hls;
      player.on('destroy', () => hls.destroy());
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

export const playFlv = async (video: HTMLVideoElement, url: string, art: Artplayer): Promise<void> => {
  const player = art as PlayerAdapter
  console.log('正在使用 mpegts.js 播放 FLV:', url);
    const flvjs = (await import('flv.js')).default;
  if (flvjs.isSupported()) {
    if (player.flv)
      player.flv.destroy()
    const flv = flvjs.createPlayer({ type: 'flv', url })
    flv.attachMediaElement(video)
    flv.load()
    player.flv = flv
    player.on('destroy', () => flv.destroy())
  }
  else {
    art.notice.show = 'Unsupported playback format: flv'
  }
}


export const playMpd = async (video: HTMLVideoElement, url: string, art: Artplayer): Promise<void> => {
    const player = art as PlayerAdapter
    const dashjs = (await import('dashjs'));
  if (dashjs.supportsMediaSource()) {
    if (player.dash)
      player.dash.destroy()
      const dash = dashjs.MediaPlayer().create()
      dash.initialize(video, url, art.option.autoplay)
      player.dash = dash
      player.on('destroy', () => dash.destroy())
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
