import { MongoClient } from "mongodb"
import { HttpServer, HttpServerConfig } from "./server/http"
import { VideoRepoFile, VideoRepoFileConfig } from "./repo/video"
import { VideoDetailRepoMongo } from "./repo/video-detail"
import { VideoService } from "./internal/service/video"
import { ErrorServiceConsole } from "./internal/service/error"
import path from "path"
;(async () => {
  const videoRepoFileConfig: VideoRepoFileConfig = {
    ourFileDir: path.join(__dirname, "../files/videos"),
  }

  const videoRepo = new VideoRepoFile(videoRepoFileConfig)

  const client = await MongoClient.connect(
    "mongodb://localhost:27017/khampee",
  ).catch((e) => {
    console.log("fail to connect mongodb:", e)
    process.exit(0)
  })
  const db = client.db("khampee")

  const videoDetailRepo = new VideoDetailRepoMongo(db)
  const videoService = new VideoService(videoRepo, videoDetailRepo)

  const httpServerConfig: HttpServerConfig = {
    port: "8080",
    tmpFileDir: path.join(__dirname, "../files/tmp"),
    domain: "http://localhost:8080",
  }
  const errorService = new ErrorServiceConsole()

  const server = new HttpServer(videoService, errorService, httpServerConfig)

  server.start()
})()
