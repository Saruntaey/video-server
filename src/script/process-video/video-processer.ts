import { Readable } from "stream"
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
    await Promise.all(
      videos.map(async (v) => {
        try {
          const readable = await this.videoLoader.load(v.videoPath)
          await this.videoService.encrypt(
            { courseId: v.courseId, videoName: v.videoName },
            readable,
          )
        } catch (err) {
          console.log(`fail to process video path ${v.videoPath}`)
        }
      }),
    )
  }
}
