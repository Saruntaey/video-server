import { Readable } from "stream"
import { VideoFilter } from "../../model/video"

export interface VideoRepo {
  store: (filter: VideoFilter, r: Readable) => string
  get: (filter: VideoFilter) => Readable
}
