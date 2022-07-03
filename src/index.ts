import { MongoClient } from "mongodb"
import { HttpServer, HttpServerConfig } from "./server/http"
import { VideoRepoFile, VideoRepoFileConfig } from "./repo/video"
import { VideoDetailRepoMongo } from "./repo/video-detail"
import { VideoService } from "./internal/service/video"
import path from "path"

const videoRepoFileConfig: VideoRepoFileConfig = {
  ourFileDir: path.join(__dirname, "../files/videos"),
}

MongoClient.connect("mongodb://localhost:27017/khampee", {})
  .then((client) => {
    const videoRepo = new VideoRepoFile(videoRepoFileConfig)
    const db = client.db("khampee")
    const videoDetailRepo = new VideoDetailRepoMongo(db)
    const videoService = new VideoService(videoRepo, videoDetailRepo)

    const httpServerConfig: HttpServerConfig = {
      port: "8080",
      tmpFileDir: path.join(__dirname, "../files/tmp"),
      domain: "localhost:8080",
    }

    const server = new HttpServer(videoService, httpServerConfig)

    server.start()
  })
  .catch((e) => {
    console.log("fail to connect mongodb:", e)
  })
