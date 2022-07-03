import { Readable } from "stream"
import { Video } from "../../model/video"

export interface VideoRepo {
  store: (filter: Video, r: Readable) => string
  get: (filter: Video) => Readable
}
