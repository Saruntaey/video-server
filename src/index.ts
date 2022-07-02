import { HttpServer, HttpServerConfig } from "./server/http"
import { VideoRepoFile } from "./repo/video"
import { VideoService } from "./internal/service/video"
import path from "path"

const videoRepo = new VideoRepoFile()
const videoService = new VideoService(videoRepo)

const config: HttpServerConfig = {
  port: "8080",
  tmpFileDir: path.join(__dirname, "../files/tmp"),
}

const server = new HttpServer(videoService, config)

server.start()
