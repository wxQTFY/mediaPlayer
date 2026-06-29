import http from 'http'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { probeVideoDownload } from '../src/main/tools/videoDownload'

vi.mock('electron', () => ({
  dialog: {
    showSaveDialog: vi.fn()
  }
}))

describe('video download probing', () => {
  let server: http.Server
  let baseUrl: string

  beforeEach(async () => {
    server = http.createServer((req, res) => {
      if (req.url === '/video.mp4') {
        res.writeHead(200, {
          'content-type': 'video/mp4',
          'content-length': '1024'
        })
        res.end()
        return
      }

      if (req.url === '/master.m3u8') {
        res.writeHead(200, {
          'content-type': 'application/vnd.apple.mpegurl'
        })
        res.end('#EXTM3U\n#EXT-X-STREAM-INF:BANDWIDTH=1000\nmedia.m3u8\n')
        return
      }

      if (req.url === '/video.mpd') {
        res.writeHead(200, {
          'content-type': 'application/dash+xml'
        })
        res.end('<MPD></MPD>')
        return
      }

      res.writeHead(404)
      res.end()
    })

    await new Promise<void>((resolve) => {
      server.listen(0, '127.0.0.1', () => resolve())
    })
    const address = server.address()
    if (!address || typeof address === 'string') throw new Error('测试服务器启动失败')
    baseUrl = `http://127.0.0.1:${address.port}`
  })

  afterEach(async () => {
    await new Promise<void>((resolve, reject) => {
      server.close((error) => {
        if (error) reject(error)
        else resolve()
      })
    })
  })

  it('detects direct video files as downloadable files', async () => {
    await expect(probeVideoDownload(`${baseUrl}/video.mp4`)).resolves.toMatchObject({
      downloadable: true,
      downloadKind: 'file',
      fileName: 'video.mp4',
      contentLength: 1024
    })
  })

  it('detects HLS playlists as downloadable streams', async () => {
    await expect(probeVideoDownload(`${baseUrl}/master.m3u8`)).resolves.toMatchObject({
      downloadable: true,
      downloadKind: 'hls',
      fileName: 'master.mp4'
    })
  })

  it('keeps DASH playlists unsupported for now', async () => {
    await expect(probeVideoDownload(`${baseUrl}/video.mpd`)).resolves.toMatchObject({
      downloadable: false,
      reason: 'DASH 播放列表暂不支持下载'
    })
  })
})
