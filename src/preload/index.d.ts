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
        prepareFile: (id: string) => Promise<{ url: string }>
        prepareStream: (id: string, duration: number) => Promise<{ url: string }>
      }
      store: {
        getVideoList: () => Promise<VideoItem[]>
        setVideoList: (videoList: VideoItem[]) => Promise<void>
      }
    }
  }
}
