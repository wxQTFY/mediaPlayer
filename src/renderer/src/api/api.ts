export const transCodeUrl = (id: string, duration: number): Promise<{ url: string }> => {
  return window.api.media.prepareStream(id, duration)
}

export const localMediaUrl = (id: string): Promise<{ url: string }> => {
  return window.api.media.prepareFile(id)
}

export const removeTranscodeCaches = (ids: string[]): Promise<void> => {
  return window.api.media.removeTranscodeCaches(ids)
}

export const probeVideoDownload = (
  url: string
): Promise<{
  downloadable: boolean
  downloadKind?: 'file' | 'hls'
  fileName?: string
  contentLength?: number
  reason?: string
}> => {
  return window.api.media.probeDownload(url)
}

export const downloadVideoUrl = (
  url: string,
  suggestedName?: string
): Promise<{ canceled: boolean; filePath?: string }> => {
  return window.api.media.downloadUrl(url, suggestedName)
}
