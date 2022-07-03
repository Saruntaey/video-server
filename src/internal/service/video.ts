import { Readable, Writable } from "stream"
import { VideoRepo } from "../port/repo/video"
import { genId } from "../model/id"
import { VideoFilter, VideoEncryptInput, VideoDetail } from "../model/video"

export class VideoService {
  constructor(private videoRepo: VideoRepo) {}

  encrypt(input: VideoEncryptInput, r: Readable): string {
    const id = genId()
    const { courseId } = input
    const videoFilter: VideoFilter = {
      id,
      courseId,
    }
    const videoKey = this.videoRepo.store(videoFilter, r)
    const newVideo: VideoDetail = {
      id,
      courseId,
      key: videoKey,
    }
    console.log("newVideo", newVideo)
    return id
  }

  serve(videoFilter: VideoFilter, w: Writable): void {
    const readStream = this.videoRepo.get(videoFilter)
    readStream.pipe(w)
    readStream.on("error", (err) => {
      console.log("fail to stream video", err)
    })
  }
}
