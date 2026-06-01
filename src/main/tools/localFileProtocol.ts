import { protocol,net } from 'electron'
import { pathToFileURL } from 'url'

//定义协议名称

export const LOCAL_FILE_PROTOCOL = 'local-file'

export function registerLocalFileProtocol() {
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
export function registerLocalFileProtocolHandler() {
    // 移除协议头并处理路径
    // 注意：request.url 可能会被编码，需要 decode
    protocol.handle(LOCAL_FILE_PROTOCOL, (request) => {

        let  filePath = decodeURIComponent(request.url.replace(`${LOCAL_FILE_PROTOCOL}://`, '')) // 获取路径并解码
        // 2. 修复盘符缺失冒号的问题 (针对 c/Users -> C:/Users)
        // 正则含义：如果开头是字母且紧跟斜杠（忽略大小写），则在字母后补上冒号
        if(process.platform === 'win32' && /^[a-zA-Z]\/.*/.test(filePath)){
            filePath = filePath.replace(/^[a-zA-Z]\/(.*)/, (match, p1) => `${match[0]}:/${p1}`)
            
        }   
        try {
            // 转换为标准文件 URL 并使用 net.fetch 读取
             console.log('Electron 正在尝试读取文件:', filePath);
            return net.fetch(pathToFileURL(filePath).toString()) // 使用 net.fetch 返回文件内容
        } catch (error) {
            console.error('读取本地资源失败:', error)
            return new Response('file Not Found', { status: 404 }) // 返回 404 响应
        }
    })
}