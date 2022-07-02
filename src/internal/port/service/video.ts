import { ReadStream, WriteStream } from "fs"

export interface VideoService {
  encrypt: (readStream: ReadStream) => string
  serve: (id: string, writeStream: WriteStream) => void
}
