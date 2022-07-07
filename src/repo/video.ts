import fs from "fs"
import { Readable } from "stream"
import ffmpeg from "fluent-ffmpeg"
import { randomBytes } from "crypto"
import { VideoFilter } from "@model/video"
import { NotFoundErr } from "@model/error"

export type VideoRepoFileConfig = {
  ourFileDir: string
}
export class VideoRepoFile {
  constructor(private config: VideoRepoFileConfig) {}

  store(filter: VideoFilter, r: Readable): string {
    const key = randomBytes(8).toString("hex")
    const outdir = `${this.config.ourFileDir}/${filter.courseId}/${filter.id}`
    const multipleResolution = [
      {
        output: "720p",
        videoBitrate: "2400",
        audioBitrate: "128",
        size: "1280x720",
      },
      {
        output: "240p",
        videoBitrate: "145",
        audioBitrate: "64",
        size: "426x240",
      },
    ]
    const outputOptions = [
      "-hls_time 10",
      "-hls_playlist_type vod",
      "-hls_enc 1",
      `-hls_enc_key ${key}`,
      `-hls_enc_key_url ${filter.courseId}_${filter.id}.key`,
    ]
    const command = ffmpeg(r).videoCodec("libx264").audioCodec("aac")
    if (!fs.existsSync(outdir)) {
      fs.mkdirSync(outdir, { recursive: true })
    }
    const playlistContent = fs.createWriteStream(`${outdir}/playlist.m3u8`, {
      encoding: "utf-8",
    })
    playlistContent.write(`#EXTM3U\n#EXT-X-VERSION:3\n`)
    multipleResolution.forEach((resolution) => {
      command
        .output(`${outdir}/${resolution.output}.m3u8`, { end: false })
        .outputOption([
          ...outputOptions,
          `-hls_segment_filename ${outdir}/${resolution.output}-%03d.ts`,
        ])
        .videoBitrate(resolution.videoBitrate)
        .audioBitrate(resolution.audioBitrate)
        .audioChannels(2)
        .size(resolution.size)

      playlistContent.write(
        `#EXT-X-STREAM-INF:BANDWIDTH=${
          parseInt(resolution.videoBitrate, 10) * 1024
        },RESOLUTION=${resolution.size},CODECS="avc1.42c01e,mp4a.40.2"\n${
          resolution.output
        }\n`,
      )
    })

    command
      .on("progress", function (progress) {
        console.log(progress)
        // console.log("Processing: " + progress.percent.toFixed(2) + "% done")
      })
      .on("end", function (err, stdout, stderr) {
        playlistContent.close()
        console.log("Finished processing!" /*, err, stdout, stderr*/)
      })
      .on("error", (err, stdout, stderr) => {
        console.log("Procesessing error", err)
        console.log("stdout", stdout)
        console.log("stderr", stderr)
      })
      .run()

    return key
  }

  getPlaylist(filter: VideoFilter): Readable {
    let fileName = "playlist.m3u8"
    if (filter.resolution) {
      fileName = `${filter.resolution}.m3u8`
    }
    const filePath = `${this.config.ourFileDir}/${filter.courseId}/${filter.id}/${fileName}`
    const readStream = fs.createReadStream(filePath)
    return readStream
  }
  getStream(filter: VideoFilter): Promise<Readable> {
    return new Promise((resolve, reject) => {
      const fileName = filter.streamFile!
      const filePath = `${this.config.ourFileDir}/${filter.courseId}/${filter.id}/${fileName}`
      const readStream = fs.createReadStream(filePath)
      readStream.on("error", (err: any) => {
        if ("code" in err && err.code === "ENOENT") {
          reject(new NotFoundErr("not found video"))
          return
        }
        reject(err)
      })
      readStream.on("open", () => {
        resolve(readStream)
      })
    })
  }
}
