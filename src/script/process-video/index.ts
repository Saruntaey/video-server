import "../../bootstrap-paths"
import { VideoProcesser } from "./video-processer"
import { VideoDetailLoaderCsv } from "./video-detail-loader"
import { CsvLoader } from "@script/utils/csv-loader"
import { VideoLoaderLocalStorage } from "./video-loader-local-storate"
import { VideoService } from "@service/video"
import { VideoRepoFile } from "@repo/video"
import path from "path"
import { FakeVideoDetailRepo } from "./fake-video-detail-repo"
// import { VideoDetailRepoMongo } from "@repo/video-detail"
// import { MongoClient } from "mongodb"

(async () => {
  // const client = await MongoClient.connect("mongodb://localhost:27017").catch(
  //   (err) => {
  //     console.log("fail to connect mongodb:", err)
  //     process.exit(1)
  //   },
  // )
  try {
    const csvLoader = new CsvLoader(path.join(__dirname, "videos.csv"))
    const videoDetailLoader = new VideoDetailLoaderCsv(csvLoader)
    const videoLoader = new VideoLoaderLocalStorage()
    const outFileDir = path.join(__dirname, "../../../files/videos")
    const videoRepo = new VideoRepoFile({ outFileDir })
    // const videoDetailRepo = new VideoDetailRepoMongo(client.db("khampee"))
    const videoDetailRepo = new FakeVideoDetailRepo()
    const videoService = new VideoService(videoRepo, videoDetailRepo)
    const videoProcesser = new VideoProcesser(
      videoDetailLoader,
      videoLoader,
      videoService,
    )
    await videoProcesser.run()
  } catch (err) {
    console.log("fail to process video:", err)
  } finally {
    // client.close()
  }
})()
