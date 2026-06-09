import path from 'path'

const MEDIA_ID_PATTERN = /^(?:[a-f0-9]{32}|[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12})$/i
const authorizedMedia = new Map<string, string>()

export const isValidMediaId = (id: string): boolean => MEDIA_ID_PATTERN.test(id)

export const authorizeMedia = (id: string, filePath: string): void => {
  if (!isValidMediaId(id) || !path.isAbsolute(filePath)) return
  authorizedMedia.set(id, path.normalize(filePath))
}

export const authorizeMediaList = (
  items: Array<{ id?: unknown; realPath?: unknown }>
): void => {
  for (const item of items) {
    if (typeof item.id === 'string' && typeof item.realPath === 'string') {
      authorizeMedia(item.id, item.realPath)
    }
  }
}

export const getAuthorizedMediaPath = (id: string): string | undefined => {
  if (!isValidMediaId(id)) return undefined
  return authorizedMedia.get(id)
}

export const isAuthorizedMediaPath = (filePath: string): boolean => {
  const normalizedPath = path.normalize(filePath)
  return [...authorizedMedia.values()].some((authorizedPath) => authorizedPath === normalizedPath)
}

export const isAuthorizedMediaItem = (id: unknown, filePath: unknown): boolean => {
  if (typeof id !== 'string' || typeof filePath !== 'string') return false
  return getAuthorizedMediaPath(id) === path.normalize(filePath)
}
