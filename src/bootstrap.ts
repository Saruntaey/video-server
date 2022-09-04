import { Config } from "@app/config"
import path from "path"
import { Db } from "mongodb"
import { HttpServer } from "@server/http"
import { VideoRepoFile, VideoRepoFileConfig } from "@repo/video"
import { VideoDetailRepoMongo } from "@repo/video-detail"
import { VideoService } from "@service/video"
import { ErrorServiceConsole } from "@service/error"

export class Bootstrap {
  constructor(private config: Config, private dbCnn: Db) {}

  public async server(): Promise<HttpServer> {
    const videoRepoFileConfig: VideoRepoFileConfig = {
      outFileDir: path.join(__dirname, "../files/videos"),
    }
    const videoRepo = new VideoRepoFile(videoRepoFileConfig)
    const videoDetailRepo = new VideoDetailRepoMongo(this.dbCnn)
    const videoService = new VideoService(videoRepo, videoDetailRepo)
    const errorService = new ErrorServiceConsole()

    return new HttpServer(this.config, videoService, errorService)
  }
}
