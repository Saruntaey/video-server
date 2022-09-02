// data-setup='{"fluid": true, "playbackRates": [0.5, 1, 1.25, 1.5, 1.75, 2]}'
require("videojs-resolution-switcher-vjs7/videojs-resolution-switcher")

const player = videojs("player", {
  fluid: true,
  playbackRates: [0.5, 1, 1.25, 1.5, 1.75, 2],
  plugins: {
    videoJsResolutionSwitcher: {
      default: "high",
      // dynamicLabel: true,
    },
  },
  // function() {
  //   // Add dynamically sources via updateSrc method
  //   console.log("in da func")
  //   player.updateSrc([
  //     {
  //       src: "http://media.xiph.org/mango/tears_of_steel_1080p.webm",
  //       type: "video/webm",
  //       label: "360",
  //     },
  //     {
  //       src: "http://mirrorblender.top-ix.org/movies/sintel-1024-surround.mp4",
  //       type: "video/mp4",
  //       label: "720",
  //     },
  //   ])

  //   player.on("resolutionchange", function () {
  //     console.info("Source changed to %s", player.src())
  //   })
  // },
})
// player.videoJsResolutionSwitcher()
// p.updateSrc([
//   {
//     src: "https://vjs.zencdn.net/v/oceans.mp4",
//     type: "video/mp4",
//     res: 480,
//     label: "SD",
//   },
//   {
//     src: "https://vjs.zencdn.net/v/oceans.mp4",
//     type: "video/mp4",
//     res: 720,
//     label: "HD",
//   },
// ])
