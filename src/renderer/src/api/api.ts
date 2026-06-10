export const transCodeUrl = (id: string, duration: number): Promise<{ url: string }> => {
    return window.api.media.prepareStream(id, duration)
}

export const localMediaUrl = (id: string): Promise<{ url: string }> => {
    return window.api.media.prepareFile(id)
}

export const removeTranscodeCaches = (ids: string[]): Promise<void> => {
    return window.api.media.removeTranscodeCaches(ids)
}
