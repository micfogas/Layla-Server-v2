const https = require('https');
const fs = require('fs');
const path = require('path');

// Mapped direct download links for KoboldCPP v1.115
const LINKS = {
  cuda: "https://github.com/LostRuins/koboldcpp/releases/download/v1.115/koboldcpp.exe",
  oldpc: "https://github.com/LostRuins/koboldcpp/releases/download/v1.115/koboldcpp-oldpc.exe"
};

const resourcesDir = path.join(__dirname, '..', 'resources');

if (!fs.existsSync(resourcesDir)) {
  fs.mkdirSync(resourcesDir, { recursive: true });
}

function downloadFile(url, filename) {
  const dest = path.join(resourcesDir, filename);
  console.log(`Initiating download for ${filename}...`);
  
  const file = fs.createWriteStream(dest);
  
  https.get(url, (response) => {
    if (response.statusCode === 301 || response.statusCode === 302) {
      console.log(`Following redirect for ${filename}...`);
      return downloadFile(response.headers.location, filename);
    }
    
    if (response.statusCode !== 200) {
      console.error(`Failed to download ${filename}. HTTP Status Code: ${response.statusCode}`);
      file.close();
      fs.unlink(dest, () => {});
      return;
    }

    response.pipe(file);
    
    file.on('finish', () => {
      file.close();
      console.log(`Successfully downloaded and saved: ${filename}`);
    });
  }).on('error', (err) => {
    fs.unlink(dest, () => {});
    console.error(`Network error downloading ${filename}: ${err.message}`);
  });
}

downloadFile(LINKS.cuda, "koboldcpp.exe");
downloadFile(LINKS.oldpc, "koboldcpp-oldpc.exe");
