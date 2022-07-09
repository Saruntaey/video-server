import "./bootstrap-paths"
import "dotenv/config"
import path from "path"
import { MongoClient } from "mongodb"
import { HttpServer, HttpServerConfig, HttpServerEvent } from "@server/http"
import { VideoRepoFile, VideoRepoFileConfig } from "@repo/video"
import { VideoDetailRepoMongo } from "@repo/video-detail"
import { VideoService } from "@service/video"
import { ErrorServiceConsole } from "@service/error"
;(async () => {
  const videoRepoFileConfig: VideoRepoFileConfig = {
    outFileDir: path.join(__dirname, "../files/videos"),
  }

  const videoRepo = new VideoRepoFile(videoRepoFileConfig)

  const client = await MongoClient.connect(
    process.env.MONGO_URI || "mongodb://localhost:27017",
  ).catch((e) => {
    console.log("fail to connect mongodb:", e)
    process.exit(1)
  })
  const db = client.db(process.env.MONGO_DB_NAME || "testing")

  const videoDetailRepo = new VideoDetailRepoMongo(db)
  const videoService = new VideoService(videoRepo, videoDetailRepo)

  const httpServerConfig: HttpServerConfig = {
    port: process.env.PORT || "3000",
    tmpFileDir: path.join(__dirname, "../files/tmp"),
    domain: process.env.DOMAIN || "http://localhost:3000",
  }
  const errorService = new ErrorServiceConsole()

  const server = new HttpServer(videoService, errorService, httpServerConfig)

  server.start()
  server.on(HttpServerEvent.ServerClosed, async () => {
    // TODO should close mongo client after all process finish!
    await client.close()
    console.log("gracefully shudown...")
  })
})()
