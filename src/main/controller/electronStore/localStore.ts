import { ipcMain } from "electron"
import { store } from "./db"
import { authorizeMediaList, isAuthorizedMediaItem } from '../../tools/mediaAccess'
import { assertTrustedIpcSender } from '../../tools/ipcSecurity'
import type { VideoItem } from '../../../common/types'

const isSafeNetworkMediaItem = (item: VideoItem): boolean => {
    if (!item.realPath || !item.videoPath) return false
    try {
      const realUrl = new URL(item.realPath)
      const playerUrl = new URL(item.videoPath)
      return ['http:', 'https:'].includes(realUrl.protocol) &&
        ['http:', 'https:'].includes(playerUrl.protocol)
    } catch {
      return false
    }
}

ipcMain.handle('store:get', async (event) => {
    assertTrustedIpcSender(event)
    // console.log('📬 [DEBUG] 收到读取请求:'); // 加这一行
    // console.log('store');
    const videoList = store.get('videoList')
    if (Array.isArray(videoList)) authorizeMediaList(videoList)
    return videoList
})


ipcMain.handle('store:set', async (_e,key, value) => {
    assertTrustedIpcSender(_e)
    if (key !== 'videoList' || !Array.isArray(value)) {
      throw new Error('Invalid store update')
    }
    const safeVideoList = value.filter(
      (item): item is VideoItem =>
        typeof item === 'object' &&
        item !== null &&
        (isAuthorizedMediaItem(item.id, item.realPath) || isSafeNetworkMediaItem(item))
    )
    store.set('videoList', safeVideoList)
})
