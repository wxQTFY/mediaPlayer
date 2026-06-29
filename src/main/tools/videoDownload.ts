import { dialog } from 'electron'
import fs, { createWriteStream } from 'fs'
import { pipeline } from 'stream/promises'
import http from 'http'
import https from 'https'
import path from 'path'

const MAX_REDIRECTS = 5
const HLS_EXT = '.m3u8'
const DASH_EXT = '.mpd'
const VIDEO_MIME_EXTS = new Map([
  ['video/mp4', '.mp4'],
  ['video/webm', '.webm'],
  ['video/x-flv', '.flv'],
  ['video/quicktime', '.mov'],
  ['video/x-msvideo', '.avi'],
  ['video/x-ms-wmv', '.wmv'],
  ['video/ogg', '.ogv'],
  ['application/octet-stream', '.mp4']
])

export interface VideoDownloadProbeResult {
  downloadable: boolean
  downloadKind?: 'file' | 'hls'
  fileName?: string
  contentLength?: number
  reason?: string
}

export interface VideoDownloadResult {
  canceled: boolean
  filePath?: string
  entryPath?: string
  outputDir?: string
  segmentCount?: number
}

interface RequestResult {
  statusCode: number
  headers: http.IncomingHttpHeaders
  stream: http.IncomingMessage
  finalUrl: string
}

interface HlsVariant {
  uri: string
  bandwidth?: number
  resolution?: string
  name?: string
}

interface HlsMediaPlaylist {
  content: string
  mediaUrl: string
  segments: string[]
}

const assertDownloadableUrl = (rawUrl: string): URL => {
  const url = new URL(rawUrl)
  if (url.protocol !== 'http:' && url.protocol !== 'https:') {
    throw new Error('仅支持下载 http/https 视频地址')
  }
  return url
}

const getUrlExtension = (url: URL): string => {
  const ext = path.extname(decodeURIComponent(url.pathname)).toLowerCase()
  return ext
}

const isHlsPlaylist = (url: URL): boolean => {
  return getUrlExtension(url) === HLS_EXT
}

const isDashPlaylist = (url: URL): boolean => {
  return getUrlExtension(url) === DASH_EXT
}

const getHeader = (headers: http.IncomingHttpHeaders, name: string): string | undefined => {
  const value = headers[name.toLowerCase()]
  return Array.isArray(value) ? value[0] : value
}

const requestUrl = (
  rawUrl: string,
  method: 'HEAD' | 'GET',
  headers: Record<string, string> = {},
  redirectCount = 0
): Promise<RequestResult> => {
  if (redirectCount > MAX_REDIRECTS) {
    return Promise.reject(new Error('视频地址重定向次数过多'))
  }

  const url = assertDownloadableUrl(rawUrl)
  const client = url.protocol === 'https:' ? https : http

  return new Promise((resolve, reject) => {
    const req = client.request(
      url,
      {
        method,
        headers: {
          'User-Agent': 'SanjinMediaPlayer/1.0',
          ...headers
        }
      },
      (res) => {
        const statusCode = res.statusCode ?? 0
        const location = res.headers.location
        if (statusCode >= 300 && statusCode < 400 && location) {
          res.resume()
          const nextUrl = new URL(location, url).toString()
          requestUrl(nextUrl, method, headers, redirectCount + 1)
            .then(resolve)
            .catch(reject)
          return
        }

        resolve({
          statusCode,
          headers: res.headers,
          stream: res,
          finalUrl: url.toString()
        })
      }
    )

    req.on('error', reject)
    req.end()
  })
}

const parseContentDispositionFileName = (header?: string): string | undefined => {
  if (!header) return undefined

  const utf8Match = /filename\*=UTF-8''([^;]+)/i.exec(header)
  if (utf8Match?.[1]) {
    return decodeURIComponent(utf8Match[1].trim().replace(/^"|"$/g, ''))
  }

  const asciiMatch = /filename="?([^";]+)"?/i.exec(header)
  return asciiMatch?.[1]?.trim()
}

const getFileNameFromUrl = (url: URL): string | undefined => {
  const decodedPath = decodeURIComponent(url.pathname)
  const baseName = path.basename(decodedPath)
  return baseName && baseName !== '/' ? baseName : undefined
}

