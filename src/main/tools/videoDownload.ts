import { dialog } from 'electron'
import { createWriteStream } from 'fs'
import { pipeline } from 'stream/promises'
import http from 'http'
import https from 'https'
import path from 'path'

const MAX_REDIRECTS = 5
const PLAYLIST_EXTS = new Set(['.m3u8', '.mpd'])
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
  fileName?: string
  contentLength?: number
  reason?: string
}

export interface VideoDownloadResult {
  canceled: boolean
  filePath?: string
}

interface RequestResult {
  statusCode: number
  headers: http.IncomingHttpHeaders
  stream: http.IncomingMessage
  finalUrl: string
}

const assertDownloadableUrl = (rawUrl: string): URL => {
  const url = new URL(rawUrl)
  if (url.protocol !== 'http:' && url.protocol !== 'https:') {
    throw new Error('仅支持下载 http/https 视频地址')
  }
  return url
}

const hasPlaylistExtension = (url: URL): boolean => {
  const ext = path.extname(decodeURIComponent(url.pathname)).toLowerCase()
  return PLAYLIST_EXTS.has(ext)
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

const isVideoResponse = (headers: http.IncomingHttpHeaders, finalUrl: string): boolean => {
  const contentType = getHeader(headers, 'content-type')?.split(';')[0]?.trim().toLowerCase()
  if (contentType?.includes('mpegurl') || contentType === 'application/dash+xml') return false
  if (contentType?.startsWith('video/')) return true
  if (contentType === 'application/octet-stream') return true
  return Boolean(path.extname(new URL(finalUrl).pathname))
}

export const probeVideoDownload = async (rawUrl: string): Promise<VideoDownloadProbeResult> => {
  const url = assertDownloadableUrl(rawUrl)
  if (hasPlaylistExtension(url)) {
    return { downloadable: false, reason: '播放列表地址不作为单文件下载' }
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
