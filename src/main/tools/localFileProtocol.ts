import { protocol,net } from 'electron'
import path from 'path'
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
    protocol.handle(LOCAL_FILE_PROTOCOL, (request) => {
        try {
            if (request.method !== 'GET') {
                return new Response('Method Not Allowed', { status: 405 })
            }
            const url = new URL(request.url)
            if (url.search || url.hash) return new Response('Bad Request', { status: 400 })

            const decodedPath = decodeURIComponent(url.pathname)
            let filePath: string
            if (process.platform === 'win32') {
                // 兼容旧格式 local-file://c/path 和标准格式 local-file:///C:/path。
                const windowsPath = /^[a-zA-Z]$/.test(url.host)
                    ? `${url.host}:${decodedPath}`
                    : decodedPath.replace(/^\/(?=[a-zA-Z]:\/)/, '')
                filePath = path.win32.normalize(windowsPath)
            } else {
                if (url.host) return new Response('Bad Request', { status: 400 })
                filePath = path.posix.normalize(decodedPath)
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
