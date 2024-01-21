import "../../bootstrap-paths"
import fs from "fs"
import path from "path"
import { VideoDetail } from "@model/video"
import { MongoClient } from "mongodb"

const domain = "https://video.sarun.work"
const courseId = "ea"

const exec = async () => {
  const client = await MongoClient.connect("mongodb://localhost:27017").catch(
    (err) => {
      console.log("fail to connect mongodb:", err)
      process.exit(1)
    },
  )
  const videos = await client
    .db("khampee")
    .collection<VideoDetail>("video-detail")
    .find(
      { courseId: courseId },
      { projection: { videoName: 1 }, sort: { videoName: 1 } },
    )
    .toArray()

  const logDir = path.join(__dirname, "logs")
  if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir)
  }
  const now = new Date()
  const writable = fs.createWriteStream(
    path.join(logDir, `video-uri_${courseId}_${now.toISOString()}.csv`),
  )
  writable.write("videoName,uri\n")
  videos.forEach((v) => {
    writable.write(
      `${v.videoName},${domain}/watch/courses/${courseId}/videos/${v._id}\n`,
    )
  })
  writable.end()
  client.close()
}

exec()
