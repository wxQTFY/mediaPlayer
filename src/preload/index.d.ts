import type { VideoItem } from '../common/types'

declare global {
  interface Window {
    api: {
      app: {
        versions: NodeJS.ProcessVersions
      }
      window: {
        minimize: () => void
        maximize: () => void
        close: () => void
      }
      media: {
        openFiles: (currentList: VideoItem[]) => Promise<VideoItem[]>
        getPathForFile: (file: File) => string
        importDroppedFiles: (filePaths: string[], currentList: VideoItem[]) => Promise<VideoItem[]>
        prepareFile: (id: string) => Promise<{ url: string }>
        prepareStream: (id: string, duration: number) => Promise<{ url: string }>
        removeTranscodeCaches: (ids: string[]) => Promise<void>
      }
      store: {
        getVideoList: () => Promise<VideoItem[]>
        setVideoList: (videoList: VideoItem[]) => Promise<void>
      }
    }
  }
}
