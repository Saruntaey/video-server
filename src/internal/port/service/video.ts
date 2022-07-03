import { Readable, Writable } from "stream"
import { VideoFilter, VideoEncryptInput } from "../../model/video"

export interface VideoService {
  encrypt: (input: VideoEncryptInput, r: Readable) => Promise<string>
  getPlaylist: (videoFilter: VideoFilter) => Readable
  stream: (videoFilter: VideoFilter) => Readable
  getKey: (videoId: string) => Promise<string | null>
}
