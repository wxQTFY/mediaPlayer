import { contextBridge, ipcRenderer } from 'electron'
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
    prepareStream: (id: string, duration: number): Promise<{ url: string }> =>
      ipcRenderer.invoke('media:prepareStream', id, duration)
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
