import { app, BrowserWindow, ipcMain, dialog } from "electron";
import * as path from "path";
import * as fs from "fs";
import { spawn, ChildProcess } from "child_process";

let mainWindow: BrowserWindow | null = null;
let serverProcess: ChildProcess | null = null;

app.whenReady().then(() => {
  mainWindow = new BrowserWindow({
    width: 800, height: 900,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true
    }
  });
  mainWindow.loadFile(path.join(__dirname, "../public/index.html"));
});

ipcMain.handle("dialog:openFile", async () => {
  const { canceled, filePaths } = await dialog.showOpenDialog({ properties: ["openFile"] });
  return canceled ? null : filePaths[0];
});

ipcMain.handle("server:start", async (_event, config: any) => {
  if (serverProcess) return "Running";
  
  return new Promise((resolve, reject) => {
    try {
      let executablePath = config.serverExePath;
      if (app.isPackaged) {
        executablePath = path.join(process.resourcesPath, path.basename(config.serverExePath));
      }

      if (!fs.existsSync(config.modelPath)) return reject("GGUF model path not found.");

      // KoboldCPP native OpenAI port is 5001
      const args = [config.modelPath, "--port", "5001"];
      serverProcess = spawn(executablePath, args, { shell: false });

      serverProcess.stdout?.on("data", (d) => mainWindow?.webContents.send("server:stdout", d.toString()));
      serverProcess.stderr?.on("data", (d) => mainWindow?.webContents.send("server:stderr", d.toString()));
      resolve("Started");
    } catch (e: any) {
      reject(e.message);
    }
  });
});

ipcMain.handle("server:stop", () => {
  if (serverProcess) { serverProcess.kill(); serverProcess = null; }
  return "Stopped";
});
