export type PlaybackStrategy = 'direct' | 'stream'

export const VIDEO_EXTS = [
  '.mp4', '.m4v', '.mov', '.webm', '.ogg', '.ogv', '.flv', '.mpd', '.m3u8',
  '.mkv', '.avi', '.wmv', '.rmvb', '.mpg', '.mpeg', '.swf', '.3gp', '.3pg'
]

const SPECIAL_PLAYER_EXTS = new Set(['.flv', '.mpd', '.m3u8'])
const FORCE_TRANSCODE_EXTS = new Set(['.webm', '.ogg', '.ogv', '.swf'])
const NATIVE_VIDEO_CODECS: Record<string, Set<string>> = {
  '.mp4': new Set(['h264', 'av1']),
  '.m4v': new Set(['h264', 'av1']),
  '.mov': new Set(['h264', 'av1'])
}

export const getLocalPlaybackStrategy = (
  filePath: string,
  vCodec = ''
): PlaybackStrategy => {
  const ext = filePath.match(/\.[^./\\?#]+(?=[?#]|$)/)?.[0].toLowerCase() ?? ''
  if (SPECIAL_PLAYER_EXTS.has(ext)) return 'direct'
  if (FORCE_TRANSCODE_EXTS.has(ext)) return 'stream'
  if (NATIVE_VIDEO_CODECS[ext]?.has(vCodec.toLowerCase())) return 'direct'
  return 'stream'
}
