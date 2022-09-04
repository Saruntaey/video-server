import fs from "fs"
import path from "path"
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

    app.get(
      "/watch/courses/:courseId/videos/:videoId",
      (req: Request, res: Response, next: NextFunction) => {
        const { courseId, videoId } = req.params
        const html = `
      <!DOCTYPE html>
      <html lang="en">
        <head>
          <meta charset="UTF-8" />
          <meta http-equiv="X-UA-Compatible" content="IE=edge" />
          <meta name="viewport" content="width=device-width, initial-scale=1.0" />
          <link href="https://vjs.zencdn.net/7.19.2/video-js.css" rel="stylesheet" />
          <link href="/css/videojs-resolution-switcher.css" rel="stylesheet" />
          <title>Document</title>
        </head>
        <body>
          <video
            id="player"
            controls
            preload="auto"
            class="video-js vjs-big-play-centered vjs-default-skin"
          >
            <source src="/playlist?c=${courseId}&v=${videoId}" type="application/x-mpegURL" label="Auto" />
            <source src="/playlist?c=${courseId}&v=${videoId}&r=720p" type="application/x-mpegURL" label="720p" />
            <source src="/playlist?c=${courseId}&v=${videoId}&r=240p" type="application/x-mpegURL" label="240p" />
          </video>

          <script src="https://vjs.zencdn.net/7.19.2/video.min.js"></script>
          <script src="/js/videoApi-server.js" ></script>
          <script src="/js/bundle.js" ></script>

        </body>
      </html>
      `
        res.send(html)
      },
    )

    app.use(express.static(path.join(process.cwd(), "/public")))
    app.post("/storeVideo", this.storeVideo)
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

  private extractStoreVideoInput = (
    req: Request,
  ): { videoName: string; courseId: string; tempFilePath: string } => {
    const invalidArgDetail: InvalidArgDetail[] = []
    const { videoName, courseId } = req.body
    if (!videoName || typeof videoName !== "string") {
      invalidArgDetail.push({ field: "videoName", detail: "required" })
    }
    if (!courseId || typeof courseId !== "string") {
      invalidArgDetail.push({ field: "courseId", detail: "required" })
    }
    if (!req.files?.video) {
      invalidArgDetail.push({ field: "video", detail: "required" })
    }
    if (req.files?.video && req.files.video instanceof Array) {
      invalidArgDetail.push({
        field: "video",
        detail: "required and support only one video",
      })
    }
    if (invalidArgDetail.length !== 0) {
      throw new InvalidArgErr(invalidArgDetail)
    }
    const { tempFilePath } = req.files!.video as fileUpload.UploadedFile
    return {
      videoName,
      courseId,
      tempFilePath,
    }
  }

  private storeVideo = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ) => {
    try {
      const { videoName, courseId, tempFilePath } =
        this.extractStoreVideoInput(req)
      const r = fs.createReadStream(tempFilePath)
      const input: VideoEncryptInput = {
        videoName,
        courseId,
      }
      r.on("close", () => {
        fs.unlink(tempFilePath, (err) => {
          if (err) {
            throw err
          }
        })
      })
      this.videoService.encrypt(input, r)

      res.send("video encrypting")
    } catch (err) {
      next(err)
    }
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

  private errorHandler = (
    err: Error,
    req: Request,
    res: Response,
    next: NextFunction,
  ) => {
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