const sanitizeFileName = (fileName: string): string => {
  const sanitized = Array.from(fileName)
    .map((char) => (char.charCodeAt(0) < 32 || /[<>:"/\\|?*]/.test(char) ? '_' : char))
    .join('')
    .trim()
  return sanitized || 'video'
}

const inferExtension = (headers: http.IncomingHttpHeaders, currentName: string): string => {
  if (path.extname(currentName)) return ''
  const contentType = getHeader(headers, 'content-type')?.split(';')[0]?.trim().toLowerCase()
  return (contentType && VIDEO_MIME_EXTS.get(contentType)) || '.mp4'
}

const buildSuggestedFileName = (
  headers: http.IncomingHttpHeaders,
  finalUrl: string,
  fallbackName?: string
): string => {
  const dispositionName = parseContentDispositionFileName(getHeader(headers, 'content-disposition'))
  const urlName = getFileNameFromUrl(new URL(finalUrl))
  const baseName = sanitizeFileName(dispositionName || fallbackName || urlName || 'video')
  return `${baseName}${inferExtension(headers, baseName)}`
}

const buildHlsPackageName = (url: URL, fallbackName?: string): string => {
  const baseName = sanitizeFileName(fallbackName || getFileNameFromUrl(url) || 'video')
  const withoutExt = path.extname(baseName) ? baseName.slice(0, -path.extname(baseName).length) : baseName
  return `${withoutExt}_hls`
}

const isVideoResponse = (headers: http.IncomingHttpHeaders, finalUrl: string): boolean => {
  const contentType = getHeader(headers, 'content-type')?.split(';')[0]?.trim().toLowerCase()
  if (contentType?.includes('mpegurl') || contentType === 'application/dash+xml') return false
  if (contentType?.startsWith('video/')) return true
  if (contentType === 'application/octet-stream') return true
  return Boolean(path.extname(new URL(finalUrl).pathname))
}

const readStreamText = async (stream: http.IncomingMessage): Promise<string> => {
  const chunks: Buffer[] = []
  for await (const chunk of stream) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk))
  }
  return Buffer.concat(chunks).toString('utf8')
}

const fetchText = async (rawUrl: string): Promise<{ text: string; finalUrl: string }> => {
  const response = await requestUrl(rawUrl, 'GET')
  if (response.statusCode < 200 || response.statusCode >= 400) {
    response.stream.resume()
    throw new Error(`播放列表下载失败：${response.statusCode}`)
  }
  return {
    text: await readStreamText(response.stream),
    finalUrl: response.finalUrl
  }
}

const parseAttributeList = (value: string): Record<string, string> => {
  const attributes: Record<string, string> = {}
  const pattern = /([A-Z0-9-]+)=("[^"]*"|[^,]*)/g
  let match: RegExpExecArray | null
  while ((match = pattern.exec(value))) {
    attributes[match[1]] = match[2].replace(/^"|"$/g, '')
  }
  return attributes
}

const parseHlsVariants = (content: string): HlsVariant[] => {
  const lines = content.split(/\r?\n/)
  const variants: HlsVariant[] = []
  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index].trim()
    if (!line.startsWith('#EXT-X-STREAM-INF:')) continue
    const attributes = parseAttributeList(line.slice('#EXT-X-STREAM-INF:'.length))
    const uri = lines.slice(index + 1).find((candidate) => {
      const trimmed = candidate.trim()
      return trimmed && !trimmed.startsWith('#')
    })?.trim()
    if (!uri) continue
    variants.push({
      uri,
      bandwidth: attributes.BANDWIDTH ? Number(attributes.BANDWIDTH) : undefined,
      resolution: attributes.RESOLUTION,
      name: attributes.NAME
    })
  }
  return variants
}

const getResolutionPixels = (resolution?: string): number => {
  const match = /^(\d+)x(\d+)$/i.exec(resolution ?? '')
  if (!match) return 0
  return Number(match[1]) * Number(match[2])
}

const selectBestHlsVariant = (variants: HlsVariant[]): HlsVariant | undefined => {
  return [...variants].sort((a, b) => {
    const pixelDiff = getResolutionPixels(b.resolution) - getResolutionPixels(a.resolution)
    if (pixelDiff !== 0) return pixelDiff
    return (b.bandwidth ?? 0) - (a.bandwidth ?? 0)
  })[0]
}

