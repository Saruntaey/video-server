import fs from "fs"
import { Readable } from "stream"
import path from "path"
import util from "util"
import { VideoService } from "@port/service/video"

export type RawVideoConfig = {
  courseId: string
  videoName: string
  videoPath: string
  videoId?: string
}

export interface VideoDetailLoader {
  load: () => RawVideoConfig[]
}

export interface VideoLoader {
  load: (videoPath: string) => Promise<Readable>
}

export class VideoProcesser {
  private videos: RawVideoConfig[] = []
  private limit: number = 4
  private checkedLogDir: boolean = false
  constructor(
    private videoDetailLoader: VideoDetailLoader,
    private videoLoader: VideoLoader,
    private videoService: VideoService,
    limit?: number,
  ) {
    if (limit) {
      this.limit = limit
    }
  }

  public async run() {
    this.videos = this.videoDetailLoader.load()
    while (this.videos.length) {
      await this.process()
    }
  }

  private async process() {
    const videos = this.videos.splice(0, this.limit)
    if (!videos.length) {
      return
    }
    const failVideo: RawVideoConfig[] = []
    console.log(
      "working on",
      util.inspect(videos, false, null, true),
      `\n@${new Date().toISOString()}`,
    )
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
            {
              courseId: v.courseId,
              videoName: v.videoName,
              videoId: v.videoId,
            },
            readable,
          )
          return videoDetail
        } catch (err) {
          failVideo.push(v)
        }
      }),
    )

    const logDir = path.join(__dirname, "logs")
    if (!this.checkedLogDir && !fs.existsSync(logDir)) {
      fs.mkdirSync(logDir)
    }
    this.checkedLogDir = true

    const now = new Date()
    fs.writeFileSync(
      path.join(logDir, `video-process-success_${now.toISOString()}.json`),
      JSON.stringify(videoRecord),
    )

    if (failVideo.length === 0) {
      console.log("all video processed")
      return
    }

    const writable = fs.createWriteStream(
      path.join(logDir, `video-process-fail_${now.toISOString()}.csv`),
    )
    writable.write("courseId,videoName,videoPath,videoId(opt.)\n")
    failVideo.forEach((v) => {
      writable.write(
        `${v.courseId},${v.videoName},${v.videoPath},${v.videoId}\n`,
      )
    })
    writable.end()
    console.log("some video fail to process")
  }
}
