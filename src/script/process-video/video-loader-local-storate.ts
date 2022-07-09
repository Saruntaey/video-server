import fs from "fs"
import { Readable, PassThrough } from "stream"

export class VideoLoaderLocalStorage {
  load(path: string): Promise<Readable> {
    return new Promise((resolve, reject) => {
      const readStream = fs.createReadStream(path)
      readStream.on("error", (err) => {
        reject(err)
      })

      const passThrough = new PassThrough()
      readStream.pipe(passThrough)
      resolve(passThrough)
    })
  }
}
