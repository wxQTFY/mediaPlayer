import './assets/main.css'
// 引入你的自定义全局样式
import './assets/style.css'

import { createApp } from 'vue'
import App from './App.vue'
import ElementPlus  from 'element-plus'

import { createPinia } from 'pinia'

import router from '@renderer/router/index'

createApp(App).use(ElementPlus,{ size: 'small' ,zIndex: 3000}).use(createPinia()).use(router).mount('#app')
