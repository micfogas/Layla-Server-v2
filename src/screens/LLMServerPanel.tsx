import React, { useState, useRef } from "react";

const MAX_BUFFER_SIZE = 2 * 1024 * 1024; // 2MB Protection Ceiling

export default function LLMServerPanel() {
  const [running, setRunning] = useState(false);
  const [modelPath, setModelPath] = useState("");
  
  // In a packaged environment, the binary is dynamically pulled based on the installer flavor
  const [serverExePath] = useState("./resources/koboldcpp.exe"); 
  
  const bufferMap = useRef(new Map<string, string>());
  const abortControllers = useRef(new Map<string, AbortController>());

  const handleStart = async () => {
    try {
      if (running) {
        await (window as any).electronBridge.stopServer();
        setRunning(false);
      } else {
        await (window as any).electronBridge.startServer({ serverExePath, modelPath });
        setRunning(true);
      }
    } catch (e) { console.error("Initialization fault: ", e); }
  };

  const processChunk = (sessionId: string, payload: string, type: string) => {
    if (type === "start") bufferMap.current.set(sessionId, "");
    else if (type === "chunk") {
      let current = bufferMap.current.get(sessionId) || "";
      if (current.length + payload.length > MAX_BUFFER_SIZE) {
        bufferMap.current.delete(sessionId);
        sendError(sessionId, "Payload size exceeds 2MB allowance.");
        return;
      }
      bufferMap.current.set(sessionId, current + payload);
    } else if (type === "end") {
      let finalString = bufferMap.current.get(sessionId) || "";
      bufferMap.current.delete(sessionId);
      try {
        JSON.parse(finalString);
        streamToKobold(sessionId, finalString);
      } catch {
        sendError(sessionId, "Payload integrity verification failed.");
      }
    }
  };

  const streamToKobold = async (sessionId: string, body: string) => {
    const controller = new AbortController();
    abortControllers.current.set(sessionId, controller);
    try {
      const res = await fetch("http://127.0.0.1:5001/v1/chat/completions", {
        method: "POST", body, headers: { "Content-Type": "application/json" },
        signal: controller.signal
      });
    } catch (e) {
      sendError(sessionId, "Upstream Engine Fault");
    } finally {
      abortControllers.current.delete(sessionId);
    }
  };

  const sendError = (sessionId: string, msg: string) => {
    const errorJson = JSON.stringify({ error: { message: msg, type: "internal_fault", code: 500 }});
    console.log(`Dispatched fault: ${errorJson}`);
  };

  return (
    <div style={{ padding: 25, color: "white", backgroundColor: "#151515", minHeight: "100vh", fontFamily: "sans-serif" }}>
      <h2>Layla Server v2.1</h2>
      <div style={{ marginBottom: 20 }}>
        <label>Target GGUF Model Location: </label>
        <input value={modelPath} onChange={e => setModelPath(e.target.value)} style={{ width: 350 }} placeholder="C:/models/model.gguf" />
      </div>
      <button onClick={handleStart} style={{ padding: "12px 24px", cursor: "pointer", fontWeight: "bold" }}>
        {running ? "SHUTDOWN PROXIES" : "INITIALIZE PIPELINES"}
      </button>
    </div>
  );
}