const parseHlsSegments = (content: string): string[] => {
  const lines = content.split(/\r?\n/)
  const segments: string[] = []
  let expectsSegment = false
  for (const rawLine of lines) {
    const line = rawLine.trim()
    if (!line) continue
    if (line.startsWith('#EXT-X-KEY') && !line.includes('METHOD=NONE')) {
      throw new Error('暂不支持加密 HLS 下载')
    }
    if (line.startsWith('#EXT-X-MAP')) {
      throw new Error('暂不支持 fMP4 HLS 下载')
    }
    if (line.startsWith('#EXTINF')) {
      expectsSegment = true
      continue
    }
    if (expectsSegment && !line.startsWith('#')) {
      segments.push(line)
      expectsSegment = false
    }
  }
  if (!content.includes('#EXT-X-ENDLIST')) {
    throw new Error('暂不支持直播流完整下载')
  }
  if (segments.length === 0) {
    throw new Error('未找到可下载的 HLS 分片')
  }
  return segments
}

const resolveHlsMediaPlaylist = async (rawUrl: string): Promise<HlsMediaPlaylist> => {
  const source = await fetchText(rawUrl)
  if (!source.text.trimStart().startsWith('#EXTM3U')) {
    throw new Error('不是有效的 HLS 播放列表')
  }

  const variants = parseHlsVariants(source.text)
  if (variants.length === 0) {
    return {
      content: source.text,
      mediaUrl: source.finalUrl,
      segments: parseHlsSegments(source.text)
    }
  }

  const selectedVariant = selectBestHlsVariant(variants)
  if (!selectedVariant) {
    throw new Error('未找到可下载清晰度')
  }

  const mediaUrl = new URL(selectedVariant.uri, source.finalUrl).toString()
  const media = await fetchText(mediaUrl)
  return {
    content: media.text,
    mediaUrl: media.finalUrl,
    segments: parseHlsSegments(media.text)
  }
}

const createUniqueDirectory = async (parentDir: string, baseName: string): Promise<string> => {
  let candidate = path.join(parentDir, baseName)
  let suffix = 1
  while (fs.existsSync(candidate)) {
    suffix += 1
    candidate = path.join(parentDir, `${baseName}_${suffix}`)
  }
  await fs.promises.mkdir(candidate, { recursive: true })
  return candidate
}

const rewriteHlsPlaylist = (content: string, localSegmentPaths: string[]): string => {
  const lines = content.split(/\r?\n/)
  let segmentIndex = 0
  let expectsSegment = false
  return lines
    .map((rawLine) => {
      const line = rawLine.trim()
      if (line.startsWith('#EXTINF')) {
        expectsSegment = true
        return rawLine
      }
      if (expectsSegment && line && !line.startsWith('#')) {
        const localPath = localSegmentPaths[segmentIndex]
        segmentIndex += 1
        expectsSegment = false
        return localPath
      }
      return rawLine
    })
    .join('\n')
}

const downloadHlsPackage = async (
  rawUrl: string,
  parentDir: string,
  packageName: string
): Promise<Required<Pick<VideoDownloadResult, 'entryPath' | 'outputDir' | 'segmentCount'>>> => {
  const playlist = await resolveHlsMediaPlaylist(rawUrl)
  const outputDir = await createUniqueDirectory(parentDir, packageName)
  const segmentsDir = path.join(outputDir, 'segments')
  await fs.promises.mkdir(segmentsDir, { recursive: true })

  const localSegmentPaths: string[] = []
  for (const [index, segmentUri] of playlist.segments.entries()) {
    const segmentUrl = new URL(segmentUri, playlist.mediaUrl).toString()
    const ext = path.extname(new URL(segmentUrl).pathname) || '.ts'
    const fileName = `${String(index + 1).padStart(6, '0')}${ext}`
    const relativePath = `segments/${fileName}`
    const outputPath = path.join(segmentsDir, fileName)
    const response = await requestUrl(segmentUrl, 'GET')
    if (response.statusCode < 200 || response.statusCode >= 400) {
      response.stream.resume()
      throw new Error(`HLS 分片下载失败：${response.statusCode}`)
    }
    await pipeline(response.stream, createWriteStream(outputPath))
    localSegmentPaths.push(relativePath)
  }

  const entryPath = path.join(outputDir, 'index.m3u8')
  await fs.promises.writeFile(
    entryPath,
    rewriteHlsPlaylist(playlist.content, localSegmentPaths),
    'utf8'
  )
  await fs.promises.writeFile(path.join(outputDir, 'manifest.source.m3u8'), playlist.content, 'utf8')
  await fs.promises.writeFile(
    path.join(outputDir, 'metadata.json'),
    JSON.stringify(
      {
        sourceUrl: rawUrl,
        mediaPlaylistUrl: playlist.mediaUrl,
        segmentCount: playlist.segments.length,
        downloadedAt: new Date().toISOString()
      },
      null,
      2
    ),
    'utf8'
  )

  return {
    entryPath,
    outputDir,
    segmentCount: playlist.segments.length
  }
}

