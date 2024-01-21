import { VideoDetail } from "../../internal/model/video"

export class FakeVideoDetailRepo {
  store: (v: VideoDetail) => Promise<void> = async (v: VideoDetail) => { }

  get: (id: string) => Promise<VideoDetail | null> = async (id: string) => {
    return null
  }
}
