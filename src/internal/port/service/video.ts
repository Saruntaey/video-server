import { Readable, Writable } from "stream"

export interface VideoService {
  encrypt: (r: Readable) => string
  serve: (id: string, w: Writable) => void
}
