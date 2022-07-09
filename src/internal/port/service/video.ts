import { Readable } from "stream"
import { VideoFilter, VideoEncryptInput, VideoDetail } from "@model/video"

export interface VideoService {
  encrypt: (input: VideoEncryptInput, r: Readable) => Promise<VideoDetail>
  getPlaylist: (videoFilter: VideoFilter) => Promise<Readable>
  getStream: (videoFilter: VideoFilter) => Promise<Readable>
  getKey: (videoId: string) => Promise<string>
}
