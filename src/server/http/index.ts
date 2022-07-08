import fs from "fs"
import { Readable } from "stream"
import readline from "readline"
import EventEmiter from "events"
import express, { Request, Response, NextFunction } from "express"
import bodyParser from "body-parser"
import cors from "cors"
import fileUpload from "express-fileupload"
import { VideoService } from "@port/service/video"
import { ErrorService } from "@port/service/error"
import { VideoFilter, VideoEncryptInput } from "@model/video"
import {
  BaseError,
  InvalidArgErr,
  InternalErr,
  InvalidArgDetail,
} from "@model/error"

export enum HttpServerEvent {
  ServerClosed = "server_closed",
}

export type HttpServerConfig = {
  port: string
  tmpFileDir: string
  domain: string
}

export class HttpServer extends EventEmiter {
  constructor(
    private videoService: VideoService,
    private errService: ErrorService,
    private config: HttpServerConfig,
  ) {
    super()
  }

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

    app.use(this.errorHandler)

    const server = app.listen(this.config.port, () => {
      console.log(`Listining on ${this.config.port}`)
    })

    process.on("unhandledRejection", (err) => {
      throw err
    })

    process.on("uncaughtException", (err) => {
      if (!(err instanceof BaseError)) {
        this.errService.logErr(err)
        process.emit("SIGTERM")
      }
    })

    process.on("SIGTERM", () => {
      console.log("recieve sigterm")
      server.close(() => {
        console.log("server closed")
        this.emit(HttpServerEvent.ServerClosed)
      })
    })
  }

  private extractPlaylistInput(input: any): VideoFilter {
    const { c: courseId, v: videoId, r: resolution } = input
    const invalidArgDetail: InvalidArgDetail[] = []
    if (!courseId || typeof courseId !== "string") {
      invalidArgDetail.push({ field: "c", detail: "required as courseId" })
    }
    if (!videoId || typeof videoId !== "string") {
      invalidArgDetail.push({ field: "v", detail: "required as videoId" })
    }
    if (resolution && typeof resolution !== "string") {
      invalidArgDetail.push({
        field: "r",
        detail: "should be string of resoution",
      })
    }
    if (invalidArgDetail.length !== 0) {
      throw new InvalidArgErr(invalidArgDetail)
    }
    return {
      id: videoId,
      courseId,
      resolution,
    }
  }

  private getPlaylist = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ) => {
    try {
      const videoFilter = this.extractPlaylistInput(req.query)
      const readable = await this.videoService.getPlaylist(videoFilter)

      const { id: videoId, courseId } = videoFilter
      const readableWithUri = this.attachVideoUri(readable, courseId, videoId)
      readableWithUri.pipe(res)
    } catch (err) {
      next(err)
    }
  }

  private extractStreamVideoInput(input: any): VideoFilter {
    const { c: courseId, v: videoId, f: streamFile } = input
    const invalidArgDetail: InvalidArgDetail[] = []
    if (!courseId || typeof courseId !== "string") {
      invalidArgDetail.push({ field: "c", detail: "required as courseId" })
    }
    if (!videoId || typeof videoId !== "string") {
      invalidArgDetail.push({ field: "v", detail: "required as videoId" })
    }
    if (!streamFile || typeof streamFile !== "string") {
      invalidArgDetail.push({ field: "f", detail: "required as file name" })
    }
    if (invalidArgDetail.length !== 0) {
      throw new InvalidArgErr(invalidArgDetail)
    }
    return {
      id: videoId,
      courseId,
      streamFile,
    }
  }

  private streamVideo = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ) => {
    try {
      const videoFilter = this.extractStreamVideoInput(req.query)
      const readable = await this.videoService.getStream(videoFilter)
      readable.pipe(res)
      return
    } catch (err) {
      next(err)
    }
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

  private extractGetKeyInput(input: any): string {
    const { v: videoId } = input
    const invalidArgDetail: InvalidArgDetail[] = []
    if (!videoId || typeof videoId !== "string") {
      invalidArgDetail.push({ field: "v", detail: "required as videoId" })
    }
    if (invalidArgDetail.length !== 0) {
      throw new InvalidArgErr(invalidArgDetail)
    }
    return videoId
  }

  private getKey = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const videoId = this.extractGetKeyInput(req.query)
      const key = await this.videoService.getKey(videoId)
      res.send(key)
    } catch (err) {
      next(err)
    }
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

  private errorHandler(
    err: Error,
    req: Request,
    res: Response,
    next: NextFunction,
  ) {
    if (err instanceof BaseError) {
      res.status(err.code).json(err.response)
      return
    }
    this.errService.logErr(err)
    const e = new InternalErr()
    res.status(e.code).json(e.response)
    process.emit("SIGTERM")
  }
}
