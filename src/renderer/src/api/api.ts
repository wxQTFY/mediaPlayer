import http from '@renderer/axios/http'

export const  transCodeUrl = (realPath: string,id: string,duration: number) => {
    return http.get('/video',{
        realPath,
        id,
        duration
    },)
}