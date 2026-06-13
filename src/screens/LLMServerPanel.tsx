import React, { useState, useRef, useEffect } from "react";

const MAX_BUFFER_SIZE = 2 * 1024 * 1024; // 2MB Limit

export default function LLMServerPanel() {
  const [running, setRunning] = useState(false);
  const [serverType, setServerType] = useState("localai");
  const [modelPath, setModelPath] = useState("");
  const [serverExePath, setServerExePath] = useState("./resources/localai.exe");
  const bufferMap = useRef(new Map<string, string>());
  const abortControllers = useRef(new Map<string, AbortController>());

  const handleStart = async () => {
    try {
      if (running) {
        await (window as any).electronBridge.stopServer();
        setRunning(false);
      } else {
        await (window as any).electronBridge.startServer({ serverType, serverExePath, modelPath });
        setRunning(true);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const processChunk = (sessionId: string, payload: string, type: string) => {
    if (type === "start") {
      bufferMap.current.set(sessionId, "");
    } else if (type === "chunk") {
      let current = bufferMap.current.get(sessionId) || "";
      if (current.length + payload.length > MAX_BUFFER_SIZE) {
        bufferMap.current.delete(sessionId);
        sendError(sessionId, "Payload Too Large");
        return;
      }
      bufferMap.current.set(sessionId, current + payload);
    } else if (type === "end") {
      let finalString = bufferMap.current.get(sessionId) || "";
      bufferMap.current.delete(sessionId);
      try {
        JSON.parse(finalString);
        streamToServer(sessionId, finalString);
      } catch {
        sendError(sessionId, "Invalid JSON payload format");
      }
    }
  };

  const streamToServer = async (sessionId: string, body: string) => {
    const controller = new AbortController();
    abortControllers.current.set(sessionId, controller);
    try {
      const res = await fetch("http://127.0.0.1:8080/v1/chat/completions", {
        method: "POST",
        body,
        signal: controller.signal
      });
      // Stream reading logic mapped to WebRTC DataChannel here
    } catch (e) {
      sendError(sessionId, "Upstream error");
    } finally {
      abortControllers.current.delete(sessionId);
    }
  };

  const sendError = (sessionId: string, msg: string) => {
    const errorJson = JSON.stringify({ error: { message: msg, code: 500 }});
    // Send over WebRTC DataChannel logic here
    console.log(`Error sent to ${sessionId}: ${errorJson}`);
  };

  return (
    <div style={{ padding: 20, color: "white", backgroundColor: "#1a1a1a", minHeight: "100vh" }}>
      <h1>Layla Server Configuration</h1>
      
      <div style={{ marginBottom: 15 }}>
        <label>Engine Backend: </label>
        <select value={serverType} onChange={(e) => {
          setServerType(e.target.value);
          if (e.target.value === "localai") setServerExePath("./resources/localai.exe");
        }}>
          <option value="localai">LocalAI (Default)</option>
          <option value="custom">Custom (llama-server, etc)</option>
        </select>
      </div>

      <div style={{ marginBottom: 15 }}>
        <label>Binary Location: </label>
        <input disabled={serverType !== "custom"} value={serverExePath} onChange={e => setServerExePath(e.target.value)} style={{ width: 300 }} />
      </div>

      <div style={{ marginBottom: 15 }}>
        <label>Model Path: </label>
        <input value={modelPath} onChange={e => setModelPath(e.target.value)} style={{ width: 300 }} />
      </div>

      <button onClick={handleStart} style={{ padding: "10px 20px" }}>
        {running ? "Stop Server" : "Start Server"}
      </button>
    </div>
  );
}
