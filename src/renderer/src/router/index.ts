import { createRouter, createWebHashHistory } from 'vue-router'

const routers = [
    {
        path: '/',
        name: 'playerMain',
        component: () => import('@renderer/views/PlayerMain/PlayerMain.vue')
    },
    {
        path: '/player',
        name: 'player ',
        component: () => import('@renderer/views/Player/Player.vue')
    }
] 

const router = createRouter({ 
    history: createWebHashHistory(),
    routes: routers
})

export default router