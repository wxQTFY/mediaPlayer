/**
 * 封装通用请求方法
 */
import instance from  './axios'
import type { RequestConfig } from './types-axios'

const post = async <T = unknown> (url:string,data:unknown,config?: RequestConfig): Promise<T> => {
    const res = await instance.post<unknown,T>(url,data,config)
    return res
}
const get = async <T = unknown> (url:string,params:unknown,config?: RequestConfig): Promise<T> => {
    // 强制打印看看
    console.log('Final Request URL:', instance.defaults.baseURL + url);
    const res = await instance.get<unknown,T>(url,{params,...config})
    return res
}

export default {
    post,
    get
}
