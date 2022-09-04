class VideoApiServer {
  constructor(player) {
    this.player = player
  }

  listen() {
    window.addEventListener("message", (evt) => {
      this.apiHandler(evt.data)
    })
  }

  emit() {
    window.addEventListener("load", () =>
      parent.postMessage({ type: "ready" }, "*"),
    )
    this.player.on("ended", () => parent.postMessage({ type: "ended" }, "*"))
  }

  listenAndEmit() {
    this.listen()
    this.emit()
  }

  apiHandler({ type, payload }) {
    switch (type) {
      case "pause":
        this.player.pause()
        break
      case "play":
        this.player.play()
    }
  }
}
