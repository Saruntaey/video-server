import fs, { WriteStream } from "fs"
import { Readable } from "stream"
import path from "path"
import util from "util"
import { VideoService } from "@port/service/video"
import format from "format-duration"
import ffmpeg from "fluent-ffmpeg"

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
  // private checkedLogDir: boolean = false
  private succesLogFile: WriteStream
  private failLogFile: WriteStream

  constructor(
    private videoDetailLoader: VideoDetailLoader,
    private videoLoader: VideoLoader,
    private videoService: VideoService,
    limit?: number,
  ) {
    if (limit) {
      this.limit = limit
    }
    const nowStr = new Date().toISOString()
    this.succesLogFile = fs.createWriteStream(`${nowStr}_success.csv`, {
      flags: "a",
    })
    this.failLogFile = fs.createWriteStream(`${nowStr}_fail.csv`, {
      flags: "a",
    })
  }

  public async run() {
    this.videos = this.videoDetailLoader.load()
    const startTime = new Date()

    const group = Array.from({ length: this.limit }).map(
      () =>
        new Promise<void>((rs, rj) => {
          try {
            ; (async () => {
              while (this.videos.length > 0) {
                await this.process()
              }
              rs()
            })()
          } catch (err) {
            rj(err)
          }
        }),
    )

    await Promise.all(group)
    this.succesLogFile.end()
    this.failLogFile.end()
    const endTime = new Date()
    console.log(
      "done all",
      format(endTime.getTime() - startTime.getTime(), { leading: true }),
    )
  }

  private async process() {
    const video = this.videos.shift()
    if (!video) {
      return
    }
    // const failVideo: RawVideoConfig[] = []
    const startTime = new Date()
    // const videoRecord = await Promise.all(
    //   videos.map(async (v) => {
    //   }),
    // )

    // let isFailed = false

    try {
      let videoPath = video.videoPath
      if (!videoPath.startsWith("/")) {
        // find at root of project
        videoPath = path.join(__dirname, "../../..", videoPath)
      }
      // console.log("video path", videoPath)
      // throw new Error("stop here")
      const readable = await this.videoLoader.load(videoPath)

      // TODO: mode to VideoDetail model
      const durationInSecond = await extractDurationInSecond(videoPath)

      const videoDetail = await this.videoService.encrypt(
        {
          courseId: video.courseId,
          videoName: video.videoName,
          videoId: video.videoId,
        },
        readable,
      )

      const res = `${videoDetail.id},${videoDetail.videoName},${videoDetail.courseId
        },${videoDetail.key},${durationInSecond * 1e9}\n`
      console.log("success: ", res)
      this.succesLogFile.write(res)
    } catch (err) {
      const res = `${video.courseId},${video.videoName},${video.videoPath},${video.videoId}\n`
      console.log("fail: ", res)
      this.failLogFile.write(res)
      // failVideo.push(v)
      // isFailed = true
    }

    // const logDir = path.join(__dirname, "logs")
    // if (!this.checkedLogDir && !fs.existsSync(logDir)) {
    //   fs.mkdirSync(logDir)
    // }
    // this.checkedLogDir = true
    //
    // const now = new Date()
    // fs.writeFileSync(
    //   path.join(logDir, `video-process-success_${now.toISOString()}.json`),
    //   JSON.stringify(video),
    //   // JSON.stringify(videoRecord),
    // )

    // if (isFailed) {
    //   console.log("all video processed")
    //   return
    // }

    // const writable = fs.createWriteStream(
    //   path.join(logDir, `video-process-fail_${now.toISOString()}.csv`),
    // )
    // writable.write("courseId,videoName,videoPath,videoId(opt.)\n")
    // failVideo.forEach((v) => {
    //   writable.write(
    //     `${v.courseId},${v.videoName},${v.videoPath},${v.videoId}\n`,
    //   )
    // })
    // writable.end()
    // console.log("some video fail to process")
    const endTime = new Date()

    console.log(
      "done",
      util.inspect(video, false, null, true),
      "...elapsed time",
      format(endTime.getTime() - startTime.getTime(), { leading: true }),
    )
  }
}

const extractDurationInSecond = (path: string) => {
  return new Promise<number>((resolve, reject) => {
    ffmpeg.ffprobe(path, (err, metadata) => {
      if (err) {
        reject(err)
      } else {
        resolve(metadata.format.duration ?? 0)
      }
    })
  })
}
