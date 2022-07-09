export type VideoEncryptInput = {
  videoName: string
  courseId: string
}

export type VideoFilter = {
  id: string
  courseId: string
  resolution?: string
  streamFile?: string
}

export type VideoDetail = {
  id: string
  videoName: string
  courseId: string
  key: string
}
