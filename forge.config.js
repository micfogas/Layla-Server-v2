module.exports = {
  packagerConfig: {
    asar: true,
    extraResource: ["./resources"]
  },
  rebuildConfig: {},
  makers: [
    {
      name: '@electron-forge/maker-squirrel',
      config: {
        name: 'layla_server',
        authors: 'Layla Network',
        description: 'Layla P2P LocalAI Server',
        createDesktopShortcut: true,
        createStartMenuShortcut: true
      }
    },
    {
      name: '@electron-forge/maker-zip',
      platforms: ['win32']
    }
  ]
};
