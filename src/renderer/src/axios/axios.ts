import axios, { AxiosInstance } from 'axios';
// import { RequestConfig, ResponseData } from './types-axios';



const instance: AxiosInstance = axios.create({
    baseURL: import.meta.env.DEV ? '/api' : 'http://localhost:9999',
    timeout: 10000,
    headers: {
        'Content-Type': 'application/json'
    }
})

//请求拦截器，可以在这里添加token
instance.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token')
        if (token) {
            config.headers.Authorization = `Bearer ${token}`
        }
       return config
    },
    (error) => Promise.reject(error) 
)

//响应拦截器，可以在这里处理错误信息
instance.interceptors.response.use(
    (response) => {
      const { data } = response
      // 业务错误处理逻辑（如 code 不为 200）
      if (data.code !== 200 && data.code !== 0) {
        // 可根据 types.ts 里的 skipErrorHandler 决定是否弹窗
        return Promise.reject(data)
          
      }
        return data
    },
    // HTTP 状态码错误处理 (401, 403, 500 等)
    (error) => Promise.reject(error)
)

export default instance
