class VideoApiClient {
  constructor(elemId) {
    this.elemId = elemId
  }

  do(type, payload) {
    const iframe = document.querySelector(`#${this.elemId}`)
    iframe.contentWindow.postMessage({ type, payload }, "*")
  }

  on(type, cb) {
    window.addEventListener("message", (evt) => {
      if (evt.data.type && evt.data.type === type) {
        cb()
      }
    })
  }
}

const registerVideoApiClient = (elemId) => {
  if (typeof elemId !== "string") {
    throw new Error("elemId should be string")
  }
  if (elemId.startsWith("#")) {
    elemId = elemId.replace(/^#+/, "")
  }
  window[elemId] = new VideoApiClient(elemId)
}

const registerSingleVideoApiClient = (elemId) => {
  if (typeof elemId !== "string") {
    throw new Error("elemId should be string")
  }
  if (elemId.startsWith("#")) {
    elemId = elemId.replace(/^#+/, "")
  }
  window.videoApi = new VideoApiClient(elemId)
}
