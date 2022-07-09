import { Collection, Db } from "mongodb"
import { VideoDetail } from "@model/video"
import { MongoCollection } from "./mongo-collection"

type VideoDetailMongo = {
  _id: string
  videoName: string
  courseId: string
  key: string
}

export class VideoDetailRepoMongo {
  private collection: Collection<VideoDetailMongo>
  constructor(db: Db) {
    this.collection = db.collection(MongoCollection.VideoDetail)
  }

  async store(v: VideoDetail): Promise<void> {
    await this.collection.updateOne(
      { _id: v.id },
      { $set: { videoName: v.videoName, courseId: v.courseId, key: v.key } },
      {
        upsert: true,
      },
    )
  }

  async get(id: string): Promise<VideoDetail | null> {
    const v = await this.collection.findOne({ _id: id })
    if (!v) {
      return null
    }
    return {
      id: v._id,
      videoName: v.videoName,
      courseId: v.courseId,
      key: v.key,
    }
  }
}
