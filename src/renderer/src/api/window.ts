
export const minusWindow = ():void => {
    window.electron.ipcRenderer.send('window-minimize')
}

export const maxWindow = ():void => {
    window.electron.ipcRenderer.send('window-maximize')
}
export const closeWindow = ():void => {
    window.electron.ipcRenderer.send('window-close')
}