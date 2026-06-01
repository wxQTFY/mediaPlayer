<script setup lang="ts">
  import { inject,computed } from 'vue'
  import { ArrowRightBold, ArrowLeftBold,Plus,Close,Sort, Delete} from '@element-plus/icons-vue'
  import thumbnail from '@renderer/assets/thumbnail.png'
  import { ElText } from 'element-plus'

  import { usePlayerStore } from '@renderer/store/playerStory'
  import router  from '@renderer/router/index'
  import { formatDuration } from '@renderer/utils/format'

  const playerStore = usePlayerStore()
  

  const list = computed(() => playerStore.sortedVideoList) // 获取视频列表

  const slider = inject<any>('sidebarContext')
  const handToSliderBar = () => {
    console.log('点击了侧边栏切换按钮，当前状态:', slider.isCollapse.value);
    slider.toggleCollapse()
  }

  //删除单个视频
  const handleDeleteItem = (id: string) => {
    playerStore.removeVideoById(id)
  }

  //切换视频
  const handleSwitchVideo = (id: string) => {
    // console.log('双击了视频项，id:', id);
    playerStore.switchVideoInList(id)
    if (router.currentRoute.value.path !== '/player') {
      router.push('/player')
    }
  }
//删除全部视频
  const handleDeleteAllVideos = () => {
    playerStore.deleteAllVideos()
  }

</script>
 
<template>
    <div class="flex" >
        <div class="w-full flex flex-col bg-white">
            <div class="videoList-header h-8 flex flex-row items-center justify-between px-2 bg-black/80">
                <div class="videoList-header-title text-white text-xs">共{{ list.length }}个视频</div>
                <div class="flex justify-end gap-x-3 ">
                    <el-icon @click="playerStore.handleLocalFile"><Plus /></el-icon>
                    <el-icon @click="handleDeleteAllVideos"><Delete /></el-icon>
                    <el-icon @click="playerStore.toggleSortDate"><Sort /></el-icon>
                    <!-- <el-dropdown placement="bottom-end" effect="dark">
                        <el-icon size="16"><Sort /></el-icon>
                        <template #dropdown>
                            <el-dropdown-menu>
                            <el-dropdown-item>添加为网络设备</el-dropdown-item>
                            <el-dropdown-item>打开摄像头</el-dropdown-item>
                            <el-dropdown-item>进入otg模式</el-dropdown-item>
                            <el-dropdown-item>命令行</el-dropdown-item>
                            <el-dropdown-item>设备设置</el-dropdown-item>
                            </el-dropdown-menu>
                        </template>
                    </el-dropdown> -->
                </div>
            </div> 
            <div class="videoList " v-for="l in list " :key="l.id" > 
                <el-card   class="group" 
                :body-class="['flex flex-row items-center !p-2 justify-between bg-black hover:bg-gray-500/90',
                 playerStore.currentVideo?.id === l.id ? 'bg-gray-500/90' : 'bg-black'
                ]" 
                style="border: none;border-radius: 0;" 
                @dblclick="handleSwitchVideo(l.id)"
                > 
                    <template #default > 
                        <div class="flex items-center min-w-0 relative">
                            <el-image :src="thumbnail" class="flex-none h-12 w-18 rounded-sm"></el-image>
                            <el-text class="mx-1 absolute bottom-0 left-0 text-white">{{formatDuration(l.meta?.duration)}}</el-text>
                            <div class="flex min-w-0 px-3">  
                                <span class="text-white text-sm  line-clamp-2 break-all">
                                {{l.videoName}}
                                </span>
                            </div>
                        </div>
                        <el-icon color="white" size="20" class="flex-none opacity-0 group-hover:opacity-100 transition-all" @click="handleDeleteItem(l.id)"><Close /></el-icon>
                    </template>   
                </el-card>
            </div>
        </div>
        <div>
            <button  class="absolute  top-1/2 -translate-y-1/2 z-[60]  h-20 w-10 bg-black/20 rounded-r-xl " @click="handToSliderBar">
                <el-icon v-if=slider.isCollapse.value><ArrowLeftBold /></el-icon>
                <el-icon v-else><ArrowRightBold /></el-icon>
            </button>
        </div> 
    </div>  
</template>

<style lang="scss"> 


</style>
