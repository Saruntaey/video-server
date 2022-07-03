import { VideoDetail } from "../../model/video"
export interface VideoDetailRepo {
  store: (v: VideoDetail) => Promise<void>
  get: (id: string) => Promise<VideoDetail | null>
}
