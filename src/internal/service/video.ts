import { Readable, Writable } from "stream"
import { VideoRepo } from "@port/repo/video"
import { VideoDetailRepo } from "@port/repo/video-detail"
import { genId } from "@model/id"
import { VideoFilter, VideoEncryptInput, VideoDetail } from "@model/video"
import { NotFoundErr } from "@model/error"

export class VideoService {
  constructor(
    private videoRepo: VideoRepo,
    private videoDeatilRepo: VideoDetailRepo,
  ) {}

  async encrypt(input: VideoEncryptInput, r: Readable): Promise<string> {
    const id = genId()
    const { courseId } = input
    const videoFilter: VideoFilter = {
      id,
      courseId,
    }
    const videoKey = await this.videoRepo.store(videoFilter, r)
    const newVideo: VideoDetail = {
      id,
      courseId,
      key: videoKey,
    }
    await this.videoDeatilRepo.store(newVideo)
    return id
  }

  async getPlaylist(videoFilter: VideoFilter): Promise<Readable> {
    const readable = await this.videoRepo.getPlaylist(videoFilter)
    return readable
  }

  async getStream(videoFilter: VideoFilter): Promise<Readable> {
    const readable = await this.videoRepo.getStream(videoFilter)
    return readable
  }

  async getKey(videoId: string): Promise<string> {
    const record = await this.videoDeatilRepo.get(videoId)
    if (!record) {
      throw new NotFoundErr("not found key")
    }
    return record.key
  }
}
