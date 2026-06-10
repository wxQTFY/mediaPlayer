import { describe, expect, it } from 'vitest'
import { MAX_TRANSCODE_DURATION, normalizeTranscodeDuration } from '../src/common/transcodeDuration'

describe('transcode duration normalization', () => {
  it('uses unknown duration when metadata has no usable duration', () => {
    expect(normalizeTranscodeDuration(undefined)).toBe(0)
    expect(normalizeTranscodeDuration(null)).toBe(0)
    expect(normalizeTranscodeDuration(Number.NaN)).toBe(0)
    expect(normalizeTranscodeDuration(Number.POSITIVE_INFINITY)).toBe(0)
  })

  it('keeps valid durations', () => {
    expect(normalizeTranscodeDuration(0)).toBe(0)
    expect(normalizeTranscodeDuration(120.5)).toBe(120.5)
    expect(normalizeTranscodeDuration(MAX_TRANSCODE_DURATION)).toBe(MAX_TRANSCODE_DURATION)
  })

  it('rejects invalid duration values', () => {
    expect(() => normalizeTranscodeDuration(-1)).toThrow('无效的视频参数')
    expect(() => normalizeTranscodeDuration(MAX_TRANSCODE_DURATION + 1)).toThrow('无效的视频参数')
    expect(() => normalizeTranscodeDuration('120')).toThrow('无效的视频参数')
  })
})
