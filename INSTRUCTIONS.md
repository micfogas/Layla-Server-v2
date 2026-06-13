# Future Development Instructions: Client Data Synchronization
This file contains the precise prompt to be fed to the LLM agent when we are ready to implement the client-side data backup feature over the existing WebRTC tunnel.

---
**PROMPT TO EXECUTE:**
"You are tasked with expanding the WebRTC proxy logic in 'LLMServerPanel.tsx'. Implement a new message `type` handler called `sync`. When the client sends `{"sessionId": "...", "type": "sync", "payload": "{...base64 encoded JSON zip of client settings...}"}`, the server must intercept this payload instead of routing it to the LLM endpoint. The server will use the Node `fs` module (via an IPC bridge command you must create in `main.ts`) to write this payload to `resources/client_backups/{deviceId}_backup.json`. Ensure there is a corresponding `sync_retrieve` handler that reads this file and pipes it back through the WebRTC data channel."
