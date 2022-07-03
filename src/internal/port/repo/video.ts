import { Readable } from "stream"

export interface VideoRepo {
  store: (readStream: Readable) => string
  get: (id: string) => Readable
}
