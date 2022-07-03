import { Readable, Writable } from "stream"
import { VideoRepo } from "../port/repo/video"
import { genId } from "../model/id"

export class VideoService {
  constructor(private videoRepo: VideoRepo) {}

  encrypt(r: Readable): string {
    const id = genId()
    const videoKey = this.videoRepo.store(r)
    console.log("key", videoKey)
    return id
  }

  serve(id: string, w: Writable): void {
    const readStream = this.videoRepo.get(id)
    readStream.pipe(w)
    readStream.on("error", (err) => {
      console.log("fail to stream video", err)
    })
  }
}
