import fs from "fs"
import { Readable } from "stream"
import path from "path"
import ffmpeg from "fluent-ffmpeg"

export type VideoRepoFileConfig = {
  ourFileDir: string
}
export class VideoRepoFile {
  constructor(private config: VideoRepoFileConfig) {}

  store(r: Readable): string {
    const key = "thisisthekey"
    const outdir = this.config.ourFileDir
    const multipleResolution = [
      // {
      //   output: "1080p.m3u8",
      //   videoBitrate: "5000",
      //   audioBitrate: "192",
      //   size: "1920x1080",
      // },
      {
        output: "720p.m3u8",
        videoBitrate: "2400",
        audioBitrate: "128",
        size: "1280x720",
      },
      {
        output: "240p.m3u8",
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
      `-hls_enc_key_url ${key}.key`,
    ]
    const command = ffmpeg(r).videoCodec("libx264").audioCodec("aac")
    if (!fs.existsSync(outdir)) {
      fs.mkdirSync(outdir)
    }
    const playlistContent = fs.createWriteStream(`${outdir}/playlist.m3u8`, {
      encoding: "utf-8",
    })
    playlistContent.write(`#EXTM3U\n#EXT-X-VERSION:3\n`)
    multipleResolution.forEach((resolution) => {
      command
        .output(`${outdir}/${resolution.output}`, { end: false })
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

  get(id: string): Readable {
    const filePath = path.join(__dirname, "../../files/demo.txt")
    const readStream = fs.createReadStream(filePath)
    readStream.push(`${id}\n`)
    return readStream
  }
}
