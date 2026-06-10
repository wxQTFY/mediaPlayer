export const MAX_TRANSCODE_DURATION = 86400

export const normalizeTranscodeDuration = (duration: unknown): number => {
  if (duration === undefined || duration === null) return 0
  if (typeof duration !== 'number') throw new Error('无效的视频参数')
  if (!Number.isFinite(duration)) return 0
  if (duration < 0 || duration > MAX_TRANSCODE_DURATION) {
    throw new Error('无效的视频参数')
  }
  return duration
}
