/**
 * 封装通用请求方法
 */
import instance from  './axios'
import { RequestConfig } from './types-axios'

const post = async <T = any> (url:string,data:any,config?: RequestConfig)=>{
    const res = await instance.post <any,T> (url,data,config)
    return res
}
const get = async <T = any> (url:string,params:any,config?: RequestConfig)=>{
    // 强制打印看看
    console.log('Final Request URL:', instance.defaults.baseURL + url);
    const res = await instance.get <any,T> (url,{params,...config})
    return res
}

export default {
    post,
    get
}