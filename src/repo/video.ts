import fs, { ReadStream } from "fs"
import path from "path"

export class VideoRepoFile {
  store(readStream: ReadStream): void {}

  get(id: string): ReadStream {
    const filePath = path.join(__dirname, "../../files/demo.txt")
    const readStream = fs.createReadStream(filePath)
    readStream.push(`${id}\n`)
    return readStream
  }
}
