# Layla-Server V2

- Original credit goes to [@l3utterfly](https://github.com/l3utterfly) for https://github.com/l3utterfly/Layla-Server
- This is an update /replacement /alternate to the original. https://layla-network.ai/

**Layla-Server V2** is a lightweight, secure, peer-to-peer (P2P) proxy application built on Electron and TypeScript. It bridges remote clients (specifically the Layla AI mobile application) with a locally hosted inference engine. By utilizing WebRTC Data Channels and a remote signaling server, Layla-Server bypasses traditional NAT routing and port-forwarding requirements, allowing secure remote access to local LLM hardware from anywhere.

In Version 2, the underlying inference engine has been migrated from `llama.cpp` (`llama-server.exe`) to **LocalAI**. This strategic shift preserves hardware agnosticism (gracefully falling back to CPU execution if CUDA/ROCm is unavailable) while introducing strict adherence to the OpenAI API specification and unlocking dynamic VRAM model management.

---

## 🏗️ Architecture & Core Features

* **P2P WebRTC Proxy:** Utilizes `layla-signalling-production.up.railway.app` for initial SDP handshakes, establishing a direct, encrypted `layla-datachannel` for all subsequent token streaming.
* **LocalAI Backend:** Acts as a drop-in, locally hosted replacement for the OpenAI API. It handles model execution, prompt caching, and Server-Sent Events (SSE) streaming.
* **Dynamic VRAM Hot-Swapping:** Unlike v1, which locked the server to a single model via command-line arguments, v2 leverages LocalAI's `/models` directory. The server dynamically loads, serves, and unloads models from memory based strictly on the `"model"` string provided in the incoming JSON payload.
* **Hardware Agnostic:** Supports execution across diverse hardware environments, eliminating the strict NVIDIA/CUDA lock-in required by alternative inference engines like Inferno.

---

## 🛡️ Security & Performance Enhancements (v1 → v2)

Version 2 addresses several critical vulnerabilities and state-management bottlenecks present in the original architecture:

1. **State Collision Mitigation:** Incoming payload chunks are no longer stored in a volatile global string reference. Session state is now strictly isolated using a `Map<string, string>` dictionary keyed by the client-generated `sessionId`, preventing data corruption during multiplexed or overlapping requests.
2. **Unbounded Memory Defense (Buffer Bloat):** Implemented a strict 2MB byte-size limit during the WebRTC `chunk` phase. Payloads exceeding this threshold are aggressively dropped, mitigating Denial of Service (DoS) risks and Out-Of-Memory (OOM) crashes caused by malformed client loops.
3. **JSON Payload Validation:** The fully assembled buffer is wrapped in a `try...catch` structural integrity check prior to upstream transmission. Corrupted transit data instantly returns an HTTP 500 equivalent over the data channel, allowing the client to cleanly retry.
4. **Automated Orphan Inference Destruction:** The proxy's `AbortController` is now directly bound to the `RTCPeerConnection.onconnectionstatechange` event. If a peer silently disconnects or drops to a `failed` state, the local HTTP `fetch` is instantly aborted, terminating the LocalAI generation sequence and freeing hardware resources.

---

## ⚙️ Installation & Build Instructions

The deployment environment utilizes Node.js and Electron Forge to compile standalone executables. The build pipeline is configured to generate both a traditional Windows 11 installer and a portable archive.

### Prerequisites

* Node.js (v20+ recommended)
* Git
* A compatible `localai.exe` binary (placed in the `/resources` directory)

### Step-by-Step Build Process

**1. Clone the Repository & Install Dependencies**

```bash
git clone https://github.com/micfogas/Layla-Server.git layla-server-v2
cd layla-server-v2
npm install

```

**2. Initialize the Environment**
Run the automated setup script to construct the necessary directory trees (`/resources/models`, `/src/screens`, etc.) and prepare the LocalAI integration pipeline.

```bash
npm run setup

```

*> Note: You must manually place your preferred `localai.exe` binary into the newly created `/resources` folder prior to packaging.*

**3. Test the Application Locally**
To launch the Electron development server and verify the UI and LocalAI pathing:

```bash
npm start

```

**4. Compile the Application**
Execute one of the following commands to package the application for distribution:

* **Windows 11 Installer (Squirrel):** Creates a standard setup executable that handles Start Menu shortcuts, desktop icons, and uninstallation routing.
```bash
npm run make:installer

```


* **Portable Deployment (ZIP):** Creates a standalone, pre-configured directory structure that can be extracted to a flash drive or executed without administrative installation privileges.
```bash
npm run make:portable

```



Output files will be generated in the `/out` directory.

---

## 📡 Client Integration Guide (For Layla App)

Layla-Server v2 acts as a transparent proxy for the standard OpenAI API specification.

### Standard Inference Request

The client must format the user's prompt into a standard OpenAI JSON schema, serialize it, and chunk it over the WebRTC channel using the Layla transport wrapper (`{"sessionId": "...", "type": "...", "payload": "..."}`).

### Dynamic Model Selection (Hot-Swapping)

Because the backend now utilizes LocalAI, the server is no longer restricted to a single loaded model. To switch models mid-session, the client simply updates the `"model"` string in the OpenAI JSON payload to match the target filename in the server's `/models` directory (e.g., `"model": "phi-3-mini.gguf"`).

If the requested model is not currently in VRAM, the server will autonomously unload the previous model and load the requested one. *Expect a slight increase in TTFT (Time To First Token) during a hot-swap event.*

### Error Handling

The server will now synthesize and transmit standard OpenAI HTTP error schemas over the WebRTC channel if internal processing fails (e.g., incompatible GGUF format, payload too large).

```json
{
  "error": {
    "message": "Payload Too Large",
    "type": "server_error",
    "code": 413
  }
}

```
