import { HttpServer } from "./server/http"
import { VideoRepoFile } from "./repo/video"
import { VideoService } from "./internal/service/video"

const videoRepo = new VideoRepoFile()
const videoService = new VideoService(videoRepo)

const server = new HttpServer(videoService)

server.start()
