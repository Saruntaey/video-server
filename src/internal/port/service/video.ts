import { Readable, Writable } from "stream"
import { Video, VideoEncryptInput } from "../../model/video"

export interface VideoService {
  encrypt: (input: VideoEncryptInput, r: Readable) => string
  serve: (videoFilter: Video, w: Writable) => void
}
