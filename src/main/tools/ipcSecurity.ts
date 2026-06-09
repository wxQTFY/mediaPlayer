import type { IpcMainEvent, IpcMainInvokeEvent } from 'electron'

export const assertTrustedIpcSender = (
  event: IpcMainEvent | IpcMainInvokeEvent
): void => {
  const frame = event.senderFrame
  if (!frame || frame !== event.sender.mainFrame) {
    throw new Error('Untrusted IPC sender')
  }

  const url = frame.url
  if (!url.startsWith('file://') && !url.startsWith('http://localhost:')) {
    throw new Error('Untrusted IPC origin')
  }
}
