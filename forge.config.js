const path = require('path');

const flavor = process.env.BUILD_FLAVOR || 'cuda';
const binaryName = flavor === 'oldpc' ? 'koboldcpp-oldpc.exe' : 'koboldcpp.exe';
const setupName = flavor === 'oldpc' ? 'Layla-Server-Legacy-Setup.exe' : 'Layla-Server-Standard-Setup.exe';

console.log(`\n=== Packaging Target: ${flavor.toUpperCase()} ===`);
console.log(`Bundling Binary: ${binaryName}\n`);

module.exports = {
  packagerConfig: {
    asar: true,
    extraResource: [ path.join("./resources", binaryName) ]
  },
  rebuildConfig: {},
  makers: [
    {
      name: '@electron-forge/maker-squirrel',
      config: {
        name: `layla_server_${flavor}`,
        setupExe: setupName,
        authors: 'Layla Network',
        description: `Layla Server (${flavor === 'cuda' ? 'CUDA Accelerated' : 'Legacy CPU/Hardware'})`,
        createDesktopShortcut: true,
        createStartMenuShortcut: true
      }
    }
  ]
};
