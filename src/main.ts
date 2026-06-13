import { app, BrowserWindow, ipcMain, dialog } from "electron";
import * as path from "path";
import * as fs from "fs";
import { spawn, ChildProcess } from "child_process";

let mainWindow: BrowserWindow | null = null;
let serverProcess: ChildProcess | null = null;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 800,
    height: 900,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true
    }
  });
  mainWindow.loadFile(path.join(__dirname, "../public/index.html"));
}

app.whenReady().then(createWindow);

ipcMain.handle("dialog:openFile", async () => {
  const { canceled, filePaths } = await dialog.showOpenDialog({ properties: ["openFile"] });
  return canceled ? null : filePaths[0];
});

ipcMain.handle("server:start", async (_event, config: any) => {
  if (serverProcess) return "Running";
  
  return new Promise((resolve, reject) => {
    try {
      if (config.serverType === "localai") {
        const yamlContent = `
name: default-model
parameters:
  model: ${config.modelPath}
backend: llama-cpp
`;
        const modelsDir = path.join(process.resourcesPath || __dirname, "../resources/models");
        if (!fs.existsSync(modelsDir)) fs.mkdirSync(modelsDir, { recursive: true });
        fs.writeFileSync(path.join(modelsDir, "default.yaml"), yamlContent);
        
        serverProcess = spawn(config.serverExePath, ["--models-path", modelsDir, "--address", ":8080"], { shell: false });
      } else {
        serverProcess = spawn(config.serverExePath, ["--model", config.modelPath], { shell: false });
      }

      serverProcess.stdout?.on("data", (d) => mainWindow?.webContents.send("server:stdout", d.toString()));
      serverProcess.stderr?.on("data", (d) => mainWindow?.webContents.send("server:stderr", d.toString()));
      resolve("Started");
    } catch (e: any) {
      reject(e.message);
    }
  });
});

ipcMain.handle("server:stop", () => {
  if (serverProcess) {
    serverProcess.kill();
    serverProcess = null;
  }
  return "Stopped";
});
