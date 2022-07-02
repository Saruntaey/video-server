import express, { Request, Response, NextFunction } from "express"
import bodyParser from "body-parser"
import { VideoService } from "../../internal/port/service/video"
import { Readable } from "stream"

export class HttpServer {
  constructor(private videoService: VideoService) {}
  public start = () => {
    const app = express()

    app.use(bodyParser.json())
    app.use(bodyParser.urlencoded({ extended: true }))

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

  private streamVideo = (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.params
    this.videoService.serve(id, res)
  }

  private storeVideo = (req: Request, res: Response, next: NextFunction) => {
    this.videoService.encrypt(req.body)
    res.send("store video")
  }
}
