import path from 'path'
import { describe, expect, it } from 'vitest'
import {
  authorizeMedia,
  getAuthorizedMediaPath,
  isAuthorizedMediaItem,
  isAuthorizedMediaPath,
  isValidMediaId,
  normalizeMediaPath
} from '../src/main/tools/mediaAccess'

describe('media access authorization', () => {
  const mediaId = '6f93d508-f0a8-4e09-9221-dfd1f4e68a35'
  const mediaPath = path.resolve('/tmp/media-player-tests/video.mp4')

  it('rejects unsafe or malformed media IDs', () => {
    expect(isValidMediaId('../outside')).toBe(false)
    expect(isValidMediaId('not-an-id')).toBe(false)
  })

  it('does not authorize arbitrary paths', () => {
    expect(isAuthorizedMediaPath(path.resolve('/tmp/media-player-tests/private.txt'))).toBe(false)
  })

  it('authorizes only the registered ID and absolute path pair', () => {
    authorizeMedia(mediaId, mediaPath)

    expect(getAuthorizedMediaPath(mediaId)).toBe(path.normalize(mediaPath))
    expect(isAuthorizedMediaPath(mediaPath)).toBe(true)
    expect(isAuthorizedMediaItem(mediaId, mediaPath)).toBe(true)
    expect(isAuthorizedMediaItem(mediaId, path.resolve('/tmp/other.mp4'))).toBe(false)
  })

  it('ignores authorization attempts with invalid IDs or relative paths', () => {
    authorizeMedia('../outside', mediaPath)
    authorizeMedia('947b49da-9c0c-42b1-9e0e-c343c6505bb1', 'relative/video.mp4')

    expect(getAuthorizedMediaPath('../outside')).toBeUndefined()
    expect(getAuthorizedMediaPath('947b49da-9c0c-42b1-9e0e-c343c6505bb1')).toBeUndefined()
  })

  it('matches authorized Windows paths without drive-letter case sensitivity', () => {
    const windowsId = 'd786f7fb-8e1e-4155-886c-5da316a7de26'
    authorizeMedia(windowsId, 'C:\\Users\\wangxin\\Desktop\\视频示例\\video.mp4')

    expect(normalizeMediaPath('c:/Users/wangxin/Desktop/视频示例/video.mp4'))
      .toBe('c:\\Users\\wangxin\\Desktop\\视频示例\\video.mp4')
    expect(isAuthorizedMediaPath('c:/Users/wangxin/Desktop/视频示例/video.mp4')).toBe(true)
    expect(isAuthorizedMediaItem(windowsId, 'c:/Users/wangxin/Desktop/视频示例/video.mp4')).toBe(true)
  })
})
