import express, { Request, Response, NextFunction } from "express"
import bodyParser from "body-parser"
import { VideoService } from "../../internal/port/service/video"
import fileUpload from "express-fileupload"
import path from "path"

export class HttpServer {
  constructor(private videoService: VideoService) {}
  public start = () => {
    const app = express()

    app.use(bodyParser.json())
    app.use(bodyParser.urlencoded({ extended: true }))
    app.use(
      fileUpload({
        useTempFiles: true,
        tempFileDir: path.join(__dirname, "../../../files/tmp"),
      }),
    )

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
    if (req.files) {
      console.log("got files")
      if (!(req.files.image instanceof Array)) {
        const { tempFilePath, mimetype } = req.files.image
        console.log("path", tempFilePath)
        console.log("mime", mimetype)
      }
    }
    this.videoService.encrypt(req.body)
    res.send("store video")
  }
}
