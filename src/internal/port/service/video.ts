import { Readable, Writable } from "stream"
import { VideoFilter, VideoEncryptInput } from "../../model/video"

export interface VideoService {
  encrypt: (input: VideoEncryptInput, r: Readable) => string
  serve: (videoFilter: VideoFilter) => Readable
}
