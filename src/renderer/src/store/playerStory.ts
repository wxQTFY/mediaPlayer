import { defineStore } from 'pinia';
// import {PlayerConf} from '@renderer/config/playerConf.json';
import { toRaw } from 'vue';
import { importDroppedFiles, localStore, openLocalFile } from '@renderer/api/media';
import router  from '@renderer/router/index'
import { type VideoItem } from '@common/types';
import { localMediaUrl, removeTranscodeCaches, transCodeUrl } from '@renderer/api/api';

export const usePlayerStore = defineStore('player', {
  state: () => ({
    // 在这里定义当前播放视频信息
    currentVideo: null as VideoItem | null, // 当前播放的视频信息
    playStatus:{
      isPlaying: false, // 播放状态
      currentTime: 0, // 当前播放时间
      duration: 0, // 视频总时长
      // volume: PlayerConf.volume, // 音量 
    },
    //默认排序方向：desc（倒序）
    currentSortDir: 'desc' as 'asc' | 'desc', // 当前排序字段
    // 从本地存储中获取播放列表
    videoList :[] as VideoItem[] // 播放列表，存储视频路径
  }),
  getters: {
    /**
     * 对外暴露的排序列表
     * 不改变 state.videoList 的原始顺序
     */
    sortedVideoList(state) {
      // 1. 使用展开运算符 [...] 拷贝一份新数组，避免原地修改(In-place mutation)
      const listCopy = [...state.videoList];
      // 2. 根据当前排序方向进行排序
      return listCopy.sort((a, b) => {
        // --- 逻辑 A：新视频强制置顶 ---
        if(a.isNew&&!b.isNew) return -1; // a 是新添加的视频，排在前面
        if(!a.isNew&&b.isNew) return 1; // b 是新添加的视频，排在前面

        // --- 逻辑 B：如果两者都是旧视频，或都是新视频，按时间规则排序 ---
        if (state.currentSortDir === 'desc') {
          return b.date - a.date;
        } else {
          return a.date - b.date;
        }
      });
    }
  },
  actions: {
    async initStore() {
       // 初始化播放列表
       this.videoList = (await localStore('get','videoList')) ?? []
      //  this.videoList = await localStore()
    },


    // 处理打开文件的逻辑
    async handleLocalFile() {
      const items: VideoItem[] =  await openLocalFile(toRaw(this.videoList)) 
      // console.log('返回路径',items)
      if(items && items.length > 0 ){
        //添加视频到播放列表，并去重
        this.addToVideoList(items)
        //默认播放第一个视频、
        this.playVideo(items[0])
        if(router.currentRoute.value.path !== '/player'){
          router.push('/player')
        }
      }
      // if(path && path.length > 0 ){
      //   await this.playAndAddToVideoList(path,'local')
      //   if(router.currentRoute.value.path !== '/player'){
      //     router.push('/player')
      //   }
      // }
    },

    async handleDroppedFiles(files: File[]) {
      try {
        const items = await importDroppedFiles(files, toRaw(this.videoList))
        if (items.length === 0) return
        this.addToVideoList(items)
        const firstPlayableItem = items.find(item => item.success)
        if (!firstPlayableItem) return
        await this.playVideo(firstPlayableItem)
        if (router.currentRoute.value.path !== '/player') {
          await router.push('/player')
        }
      } catch (error) {
        console.error('拖拽导入视频失败:', error)
      }
    },
//处理打开URL的逻辑
    async handleOpenUrl(url: string) {
      if (url) {
        const videoName = new URL(url).pathname.split('/').pop() || '网络视频';
        // const duration = await input.computeDuration(); 
        const item: VideoItem = {
          id:crypto.randomUUID(),
          date: Date.now(), // 添加一个日期字段
          videoName,
          videoPath: url,
          realPath: url,
          success: true,
          playback:{
            strategy:'direct'
          },
          meta:{
            duration:0,
          },
          isNew: true // 标记为新添加的视频
        }
        console.log('播放视频:', item);
        
         this.addToVideoList([item])
        //默认播放第一个视频、
        this.playVideo(item)
        if(router.currentRoute.value.path !== '/player'){
          router.push('/player')
        }
      }
    },

    /**
     * 内部私有工具：将路径解析为标准的视频项对象
     */
    // parsePathToVideoItem(path: string | string[], type: 'local' | 'url'): VideoItem[] {
    //   const pathArray = Array.isArray(path) ? path : [path];
    //   console.log('播放视频:', path);
    //   return pathArray.map(path => {
    //     let name:string; // 视频名称
    //     if(type === 'local'){
    //       // 处理本地路径，兼容不同操作系统的路径分隔符
    //       name = path.split('/').pop() || '未知视频'
    //       // finalPath = type === 'local' ? `local-file://${path}` : path; // 本地路径需要加协议头
    //       // console.log('播放视频:', finalPath);
    //       // return { videoName, videoPath: finalPath, type}
    //     }else{
    //       try {
    //         name =new URL(path).pathname.split('/').pop() || '网络视频'
    //       } catch {
    //         name ='无效链接'
    //       }
    //     } 
    //     return{ 
    //       id:crypto.randomUUID(),
    //       date: Date.now(), // 添加一个日期字段
    //       videoName: name,
    //       videoPath: path, 
    //       type,
    //       isNew: true // 标记为新添加的视频
    //     }
    //   })
    // },
    //添加视频到列表,去重并置顶
    
    addToVideoList(items:VideoItem[]) {
      // const newItems = this.parsePathToVideoItem(path,type)
      // console.log('添加视频:', items);
      //1. 使用重新探测成功的结果覆盖同路径的历史失败条目
      let hasUpdatedItem = false
      items.forEach(item => {
        const failedItemIndex = this.videoList.findIndex(
          video => video.realPath === item.realPath && !video.success
        )
        if (failedItemIndex !== -1 && item.success) {
          this.videoList.splice(failedItemIndex, 1, { ...item, isNew: true })
          hasUpdatedItem = true
        }
      })
      //2. 去重并添加到列表顶部
      const existingPaths = new Set(this.videoList.map(v => v.realPath))
      const uniqueNewItems = items
        .filter(v => !existingPaths.has(v.realPath))
        .map(v => ({
           ...v, 
           isNew: true,
          }))
      if (uniqueNewItems.length > 0) {
        this.videoList.unshift(...uniqueNewItems)
      }
      if (uniqueNewItems.length > 0 || hasUpdatedItem) {
        // console.log('更新播放列表:', this.videoList);
        this.updateToDdisk()
      }
      // return newItems;
    },

    //播放视频
    async playVideo(video: VideoItem) { 
      // 1. 深度拷贝，避免直接修改列表中的原始对象
      if(!video.success ){
        console.error('无法播放视频，视频状态不正确');
        return
      }
      const videoToPlay = JSON.parse(JSON.stringify(video)) as VideoItem;
      const { strategy } = videoToPlay.playback!

      // --- 核心优化：分流逻辑 ---
      // 1. 如果是原生支持的 MP4/WebM，尝试用 Mediabunny 预处理（如提取关键帧或检查坏帧）
      if(strategy === 'stream'){
        //后端请求
        const res = await transCodeUrl(videoToPlay.id,videoToPlay.meta!.duration)
        const url = res.url
        console.log('转码后的视频地址',url)
        
        videoToPlay.videoPath = url
      } else if (/\.flv$/i.test(videoToPlay.realPath ?? '')) {
        // flv.js 使用 fetch 加载资源，必须通过受控的回环 HTTP 地址读取本地文件。
        const res = await localMediaUrl(videoToPlay.id)
        videoToPlay.videoPath = res.url
      }
      //2. 更新当前播放视频

      this.currentVideo = videoToPlay;
      // console.log('准备播放视频:', this.currentVideo);
      // 3. 更新播放状态
      this.playStatus.isPlaying = true;
      this.playStatus.currentTime = 0;
       
    },

    // 在这里定义你的方法
    // async playAndAddToVideoList(item: VideoItem[],type: 'local' | 'url' = 'local') {

    //   //获取当菜添加的第一个视频进行播放
    //   const items = this.addToVideoList(path,type);
    //   if(items.length > 0){
    //     // console.log('准备播放视频111:', items[0]);
    //     this.playVideo(items[0])
    //   }
    // },

    //更新本地存储
     updateToDdisk(){
      const dataToSave = JSON.parse(JSON.stringify(this.videoList))
      // 打印一下，确认数据里确实包含新的 duration
  console.log('写入本地的数据快照:', dataToSave);
      localStore('set','videoList',dataToSave)
     },
    //切换播放列表中视频
    switchVideoInList(id: string){ 
      const targetVideo = this.videoList.find(v => v.id === id)
      if(targetVideo){
        this.playVideo(targetVideo)
      }else{
        console.log('视频已不存在');
      }
    },  
    clearPlay() {
      this.currentVideo = null;
      this.playStatus.isPlaying = false;
      this.playStatus.currentTime = 0
    },

    // 从播放列表中删除指定视频（根据ID）
    async removeVideoById(id: string) {
      const index = this.videoList.findIndex(v => v.id === id)
        //如果删除的视频正在播放，先清空当前播放状态
      if(index !== -1){
        try {
          await removeTranscodeCaches([id])
        } catch (error) {
          console.error('删除转码缓存失败:', error)
        }
        // console.log('删除视频id:', id);
        // console.log('当前播放视频id:', this.currentVideo.currentPlayId);
        if(this.currentVideo?.id === id){
          this.clearPlay()
          // console.log('qingkong',this.currentVideo);
        }
        
        this.videoList.splice(index, 1)
        this.updateToDdisk()
      }
    },
    // 清空播放列表
    async deleteAllVideos() {
      const ids = this.videoList.map(video => video.id)
      try {
        await removeTranscodeCaches(ids)
      } catch (error) {
        console.error('清空转码缓存失败:', error)
      }
      this.videoList = []
      this.clearPlay()
      this.updateToDdisk()
    },
    /**
     * 排序切换逻辑：不传参数，自动根据当前状态反转
     */
    toggleSortDate(){
      //清除所有视频的新添加标记
      this.videoList.forEach(v => v.isNew = false)
      //先判断并反转排序方向
      // console.log('当前排序方向:', this.currentSortDir);
      this.currentSortDir = this.currentSortDir === 'desc' ? 'asc' : 'desc'
      //根据当前排序方向进行排序
    },
    //更新视频时长
    updateDuration (duration: number, videoItem: VideoItem) {
      console.log('视频时长:', duration);
      // console.log('视频id:', videoId);
      const item = this.videoList.find(v => v.id === videoItem.id);
      if(item) {
        item.meta!.duration = duration;
        console.log('更新视频时长:', videoItem.meta?.duration);
        this.updateToDdisk()
      }
    }
  }
})
