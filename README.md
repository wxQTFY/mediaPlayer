# Sanjin MediaPlayer

基于 Electron、electron-vite、Vue 3 和 TypeScript 开发的桌面影音播放器。

项目主要面向 Windows 桌面环境，支持本地视频、网络视频、多种流媒体格式以及 FFmpeg 自动转码播放。无法直接播放的视频会转码为 HLS，并通过本机临时媒体服务交付给播放器。

## 功能特性

### 媒体播放

- 支持选择一个或多个本地视频文件。
- 支持输入 `http://` 或 `https://` 网络视频地址。
- 使用 ArtPlayer 提供播放控制、倍速、画中画、截图、全屏和快捷键等功能。
- 支持 HLS、DASH 和 FLV 播放库按需加载。
- 自动保存播放列表，重新启动应用后恢复。
- 支持播放列表去重、删除、清空、排序和视频切换。

### 支持格式

文件选择器当前允许以下格式：

```text
MP4、MKV、AVI、FLV、MOV、WMV、RMVB、MPD、M3U8、M4V、WebM
```

当前播放策略：

- `AVI、MOV、WMV、RMVB、M4V`：通过 FFmpeg 转码为 HLS 后播放。
- 其他允许格式：优先尝试直接播放。
- HLS、DASH、FLV：分别使用 `hls.js`、`dash.js`、`flv.js` 播放。
- GPU 编码器不可用或启动失败时，自动回退到 CPU `libx264`。

> 文件扩展名不完全代表内部编码格式。部分使用特殊视频或音频编码的 MP4、MKV 文件仍可能无法直接播放。

### 桌面能力

- 自定义无边框窗口。
- 支持最小化、最大化、隐藏窗口。
- 支持系统托盘，关闭窗口后可从托盘重新显示。
- 使用 `electron-store` 持久化播放列表。
- 使用 FFprobe 读取视频编码、时长、分辨率和文件大小。

### 安全设计

- Electron 渲染进程启用 `contextIsolation` 和 `sandbox`。
- 渲染进程不直接使用 Node.js API，也不能调用任意 IPC 频道。
- Preload 只暴露窗口控制、媒体选择、转码准备和播放列表存储等明确业务 API。
- 本地文件只有经过系统文件选择框授权后才能读取或转码。
- 转码启动通过受控 IPC 完成，不提供公开 HTTP 转码接口。
- HLS 服务仅监听 `127.0.0.1` 的随机空闲端口。
- HLS 服务只允许读取已授权媒体的 `index.m3u8` 和 `seg_<number>.ts` 文件。
- 外部链接仅允许使用 `http:` 和 `https:` 协议。

## 技术栈

| 分类 | 技术 |
|---|---|
| 桌面框架 | Electron 39、electron-vite 5、electron-builder |
| 前端框架 | Vue 3、TypeScript、Vue Router、Pinia |
| UI 与样式 | Element Plus、Tailwind CSS、Sass、Iconify |
| 播放器 | ArtPlayer、hls.js、dash.js、flv.js |
| 媒体处理 | FFmpeg、FFprobe、fluent-ffmpeg |
| 本地服务 | Express |
| 数据存储 | electron-store |
| 代码质量 | ESLint、Prettier、vue-tsc |
| 测试 | Vitest |

## 项目结构

```text
mediaPlayer/
├─ build/                         # 应用图标、macOS 权限等构建资源
├─ resources/                     # 打包时使用的应用资源
├─ src/
│  ├─ common/
│  │  └─ types.ts                 # 主进程与渲染进程共享类型
│  ├─ main/
│  │  ├─ controller/
│  │  │  ├─ electronStore/        # 播放列表持久化
│  │  │  ├─ fileDialog/           # 本地视频选择与媒体探测
│  │  │  ├─ server/               # 本机 HLS 文件服务
│  │  │  ├─ transCodeManage/      # 转码任务与生命周期管理
│  │  │  ├─ Tray/                 # 系统托盘
│  │  │  └─ Window/               # 桌面窗口控制
│  │  ├─ tools/
│  │  │  ├─ encoderManage.ts      # GPU/CPU 编码器选择
│  │  │  ├─ ffmpeg.ts             # FFprobe 媒体信息读取
│  │  │  ├─ ipcSecurity.ts        # IPC 发送来源校验
│  │  │  ├─ localFileProtocol.ts  # 受控本地文件协议
│  │  │  └─ mediaAccess.ts        # 媒体路径授权白名单
│  │  └─ index.ts                 # Electron 主进程入口
│  ├─ preload/
│  │  ├─ index.ts                 # 对渲染层暴露的业务 API
│  │  └─ index.d.ts               # Preload API 类型定义
│  └─ renderer/
│     └─ src/
│        ├─ api/                   # 窗口、媒体和转码调用封装
│        ├─ components/            # 播放器与布局组件
│        ├─ store/                 # Pinia 播放状态与列表
│        ├─ views/                 # 首页与播放页面
│        └─ main.ts                # Vue 应用入口
├─ tests/                          # Vitest 测试
├─ electron.vite.config.ts         # electron-vite 配置
├─ electron-builder.yml            # 安装包构建配置
├─ package.json
└─ README.md
```

