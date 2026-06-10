export type PlaybackStrategy = 'direct' | 'stream'

export const VIDEO_EXTS = [
  '.mp4', '.m4v', '.mov', '.webm', '.ogg', '.ogv', '.flv', '.mpd', '.m3u8',
  '.mkv', '.avi', '.wmv', '.rmvb', '.mpg', '.mpeg', '.3gp', '.3pg'
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

const NATIVE_MIME_TYPES: Record<string, Record<string, string>> = {
  '.mp4': { h264: 'video/mp4; codecs="avc1.42E01E"', av1: 'video/mp4; codecs="av01"' },
  '.m4v': { h264: 'video/mp4; codecs="avc1.42E01E"', av1: 'video/mp4; codecs="av01"' },
  '.mov': { h264: 'video/mp4; codecs="avc1.42E01E"', av1: 'video/mp4; codecs="av01"' },
  '.webm': {
    vp8: 'video/webm; codecs="vp8"',
    vp9: 'video/webm; codecs="vp9"',
    av1: 'video/webm; codecs="av01"'
  },
  '.ogg': { theora: 'video/ogg; codecs="theora"', vp8: 'video/ogg; codecs="vp8"', vp9: 'video/ogg; codecs="vp9"' },
  '.ogv': { theora: 'video/ogg; codecs="theora"', vp8: 'video/ogg; codecs="vp8"', vp9: 'video/ogg; codecs="vp9"' }
}

const getExtension = (filePath: string): string =>
  filePath.match(/\.[^./\\?#]+(?=[?#]|$)/)?.[0].toLowerCase() ?? ''

export const isSupportedLocalVideo = (filePath: string): boolean =>
  VIDEO_EXTS.includes(getExtension(filePath))

export const getNativeMimeType = (filePath: string, vCodec = ''): string | undefined =>
  NATIVE_MIME_TYPES[getExtension(filePath)]?.[vCodec.toLowerCase()]

export const canFallbackToTranscode = (filePath: string): boolean =>
  !SPECIAL_PLAYER_EXTS.has(getExtension(filePath))

export const getLocalPlaybackStrategy = (
  filePath: string,
  vCodec = ''
): PlaybackStrategy => {
  const ext = getExtension(filePath)
  if (SPECIAL_PLAYER_EXTS.has(ext)) return 'direct'
  if (NATIVE_VIDEO_CODECS[ext]?.has(vCodec.toLowerCase())) return 'direct'
  return 'stream'
}
