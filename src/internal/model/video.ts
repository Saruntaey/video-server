export type VideoEncryptInput = {
  courseId: string
}

export type VideoFilter = {
  id: string
  courseId: string
  resolution?: string
}

export type VideoDetail = {
  id: string
  courseId: string
  key: string
}
