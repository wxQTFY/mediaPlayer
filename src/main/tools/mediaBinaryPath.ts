export const resolvePackagedBinaryPath = (binaryPath: string): string =>
  binaryPath.replace(/app\.asar([\\/])/, 'app.asar.unpacked$1')