## Windows 开发环境

### 环境要求

- Windows 10 或 Windows 11
- Node.js 22 LTS
- npm 10 或更高版本
- Visual Studio Code

推荐 VS Code 扩展：

- ESLint
- Prettier
- Vue - Official / Volar

### 安装依赖

在 Windows PowerShell、CMD 或 VS Code Terminal 中执行：

```bash
npm install
```

安装完成后，检查 FFmpeg 与 FFprobe 是否存在：

```powershell
Test-Path node_modules\ffmpeg-static\ffmpeg.exe
Test-Path node_modules\ffprobe-static\bin\win32\x64\ffprobe.exe
```

两个命令都应返回 `True`。

如果 FFmpeg 文件缺失，可执行：

```bash
npm rebuild ffmpeg-static
```

### 启动开发环境

```bash
npm run dev
```

开发脚本会先执行：

```text
chcp 65001
```

用于将 Windows 控制台切换为 UTF-8 编码，然后通过 `electron-vite dev` 启动主进程、Preload 和 Vue 渲染进程，并支持热更新。

### 预览构建结果

```bash
npm run build
npm run start
```

## 常用命令

| 命令 | 说明 |
|---|---|
| `npm run dev` | 在 Windows 启动 electron-vite 开发环境 |
| `npm run start` | 使用 electron-vite 预览构建结果 |
| `npm run typecheck` | 检查主进程、Preload 和 Vue 类型 |
| `npm run lint` | 执行 ESLint 与 Prettier 规则检查 |
| `npm run test` | 执行 Vitest 自动化测试 |
| `npm run format` | 使用 Prettier 格式化项目 |
| `npm run build` | 类型检查并生成生产构建产物 |
| `npm run build:unpack` | 生成未安装的应用目录，用于打包前验证 |
| `npm run build:win` | 构建 Windows NSIS 安装包 |
| `npm run build:mac` | 构建 macOS 安装包 |
| `npm run build:linux` | 构建 Linux AppImage、Snap 和 Deb |

## 构建与发布

### 构建 Windows 安装包

```bash
npm run build:win
```

构建产物默认生成到：

```text
dist/
```

Windows 安装包文件名格式：

```text
sanjin-mediaplayer-1.0.0-setup.exe
```

### 构建未打包目录

正式构建安装包前，建议先执行：

```bash
npm run build:unpack
```

检查生成目录中是否包含：

- Electron 主程序
- `resources/app.asar`
- `resources/app.asar.unpacked/node_modules/ffmpeg-static/ffmpeg.exe`
- `resources/app.asar.unpacked/node_modules/ffprobe-static/bin/win32/x64/ffprobe.exe`
- `resources/app.asar.unpacked/resources/icon.png`

### 发布前检查

```bash
npm run typecheck
npm run lint -- --quiet
npm run test
npm run build
npm audit --omit=dev
```

然后在 Windows 安装包中人工验证：

1. 打开 MP4、WebM 等可直接播放视频。
2. 打开 AVI、WMV、RMVB 等需要转码的视频。
3. 验证 GPU 编码和 CPU 回退。
4. 验证 HLS、DASH、FLV 网络地址。
5. 验证列表持久化、删除、排序和切换。
6. 验证窗口最小化、最大化、关闭和托盘恢复。

## 播放与转码流程

### 直接播放

