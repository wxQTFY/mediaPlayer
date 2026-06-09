import { protocol,net } from 'electron'
import { pathToFileURL } from 'url'
import { isAuthorizedMediaPath } from './mediaAccess'

//定义协议名称

export const LOCAL_FILE_PROTOCOL = 'local-file'

export function registerLocalFileProtocol(): void {
    protocol.registerSchemesAsPrivileged([
        { 
            scheme: LOCAL_FILE_PROTOCOL,
            privileges: { 
                secure: true, 
                standard: true, 
                supportFetchAPI: true,
                stream: true
            } 
        },
    ])
}

/**
 * 2. 注册协议处理器 (在 app ready 之后调用)
 */
export function registerLocalFileProtocolHandler(): void {
    // 移除协议头并处理路径
    // 注意：request.url 可能会被编码，需要 decode
    protocol.handle(LOCAL_FILE_PROTOCOL, (request) => {
        try {
            if (request.method !== 'GET') {
                return new Response('Method Not Allowed', { status: 405 })
            }
            const url = new URL(request.url)
            let filePath = decodeURIComponent(`${url.host}${url.pathname}`)
            if(process.platform !== 'win32') filePath = `/${filePath.replace(/^\/+/, '')}`
            if(process.platform === 'win32' && /^[a-zA-Z]\/.*/.test(filePath)){
                filePath = filePath.replace(/^[a-zA-Z]\/(.*)/, (match, p1) => `${match[0]}:/${p1}`)
            }
            if (!isAuthorizedMediaPath(filePath)) {
                return new Response('Forbidden', { status: 403 })
            }
            // 转换为标准文件 URL 并使用 net.fetch 读取
             console.log('Electron 正在尝试读取文件:', filePath);
            return net.fetch(pathToFileURL(filePath).toString()) // 使用 net.fetch 返回文件内容
        } catch (error) {
            console.error('读取本地资源失败:', error)
            return new Response('file Not Found', { status: 404 }) // 返回 404 响应
        }
    })
}
