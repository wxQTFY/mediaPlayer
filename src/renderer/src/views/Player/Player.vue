<script setup lang="ts">
  import { ref,computed,watch } from 'vue'
  import ArtPlayer from '@renderer/components/Artplayer/ArtPlayer.vue'

  import { usePlayerStore } from '@renderer/store/playerStory'
  import { ArrowLeftBold } from '@element-plus/icons-vue'
  import router  from '@renderer/router/index'

  const playerStore = usePlayerStore()

  const video = computed(() => playerStore.currentVideo) // 获取当前视频路径
  const playStatus = computed(() => playerStore.playStatus) // 获取当前播放状态
  // console.log('当前视频路径2222:', video.videoPath);
  
  watch(
    () => playerStore.currentVideo,
    (newVideo) => {
    // 如果 newVideo 变成空了，或者里面的路径没了
    if (!newVideo) {
      // console.log('视频已失效，自动回首页')
      router.push('/')
    }
  }
  )

  // const videoName = 
  const goBack = () => {
    playerStore.clearPlay()
    router.push('/')
  }


</script>

<template>
  <div class="h-full w-full flex flex-col gap-y-3 relative"  v-if="playStatus.isPlaying">
    <div class="h-10 absolute top-0 left-0 w-full bg-white/0 z-40 flex items-center gap-x-3 px-3">
      <el-icon size="25" @click="goBack"><ArrowLeftBold /></el-icon>
      <span class="text-xm">{{video?.videoName}}</span>
    </div>
    <ArtPlayer v-if ="video!.videoPath" :url="video!.videoPath" :key="video!.videoPath" @get-duration="(d)=>playerStore.updateDuration(d,video!)" />
  </div>
</template> 

<style lang="scss">
 
</style>
