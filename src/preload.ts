import { contextBridge, ipcRenderer } from "electron";
contextBridge.exposeInMainWorld("electronBridge", {
  openFile: () => ipcRenderer.invoke("dialog:openFile"),
  startServer: (config: any) => ipcRenderer.invoke("server:start", config),
  stopServer: () => ipcRenderer.invoke("server:stop"),
  onStdout: (cb: Function) => ipcRenderer.on("server:stdout", (_, data) => cb(data)),
  onStderr: (cb: Function) => ipcRenderer.on("server:stderr", (_, data) => cb(data))
});
