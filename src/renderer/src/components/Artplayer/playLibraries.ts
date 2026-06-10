//  import Hls from 'hls.js'; // 导入 Hls.js 库
//  import flvjs from 'flv.js';
//  import * as dashjs from 'dashjs';
import type Artplayer from 'artplayer'
import type { MediaPlayerClass, MediaType, Representation } from 'dashjs'

interface Destroyable {
  destroy: () => void
}

type DashControlCompatibility = MediaPlayerClass & {
  getBitrateInfoListFor?: (type: MediaType) => Array<Representation & { qualityIndex: number }>
  getQualityFor?: (type: MediaType) => number
  setQualityFor?: (type: MediaType, qualityIndex: number) => void
}

type PlayerAdapter = Artplayer & {
  hls?: Destroyable
  flv?: Destroyable
  dash?: Destroyable
}

const addDashControlCompatibility = (dash: DashControlCompatibility): void => {
  // artplayer-plugin-dash-control still uses the dash.js 4 quality API,
  // which was replaced by representation APIs in dash.js 5.
  dash.getBitrateInfoListFor = (type) =>
    dash.getRepresentationsByType(type).map((representation, qualityIndex) => ({
      ...representation,
      qualityIndex
    }))

  dash.getQualityFor = (type) => {
    const current = dash.getCurrentRepresentationForType(type)
    if (!current) return 0
    const currentIndex = dash
      .getRepresentationsByType(type)
      .findIndex((representation) => representation.id === current.id)
    return currentIndex >= 0 ? currentIndex : 0
  }

  dash.setQualityFor = (type, qualityIndex) => {
    dash.setRepresentationForTypeByIndex(type, qualityIndex, true)
  }
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
      addDashControlCompatibility(dash)
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
