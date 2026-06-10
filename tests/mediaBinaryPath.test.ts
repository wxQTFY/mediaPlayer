import { describe, expect, it } from 'vitest'
import { resolvePackagedBinaryPath } from '../src/main/tools/mediaBinaryPath'

describe('packaged media binary path', () => {
  it('uses the unpacked executable path in packaged apps', () => {
    expect(resolvePackagedBinaryPath('/app/resources/app.asar/node_modules/ffmpeg-static/ffmpeg'))
      .toBe('/app/resources/app.asar.unpacked/node_modules/ffmpeg-static/ffmpeg')
    expect(resolvePackagedBinaryPath('C:\\app\\resources\\app.asar\\node_modules\\ffmpeg-static\\ffmpeg.exe'))
      .toBe('C:\\app\\resources\\app.asar.unpacked\\node_modules\\ffmpeg-static\\ffmpeg.exe')
  })

  it('keeps development paths unchanged', () => {
    expect(resolvePackagedBinaryPath('/project/node_modules/ffmpeg-static/ffmpeg'))
      .toBe('/project/node_modules/ffmpeg-static/ffmpeg')
  })
})
