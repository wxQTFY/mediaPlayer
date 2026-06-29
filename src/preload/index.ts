import { contextBridge, ipcRenderer, webUtils } from 'electron'
import type { VideoItem } from '../common/types'

// Custom APIs for renderer
const api = {
  app: {
    versions: { ...process.versions }
  },
  window: {
    minimize: (): void => ipcRenderer.send('window-minimize'),
    maximize: (): void => ipcRenderer.send('window-maximize'),
    close: (): void => ipcRenderer.send('window-close')
  },
  media: {
    openFiles: (currentList: VideoItem[]): Promise<VideoItem[]> =>
      ipcRenderer.invoke('dialog:openFile', currentList),
    getPathForFile: (file: File): string => webUtils.getPathForFile(file),
    importDroppedFiles: (filePaths: string[], currentList: VideoItem[]): Promise<VideoItem[]> =>
      ipcRenderer.invoke('dialog:importDroppedFiles', filePaths, currentList),
    prepareFile: (id: string): Promise<{ url: string }> =>
      ipcRenderer.invoke('media:prepareFile', id),
    prepareStream: (id: string, duration: number): Promise<{ url: string }> =>
      ipcRenderer.invoke('media:prepareStream', id, duration),
    removeTranscodeCaches: (ids: string[]): Promise<void> =>
      ipcRenderer.invoke('media:removeTranscodeCaches', ids),
    probeDownload: (
      url: string
    ): Promise<{
      downloadable: boolean
      downloadKind?: 'file' | 'hls'
      fileName?: string
      contentLength?: number
      reason?: string
    }> => ipcRenderer.invoke('media:probeDownload', url),
    downloadUrl: (
      url: string,
      suggestedName?: string
    ): Promise<{
      canceled: boolean
      filePath?: string
      entryPath?: string
      outputDir?: string
      segmentCount?: number
    }> =>
      ipcRenderer.invoke('media:downloadUrl', url, suggestedName)
  },
  store: {
    getVideoList: (): Promise<VideoItem[]> => ipcRenderer.invoke('store:get'),
    setVideoList: (videoList: VideoItem[]): Promise<void> =>
      ipcRenderer.invoke('store:set', 'videoList', videoList)
  }
}

// Use `contextBridge` APIs to expose Electron APIs to
// renderer only if context isolation is enabled, otherwise
// just add to the DOM global.
if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('api', api)
  } catch (error) {
    console.error(error)
  }
} else {
  // @ts-ignore (define in dts)
  window.api = api
}
