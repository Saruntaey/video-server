import fs from "fs"
import { Readable } from "stream"
import readline from "readline"
import express, { Request, Response, NextFunction } from "express"
import bodyParser from "body-parser"
import cors from "cors"
import fileUpload from "express-fileupload"
import { VideoService } from "@port/service/video"
import { ErrorService } from "@port/service/error"
import { VideoFilter, VideoEncryptInput } from "@model/video"
import { BaseError } from "@model/error"

export type HttpServerConfig = {
  port: string
  tmpFileDir: string
  domain: string
}

export class HttpServer {
  constructor(
    private videoService: VideoService,
    private errService: ErrorService,
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
            data-setup="{}"
          >
            <source src="/playlist?c=cal-1&v=_z1Z2vgCD612EHJ3gu6Me" type="application/x-mpegURL" />
          </video>
          <script src="https://vjs.zencdn.net/7.19.2/video.min.js"></script>
        </body>
      </html>
      `
      res.send(html)
    })
    app.post("/courses/:courseId/videos", this.storeVideo)
    app.get("/playlist", this.getPlaylist)
    app.get("/stream", this.streamVideo)
    app.get("/key", this.getKey)

    app.listen(this.config.port, () => {
      console.log(`Listining on ${this.config.port}`)
    })

    process.on("unhandledRejection", (err) => {
      throw err
    })

    process.on("uncaughtException", (err) => {
      this.errService.logErr(err)
      if (!(err instanceof BaseError)) {
        process.exit(1)
      }
    })
  }

  private getPlaylist = (req: Request, res: Response, next: NextFunction) => {
    const { c: courseId, v: videoId, r: resolution } = req.query
    if (typeof courseId === "string" && typeof videoId === "string") {
      const videoFilter: VideoFilter = {
        id: videoId,
        courseId,
        resolution: typeof resolution === "string" ? resolution : undefined,
      }
      const readable = this.videoService.getPlaylist(videoFilter)
      const readableWithUri = this.attachVideoUri(readable, courseId, videoId)
      readableWithUri.pipe(res)
      return
    }
    res.status(400).send()
  }

  private streamVideo = (req: Request, res: Response, next: NextFunction) => {
    const { c: courseId, v: videoId, f: streamFile } = req.query
    if (
      typeof courseId === "string" &&
      typeof videoId === "string" &&
      typeof streamFile === "string"
    ) {
      const videoFilter: VideoFilter = {
        id: videoId,
        courseId,
        streamFile,
      }
      const readable = this.videoService.stream(videoFilter)
      readable.pipe(res)
      return
    }
    res.status(400).send()
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
    res.status(400).send()
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
        if (line.split(".").length > 1) {
          readable.push(
            `${this.config.domain}/stream?c=${courseId}&v=${videoId}&f=${line}\n`,
          )
        } else {
          readable.push(
            `${this.config.domain}/playlist?c=${courseId}&v=${videoId}&r=${line}\n`,
          )
        }
      }
    })
    rl.on("close", () => {
      readable.push(null)
    })
    return readable
  }
}
