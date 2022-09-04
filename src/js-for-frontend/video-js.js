require("videojs-resolution-switcher-vjs7/videojs-resolution-switcher")

const player = videojs("player", {
  fluid: true,
  controlBar: {
    fullscreenToggle: false,
  },
  playbackRates: [0.5, 1, 1.25, 1.5, 1.75, 2],
  plugins: {
    videoJsResolutionSwitcher: {
      default: "high",
    },
  },
})

const videoApiServer = new VideoApiServer(player)
videoApiServer.listenAndEmit()
