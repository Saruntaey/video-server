import fs, { ReadStream } from "fs"

export class VideoRepoFile {
  store(readStream: ReadStream): void {}

  get(id: string): ReadStream {
    const readStream = fs.createReadStream(`/secret/${id}`)
    return readStream
  }
}
