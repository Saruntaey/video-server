import { RawVideoConfig } from "@script/process-video/video-processer"

interface Loader {
  load: () => string[][]
}

export class VideoDetailLoaderCsv {
  constructor(private loader: Loader) {}

  load(): RawVideoConfig[] {
    const rawData = this.loader.load()
    return rawData.map((row) => {
      return {
        courseId: row[0],
        videoName: row[1],
        videoPath: row[2],
        videoId: row[3],
      }
    })
  }
}
