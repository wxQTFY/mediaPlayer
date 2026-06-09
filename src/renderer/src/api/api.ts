export const transCodeUrl = (id: string, duration: number): Promise<{ url: string }> => {
    return window.api.media.prepareStream(id, duration)
}
