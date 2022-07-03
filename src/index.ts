import { HttpServer, HttpServerConfig } from "./server/http"
import { VideoRepoFile, VideoRepoFileConfig } from "./repo/video"
import { VideoService } from "./internal/service/video"
import path from "path"

const videoRepoFileConfig: VideoRepoFileConfig = {
  ourFileDir: path.join(__dirname, "../files/videos"),
}

const videoRepo = new VideoRepoFile(videoRepoFileConfig)
const videoService = new VideoService(videoRepo)

const httpServerConfig: HttpServerConfig = {
  port: "8080",
  tmpFileDir: path.join(__dirname, "../files/tmp"),
}

const server = new HttpServer(videoService, httpServerConfig)

server.start()
