import fs from "fs"
import express, { Request, Response, NextFunction } from "express"
import bodyParser from "body-parser"
import { VideoService } from "../../internal/port/service/video"
import fileUpload from "express-fileupload"
import { VideoFilter, VideoEncryptInput } from "../../internal/model/video"

export type HttpServerConfig = {
  port: string
  tmpFileDir: string
}

export class HttpServer {
  constructor(
    private videoService: VideoService,
    private config: HttpServerConfig,
  ) {}

  public start = () => {
    const app = express()

    app.use(bodyParser.json())
    app.use(bodyParser.urlencoded({ extended: true }))
    app.use(
      fileUpload({
        useTempFiles: true,
        tempFileDir: this.config.tmpFileDir,
      }),
    )

    app.get("/", (req: Request, res: Response, next: NextFunction) => {
      res.send("Hello there")
    })
    app.use("/courses", this.videoRoute)

    app.listen(this.config.port, () => {
      console.log(`Listining on ${this.config.port}`)
    })
  }

  private get videoRoute() {
    const route = express.Router()
    route.get("/:courseId/videos/:id", this.streamVideo)
    route.post("/:courseId/videos", this.storeVideo)
    return route
  }

  private streamVideo = (req: Request, res: Response, next: NextFunction) => {
    const { id, courseId } = req.params
    const videoFilter: VideoFilter = {
      id,
      courseId,
    }
    this.videoService.serve(videoFilter, res)
  }

  private storeVideo = (req: Request, res: Response, next: NextFunction) => {
    if (req.files) {
      const { courseId } = req.params
      if (!(req.files.image instanceof Array)) {
        const { tempFilePath, mimetype } = req.files.image
        console.log("path", tempFilePath)
        console.log("mime", mimetype)
        const r = fs.createReadStream(tempFilePath)
        const input: VideoEncryptInput = {
          courseId,
        }
        this.videoService.encrypt(input, r)
      }
    }
    res.send("store video")
  }
}
