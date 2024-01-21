import "../../bootstrap-paths"
import fs from "fs"
import ffmpeg from "fluent-ffmpeg"
import { CsvLoader } from "@script/utils/csv-loader"

// const config = {
//   csvInputPath: "log/law/2023-10-30T19:39:30.167Z_success.csv",
//   csvOutputPath: "log/law/2023-10-30T19:39:30.167Z_success-with-dration.csv",
//   videoDir: "videosrc/law",
// }

const config = {
  csvInputPath: "log/math/2023-10-31T14:46:07.776Z_success.csv",
  csvOutputPath: "log/math/2023-10-31T14:46:07.776Z_success-with-dration.csv",
  videoDir: "videosrc/math",
}

enum Col {
  videoId,
  videoName,
  groupId,
  key,
  duration,
}

const extractDurationInSecond = (path: string) => {
  return new Promise<number>((resolve, reject) => {
    ffmpeg.ffprobe(path, (err, metadata) => {
      if (err) {
        reject(err)
      } else {
        resolve(metadata.format.duration ?? 0)
      }
    })
  })
}

const main = async () => {
  const csvLoader = new CsvLoader(config.csvInputPath)
  const f = fs.createWriteStream(config.csvOutputPath, { encoding: "utf-8" })
  const record = csvLoader.load({ includeFirstRow: true })

  for (let idx = 0; idx < record.length; idx++) {
    const row = record[idx]
    const durationInSecond = await extractDurationInSecond(
      `${config.videoDir}/${row[Col.videoName]}`,
    )
    f.write(`${row.join(",")},${durationInSecond * 1e9}\n`)
  }

  f.close()
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
