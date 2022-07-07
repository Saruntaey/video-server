import { Readable } from "stream"
import { VideoFilter } from "@model/video"

export interface VideoRepo {
  store: (filter: VideoFilter, r: Readable) => string
  getPlaylist: (filter: VideoFilter) => Promise<Readable>
  getStream: (filter: VideoFilter) => Promise<Readable>
}
