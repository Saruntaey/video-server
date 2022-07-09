import fs from "fs"
import { Readable } from "stream"
import path from "path"
import { VideoService } from "@port/service/video"

export type VideoDetail = {
  courseId: string
  videoName: string
  videoPath: string
}

export interface VideoDetailLoader {
  load: () => VideoDetail[]
}

export interface VideoLoader {
  load: (videoPath: string) => Promise<Readable>
}

export class VideoProcesser {
  constructor(
    private videoDetailLoader: VideoDetailLoader,
    private videoLoader: VideoLoader,
    private videoService: VideoService,
  ) {}

  async run() {
    const videos = this.videoDetailLoader.load()
    const failVideo: VideoDetail[] = []
    const videoRecord = await Promise.all(
      videos.map(async (v) => {
        try {
          let videoPath = v.videoPath
          if (!videoPath.startsWith("/")) {
            // find at root of project
            videoPath = path.join(__dirname, "../../..", videoPath)
          }
          // console.log("video path", videoPath)
          // throw new Error("stop here")
          const readable = await this.videoLoader.load(videoPath)
          const videoDetail = await this.videoService.encrypt(
            { courseId: v.courseId, videoName: v.videoName },
            readable,
          )
          return videoDetail
        } catch (err) {
          failVideo.push(v)
        }
      }),
    )

    const now = new Date()
    fs.writeFileSync(
      path.join(__dirname, `video-process-success_${now.toISOString()}.json`),
      JSON.stringify(videoRecord),
    )

    if (failVideo.length === 0) {
      console.log("all video processed")
      return
    }

    const writable = fs.createWriteStream(
      path.join(__dirname, `video-process-fail_${now.toISOString()}.csv`),
    )
    writable.write("courseId,videoName,videoPath\n")
    failVideo.forEach((v) => {
      writable.write(`${v.courseId},${v.videoName},${v.videoName}\n`)
    })
    writable.end()
    console.log("some video fail to process")
  }
}
