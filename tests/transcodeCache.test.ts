import fs from 'fs'
import os from 'os'
import path from 'path'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import {
  cleanupExpiredTranscodeCaches,
  removeTranscodeCache,
  TRANSCODE_CACHE_MAX_AGE
} from '../src/main/controller/transCodeManage/transCodeManage'

describe('transcode cache cleanup', () => {
  let cacheRoot: string

  beforeEach(async () => {
    cacheRoot = await fs.promises.mkdtemp(path.join(os.tmpdir(), 'transcode-cache-test-'))
  })

  afterEach(async () => {
    await fs.promises.rm(cacheRoot, { recursive: true, force: true })
  })

  it('removes the cache directory for a selected media ID', async () => {
    const id = '6f93d508-f0a8-4e09-9221-dfd1f4e68a35'
    const cacheDir = path.join(cacheRoot, id)
    await fs.promises.mkdir(cacheDir)
    await fs.promises.writeFile(path.join(cacheDir, 'index.m3u8'), '#EXTM3U')

    await expect(removeTranscodeCache(id, cacheRoot)).resolves.toBe(true)
    expect(fs.existsSync(cacheDir)).toBe(false)
  })

  it('rejects invalid media IDs', async () => {
    await expect(removeTranscodeCache('../outside', cacheRoot)).rejects.toThrow('无效的视频 ID')
  })

  it('removes only media caches that are at least 30 days old', async () => {
    const expiredId = '947b49da-9c0c-42b1-9e0e-c343c6505bb1'
    const recentId = 'd786f7fb-8e1e-4155-886c-5da316a7de26'
    const expiredDir = path.join(cacheRoot, expiredId)
    const recentDir = path.join(cacheRoot, recentId)
    const unrelatedDir = path.join(cacheRoot, 'unrelated')
    const now = Date.now()

    await Promise.all([
      fs.promises.mkdir(expiredDir),
      fs.promises.mkdir(recentDir),
      fs.promises.mkdir(unrelatedDir)
    ])
    await fs.promises.utimes(expiredDir, new Date(now - TRANSCODE_CACHE_MAX_AGE), new Date(now - TRANSCODE_CACHE_MAX_AGE))

    await expect(cleanupExpiredTranscodeCaches(TRANSCODE_CACHE_MAX_AGE, cacheRoot, now)).resolves.toBe(1)
    expect(fs.existsSync(expiredDir)).toBe(false)
    expect(fs.existsSync(recentDir)).toBe(true)
    expect(fs.existsSync(unrelatedDir)).toBe(true)
  })
})
