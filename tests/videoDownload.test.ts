import http from 'http'
import fs from 'fs'
import os from 'os'
import path from 'path'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { downloadVideoFromUrl, probeVideoDownload } from '../src/main/tools/videoDownload'

const dialogMocks = vi.hoisted(() => ({
  showSaveDialog: vi.fn(),
  showOpenDialog: vi.fn()
}))

vi.mock('electron', () => ({
  dialog: {
    showSaveDialog: dialogMocks.showSaveDialog,
    showOpenDialog: dialogMocks.showOpenDialog
  }
}))

describe('video download probing', () => {
  let server: http.Server
  let baseUrl: string
  let tempDir: string

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

      if (req.url === '/media.m3u8') {
        res.writeHead(200, {
          'content-type': 'application/vnd.apple.mpegurl'
        })
        res.end(
          [
            '#EXTM3U',
            '#EXT-X-VERSION:3',
            '#EXT-X-PLAYLIST-TYPE:VOD',
            '#EXT-X-TARGETDURATION:10',
            '#EXTINF:10.000,',
            'segment-a.ts',
            '#EXTINF:10.000,',
            'segment-b.ts',
            '#EXT-X-ENDLIST',
            ''
          ].join('\n')
        )
        return
      }

      if (req.url === '/segment-a.ts') {
        res.writeHead(200, { 'content-type': 'video/mp2t' })
        res.end('segment-a')
        return
      }

      if (req.url === '/segment-b.ts') {
        res.writeHead(200, { 'content-type': 'video/mp2t' })
        res.end('segment-b')
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
    tempDir = await fs.promises.mkdtemp(path.join(os.tmpdir(), 'hls-download-test-'))
    dialogMocks.showOpenDialog.mockReset()
  })

  afterEach(async () => {
    await new Promise<void>((resolve, reject) => {
      server.close((error) => {
        if (error) reject(error)
        else resolve()
      })
    })
    await fs.promises.rm(tempDir, { recursive: true, force: true })
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
      fileName: 'master_hls'
    })
  })

  it('keeps DASH playlists unsupported for now', async () => {
    await expect(probeVideoDownload(`${baseUrl}/video.mpd`)).resolves.toMatchObject({
      downloadable: false,
      reason: 'DASH 播放列表暂不支持下载'
    })
  })

  it('downloads HLS playlists as local segment packages', async () => {
    dialogMocks.showOpenDialog.mockResolvedValue({
      canceled: false,
      filePaths: [tempDir]
    })

    const result = await downloadVideoFromUrl(`${baseUrl}/master.m3u8`, 'sample_hls')

    expect(result).toMatchObject({
      canceled: false,
      segmentCount: 2
    })
    expect(result.entryPath).toBeTruthy()
    expect(result.outputDir).toBeTruthy()

    const entryPath = result.entryPath!
    const outputDir = result.outputDir!
    const indexContent = await fs.promises.readFile(entryPath, 'utf8')
    expect(indexContent).toContain('segments/000001.ts')
    expect(indexContent).toContain('segments/000002.ts')
    await expect(fs.promises.readFile(path.join(outputDir, 'segments/000001.ts'), 'utf8'))
      .resolves.toBe('segment-a')
    await expect(fs.promises.readFile(path.join(outputDir, 'segments/000002.ts'), 'utf8'))
      .resolves.toBe('segment-b')
    await expect(fs.promises.readFile(path.join(outputDir, 'metadata.json'), 'utf8'))
      .resolves.toContain('"segmentCount": 2')
  })
})