```text
用户选择本地视频
→ 主进程使用 FFprobe 获取元数据
→ 主进程登记媒体访问权限
→ 生成 local-file:// 受控地址
→ ArtPlayer 直接播放
```

### 转码播放

```text
用户选择需要转码的视频
→ 主进程登记媒体访问权限
→ 渲染层通过 Preload 请求准备媒体流
→ 主进程选择可用 GPU 编码器
→ GPU 失败时回退 libx264
→ FFmpeg 生成 HLS 切片
→ 本机随机端口提供受控 HLS 文件
→ ArtPlayer 使用 hls.js 播放
```

转码缓存位于系统临时目录：

```text
<系统临时目录>\sanjin-mediaplayer\temp_hls
```

应用切换转码视频、长时间无请求或退出时，会停止相关 FFmpeg 任务。

## Preload API

渲染进程只能使用以下业务 API：

```ts
window.api.app.versions

window.api.window.minimize()
window.api.window.maximize()
window.api.window.close()

window.api.media.openFiles(videoList)
window.api.media.prepareStream(id, duration)

window.api.store.getVideoList()
window.api.store.setVideoList(videoList)
```

不要重新向渲染进程暴露完整 `ipcRenderer`、Node.js API 或任意文件系统能力。

## 测试

执行测试：

```bash
npm run test
```

当前自动化测试重点验证媒体访问授权：

- 拒绝畸形媒体 ID 和目录穿越输入。
- 未授权路径不能访问。
- 只有正确的 ID 与绝对路径组合才能获得授权。
- 无效 ID 和相对路径授权请求会被忽略。

## 常见问题

### `npm run dev` 提示找不到 `chcp`

项目开发脚本面向 Windows，`chcp` 是 Windows CMD 命令。请在 Windows PowerShell、CMD 或 VS Code Terminal 中运行。

### 转码视频无法播放

依次检查：

1. `node_modules\ffmpeg-static\ffmpeg.exe` 是否存在。
2. `node_modules\ffprobe-static\bin\win32\x64\ffprobe.exe` 是否存在。
3. 控制台中是否出现 GPU 编码器启动失败信息。
4. CPU `libx264` 回退是否成功。
5. 系统临时目录是否具有写权限。

### 直接播放文件失败

文件扩展名可能受支持，但内部视频或音频编码不受 Chromium 支持。可将对应扩展名加入：

```ts
TRANSCODE_EXTS
```

文件位置：

```text
src/main/controller/fileDialog/fileDialogController.ts
```

### Windows 打包后 FFmpeg 缺失

先重新安装或重建 FFmpeg：

```bash
npm rebuild ffmpeg-static
npm run build:unpack
```

然后检查：

```text
dist\win-unpacked\resources\app.asar.unpacked\node_modules\ffmpeg-static\ffmpeg.exe
```

### 控制台出现 npm 镜像配置警告

当前 `.npmrc` 使用 Electron 和 electron-builder 国内镜像。新版 npm 可能提示部分项目配置未来会停止支持，但目前不影响开发和构建。

## 已知限制

- 当前主要开发和验收平台为 Windows。
- 播放策略仍主要依据文件扩展名判断，后续可根据 FFprobe 编码信息进一步细化。
- 转码缓存当前按媒体 ID 复用，后续可增加完整性校验和自动清理策略。
- `fluent-ffmpeg` 上游已停止维护，后续建议评估替代方案。
- 自动更新地址、应用 ID、作者和签名配置在正式发布前需要替换。
- macOS 签名、公证以及 Linux 各发行版兼容性需要在对应系统验证。

## 安全注意事项

- 不要将 `nodeIntegration` 设置为 `true`。
- 不要关闭 `contextIsolation` 或 `sandbox`。
- 不要向渲染层暴露通用 IPC、文件系统或 Shell 能力。
- 不要允许渲染层直接提供任意物理路径进行读取或转码。
- 不要把 HLS 服务监听到局域网地址。
- 升级 Electron、Vite 或媒体依赖后，应重新执行测试、构建和依赖审计。

## 相关文档

- [优化改动对照文档](./优化改动对照文档.md)
- [原项目分析报告](./原项目分析报告.md)

## License

当前项目尚未声明开源许可证。正式发布或开源前，请补充合适的 `LICENSE` 文件。
