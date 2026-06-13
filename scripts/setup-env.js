const fs = require('fs');
const https = require('https');
const path = require('path');

const resourcesDir = path.join(__dirname, '..', 'resources');
const modelsDir = path.join(resourcesDir, 'models');
if (!fs.existsSync(modelsDir)) fs.mkdirSync(modelsDir, { recursive: true });

console.log("Environment structure verified.");
console.log("To optimize download times, please manually place your preferred 'localai.exe' binary into the 'resources' folder, or use the UI to select a Custom engine.");