export const probeVideoDownload = async (rawUrl: string): Promise<VideoDownloadProbeResult> => {
  const url = assertDownloadableUrl(rawUrl)
  if (isHlsPlaylist(url)) {
    let response = await requestUrl(url.toString(), 'HEAD')
    if (response.statusCode === 405 || response.statusCode >= 500) {
      response = await requestUrl(url.toString(), 'GET', { Range: 'bytes=0-0' })
      response.stream.resume()
    }
    if (response.statusCode < 200 || response.statusCode >= 400) {
      return { downloadable: false, reason: `服务端返回 ${response.statusCode}` }
    }
    return {
      downloadable: true,
      downloadKind: 'hls',
      fileName: buildHlsPackageName(new URL(response.finalUrl))
    }
  }
  if (isDashPlaylist(url)) {
    return { downloadable: false, reason: 'DASH 播放列表暂不支持下载' }
  }

  let response = await requestUrl(url.toString(), 'HEAD')
  if (response.statusCode === 405 || response.statusCode >= 500) {
    response = await requestUrl(url.toString(), 'GET', { Range: 'bytes=0-0' })
    response.stream.resume()
  }

  if (response.statusCode < 200 || response.statusCode >= 400) {
    return { downloadable: false, reason: `服务端返回 ${response.statusCode}` }
  }

  if (!isVideoResponse(response.headers, response.finalUrl)) {
    return { downloadable: false, reason: '响应不是可下载视频文件' }
  }

  const contentLength = Number(getHeader(response.headers, 'content-length'))
  return {
    downloadable: true,
    downloadKind: 'file',
    fileName: buildSuggestedFileName(response.headers, response.finalUrl),
    contentLength: Number.isFinite(contentLength) ? contentLength : undefined
  }
}

export const downloadVideoFromUrl = async (
  rawUrl: string,
  suggestedName?: string
): Promise<VideoDownloadResult> => {
  const probe = await probeVideoDownload(rawUrl)
  if (!probe.downloadable) {
    throw new Error(probe.reason || '当前视频不可下载')
  }

  if (probe.downloadKind === 'hls') {
    const { canceled, filePaths } = await dialog.showOpenDialog({
      title: '选择 HLS 分片保存目录',
      properties: ['openDirectory', 'createDirectory']
    })
    if (canceled || filePaths.length === 0) return { canceled: true }
    const result = await downloadHlsPackage(
      rawUrl,
      filePaths[0],
      buildHlsPackageName(assertDownloadableUrl(rawUrl), suggestedName || probe.fileName)
    )
    return {
      canceled: false,
      filePath: result.entryPath,
      ...result
    }
  }

  const { canceled, filePath } = await dialog.showSaveDialog({
    title: '保存视频',
    defaultPath: suggestedName || probe.fileName || 'video.mp4'
  })
  if (canceled || !filePath) return { canceled: true }

  const response = await requestUrl(rawUrl, 'GET')
  if (response.statusCode < 200 || response.statusCode >= 400) {
    response.stream.resume()
    throw new Error(`视频下载失败：${response.statusCode}`)
  }

  await pipeline(response.stream, createWriteStream(filePath))
  return { canceled: false, filePath }
}
