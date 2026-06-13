import React from "react";
import { createRoot } from "react-dom/client";
import LLMServerPanel from "./screens/LLMServerPanel";
const root = createRoot(document.getElementById("root")!);
root.render(<LLMServerPanel />);
