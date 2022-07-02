import { ReadStream } from "fs"

export interface VideoRepo {
  store: (readStream: ReadStream) => void
  get: (id: string) => ReadStream
}
