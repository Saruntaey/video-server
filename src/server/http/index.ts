import fs from "fs"
import { Readable } from "stream"
import readline from "readline"
import express, { Request, Response, NextFunction } from "express"
import bodyParser from "body-parser"
import cors from "cors"
import { VideoService } from "../../internal/port/service/video"
import fileUpload from "express-fileupload"
import { VideoFilter, VideoEncryptInput } from "../../internal/model/video"

export type HttpServerConfig = {
  port: string
  tmpFileDir: string
  domain: string
}

export class HttpServer {
  constructor(
    private videoService: VideoService,
    private config: HttpServerConfig,
  ) {}

  public start = () => {
    const app = express()

    app.use(cors())
    app.use(bodyParser.json())
    app.use(bodyParser.urlencoded({ extended: true }))
    app.use(
      fileUpload({
        useTempFiles: true,
        tempFileDir: this.config.tmpFileDir,
      }),
    )

    app.get("/", (req: Request, res: Response, next: NextFunction) => {
      const html = `
      <!DOCTYPE html>
      <html lang="en">
        <head>
          <meta charset="UTF-8" />
          <meta http-equiv="X-UA-Compatible" content="IE=edge" />
          <meta name="viewport" content="width=device-width, initial-scale=1.0" />
          <script src="https://cdn.tailwindcss.com"></script>
          <link href="https://vjs.zencdn.net/7.19.2/video-js.css" rel="stylesheet" />
          <title>Document</title>
        </head>
        <body>
          <video
            controls
            preload="auto"
            class="video-js"
            data-setup="{'fluid': true}"
          >
            <source src="/courses/cal-1/videos/LDETCJ7KyJ9kdhq76flKv?r=240p" type="application/x-mpegURL" />
          </video>
          <script src="https://vjs.zencdn.net/7.19.2/video.min.js"></script>
        </body>
      </html>
      `
      res.send(html)
    })
    app.use("/courses", this.videoRoute)

    app.get("/key", this.getKey)

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
    const { r } = req.query
    const videoFilter: VideoFilter = {
      id,
      courseId,
      resolution: typeof r === "string" ? r : undefined,
    }
    const readable = this.videoService.serve(videoFilter)
    const readableWithUri = this.attachVideoUri(readable, courseId, id)
    readableWithUri.pipe(res)
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

  private getKey = async (req: Request, res: Response, next: NextFunction) => {
    const { v: videoId } = req.query
    if (typeof videoId === "string") {
      const key = await this.videoService.getKey(videoId)
      res.send(key)
      return
    }
    res.send(400)
  }

  private attachVideoUri = (
    r: Readable,
    courseId: string,
    videoId: string,
  ): Readable => {
    const readable = new Readable()
    readable._read = () => {}
    const rl = readline.createInterface({
      input: r,
      crlfDelay: Infinity,
    })
    rl.on("line", (line) => {
      if (line.startsWith("#")) {
        if (line.startsWith("#EXT-X-KEY")) {
          const data = line.split(",")
          data.forEach((d, idx) => {
            if (idx !== 0) {
              readable.push(",")
            }
            if (d.startsWith("URI")) {
              readable.push(`URI="${this.config.domain}/key?v=${videoId}"`)
            } else {
              readable.push(`${d}`)
            }
          })
          readable.push("\n")
        } else {
          readable.push(`${line}\n`)
        }
      } else {
        readable.push(
          `${this.config.domain}/courses/${courseId}/video/${videoId}/${line}\n`,
        )
      }
    })
    rl.on("close", () => {
      readable.push(null)
    })
    return readable
  }
}
