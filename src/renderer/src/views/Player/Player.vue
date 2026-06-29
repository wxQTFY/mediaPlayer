<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import ArtPlayer from '@renderer/components/Artplayer/ArtPlayer.vue'

import { usePlayerStore } from '@renderer/store/playerStory'
import { ArrowLeftBold, Download, Loading } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import router from '@renderer/router/index'
import { downloadVideoUrl, probeVideoDownload } from '@renderer/api/api'

const playerStore = usePlayerStore()

const video = computed(() => playerStore.currentVideo) // 获取当前视频路径
const playStatus = computed(() => playerStore.playStatus) // 获取当前播放状态
const canDownload = ref(false)
const downloadFileName = ref<string>()
const isCheckingDownload = ref(false)
const isDownloading = ref(false)
// console.log('当前视频路径2222:', video.videoPath);

const isNetworkVideoUrl = (url?: string): url is string => /^https?:\/\//i.test(url ?? '')

watch(
  () => playerStore.currentVideo,
  async (newVideo) => {
    canDownload.value = false
    downloadFileName.value = undefined
    // 如果 newVideo 变成空了，或者里面的路径没了
    if (!newVideo) {
      // console.log('视频已失效，自动回首页')
      router.push('/')
      return
    }
    if (!isNetworkVideoUrl(newVideo.realPath)) {
      return
    }
    isCheckingDownload.value = true
    try {
      const result = await probeVideoDownload(newVideo.realPath)
      if (playerStore.currentVideo?.id !== newVideo.id) return
      canDownload.value = result.downloadable
      downloadFileName.value = result.fileName || newVideo.videoName
    } catch (error) {
      console.error('视频下载能力探测失败:', error)
    } finally {
      if (playerStore.currentVideo?.id === newVideo.id) {
        isCheckingDownload.value = false
      }
    }
  },
  { immediate: true }
)

// const videoName =
const goBack = (): void => {
  playerStore.clearPlay()
  router.push('/')
}

const handleDownload = async (): Promise<void> => {
  if (!video.value?.realPath || !canDownload.value || isDownloading.value) return
  isDownloading.value = true
  try {
    const result = await downloadVideoUrl(
      video.value.realPath,
      downloadFileName.value || video.value.videoName
    )
    if (!result.canceled) {
      ElMessage.success('视频已保存到本地')
    }
  } catch (error) {
    console.error('视频下载失败:', error)
    ElMessage.error('视频下载失败，请稍后重试')
  } finally {
    isDownloading.value = false
  }
}
</script>

<template>
  <div v-if="playStatus.isPlaying" class="player-page">
    <div class="player-topbar">
      <button class="player-icon-button" type="button" aria-label="返回" @click="goBack">
        <el-icon size="22"><ArrowLeftBold /></el-icon>
      </button>
      <span class="player-title">{{ video?.videoName }}</span>
    </div>
    <button
      v-if="canDownload"
      class="player-download-button"
      type="button"
      aria-label="下载视频"
      :disabled="isCheckingDownload || isDownloading"
      @click="handleDownload"
    >
      <el-icon size="20" :class="{ 'is-loading': isDownloading }">
        <Loading v-if="isDownloading" />
        <Download v-else />
      </el-icon>
    </button>
    <ArtPlayer
      v-if="video!.videoPath"
      :key="video!.videoPath"
      :url="video!.videoPath"
      @get-duration="(d) => playerStore.updateDuration(d, video!)"
      @playback-error="playerStore.fallbackToTranscode(video!)"
    />
  </div>
</template>

<style scoped lang="scss">
.player-page {
  position: relative;
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100%;
}

.player-topbar {
  position: absolute;
  top: 0;
  left: 0;
  z-index: 40;
  display: flex;
  align-items: center;
  width: 100%;
  height: 48px;
  gap: 10px;
  padding: 0 64px 0 12px;
  color: #fff;
  background: linear-gradient(180deg, rgb(0 0 0 / 62%), rgb(0 0 0 / 0%));
  pointer-events: none;
}

.player-icon-button,
.player-download-button {
  display: grid;
  place-items: center;
  width: 34px;
  height: 34px;
  border: 0;
  border-radius: 6px;
  color: #fff;
  background: rgb(0 0 0 / 42%);
  cursor: pointer;
  pointer-events: auto;
  transition:
    background-color 160ms ease,
    opacity 160ms ease;
}

.player-icon-button:hover,
.player-download-button:hover {
  background: rgb(0 0 0 / 64%);
}

.player-download-button:disabled {
  cursor: default;
  opacity: 0.72;
}

.player-title {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 14px;
  line-height: 20px;
  text-shadow: 0 1px 2px rgb(0 0 0 / 70%);
}

.player-download-button {
  position: absolute;
  top: 8px;
  right: 12px;
  z-index: 50;
}

.is-loading {
  animation: player-download-spin 900ms linear infinite;
}

@keyframes player-download-spin {
  to {
    transform: rotate(360deg);
  }
}
</style>
