import { ReadStream, WriteStream } from "fs"
import { VideoRepo } from "../port/repo/video"
import { genId } from "../model/id"

export class VideoService {
  constructor(private videoRepo: VideoRepo) {}

  encrypt(readStream: ReadStream): string {
    const id = genId()
    return id
  }

  serve(id: string, writeStream: WriteStream): void {}
}
