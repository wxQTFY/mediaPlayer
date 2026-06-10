export type PlaybackStrategy = 'direct' | 'stream'

export const VIDEO_EXTS = [
  '.mp4', '.m4v', '.mov', '.webm', '.ogg', '.ogv', '.flv', '.mpd', '.m3u8',
  '.mkv', '.avi', '.wmv', '.rmvb', '.mpg', '.mpeg', '.swf', '.3gp', '.3pg'
]

const SPECIAL_PLAYER_EXTS = new Set(['.flv', '.mpd', '.m3u8'])
const NATIVE_VIDEO_CODECS: Record<string, Set<string>> = {
  '.mp4': new Set(['h264', 'av1']),
  '.m4v': new Set(['h264', 'av1']),
  '.mov': new Set(['h264', 'av1']),
  '.webm': new Set(['vp8', 'vp9', 'av1']),
  '.ogg': new Set(['theora', 'vp8', 'vp9']),
  '.ogv': new Set(['theora', 'vp8', 'vp9'])
}

export const getLocalPlaybackStrategy = (
  filePath: string,
  vCodec = '',
  duration = 0
): PlaybackStrategy => {
  const ext = filePath.match(/\.[^./\\?#]+(?=[?#]|$)/)?.[0].toLowerCase() ?? ''
  if (SPECIAL_PLAYER_EXTS.has(ext)) return 'direct'
  if (NATIVE_VIDEO_CODECS[ext]?.has(vCodec.toLowerCase())) return 'direct'
  return duration > 0 ? 'stream' : 'direct'
}
