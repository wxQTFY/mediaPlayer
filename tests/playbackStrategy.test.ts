import { describe, expect, it } from 'vitest'
import {
  canFallbackToTranscode,
  getLocalPlaybackStrategy,
  getNativeMimeType,
  VIDEO_EXTS
} from '../src/common/playbackStrategy'

describe('local playback strategy', () => {
  it('directly plays supported native container and codec combinations', () => {
    expect(getLocalPlaybackStrategy('/videos/video.mp4', 'h264')).toBe('direct')
    expect(getLocalPlaybackStrategy('/videos/video.webm', 'vp9')).toBe('direct')
    expect(getLocalPlaybackStrategy('/videos/video.ogg', 'theora')).toBe('direct')
  })

  it('transcodes containers or codecs that Chromium cannot reliably play', () => {
    expect(getLocalPlaybackStrategy('/videos/video.mpg', 'mpeg2video')).toBe('stream')
    expect(getLocalPlaybackStrategy('/videos/video.3gp', 'h263')).toBe('stream')
    expect(getLocalPlaybackStrategy('/videos/video.swf', 'flv1')).toBe('stream')
  })

  it('provides runtime MIME checks and fallback eligibility for native candidates', () => {
    expect(getNativeMimeType('/videos/video.webm', 'vp9')).toBe('video/webm; codecs="vp9"')
    expect(getNativeMimeType('/videos/video.ogg', 'theora')).toBe('video/ogg; codecs="theora"')
    expect(canFallbackToTranscode('/videos/video.webm')).toBe(true)
    expect(canFallbackToTranscode('/videos/video.flv')).toBe(false)
  })

  it('keeps specialized streaming formats on their native adapters', () => {
    expect(getLocalPlaybackStrategy('/videos/video.flv', 'flv1')).toBe('direct')
    expect(getLocalPlaybackStrategy('/videos/video.m3u8')).toBe('direct')
    expect(getLocalPlaybackStrategy('/videos/video.mpd')).toBe('direct')
  })

  it('accepts the requested legacy video extensions', () => {
    expect(VIDEO_EXTS).toEqual(expect.arrayContaining(['.ogg', '.ogv', '.swf', '.mpg', '.mpeg', '.3gp', '.3pg']))
  })
})
