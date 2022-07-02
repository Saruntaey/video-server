import express, { Request, Response, NextFunction } from "express"
import { VideoService } from "../../internal/port/service/video"

export class HttpServer {
  constructor(private videoService: VideoService) {}
  public start = () => {
    const app = express()

    app.get("/", (req: Request, res: Response, next: NextFunction) => {
      res.send("Hello there")
    })
    app.use("/videos", this.videoRoute)

    app.listen("8080", () => {
      console.log("Listining on 8080")
    })
  }

  private get videoRoute() {
    const route = express.Router()
    route.get("/:id", this.streamVideo)
    route.post("/", this.storeVideo)
    return route
  }

  private streamVideo(req: Request, res: Response, next: NextFunction) {
    console.log("in serve video")

    res.send("serveVideo")
  }

  private storeVideo(req: Request, res: Response, next: NextFunction) {
    console.log("in store video")
    res.send("store video")
  }
}
