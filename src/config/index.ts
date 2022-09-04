import "dotenv/config"

export class Config {
  public db: {
    uri: string
    name: string
  }
  public server: {
    port: string
    domain: string
  }
  public isAllownUploadVideo: boolean = false
  public isDev: boolean

  constructor() {
    this.db = {
      uri: this.ensure("MONGO_URI"),
      name: this.get("MONGO_DB_NAME", "testing"),
    }
    this.server = {
      port: this.get("PORT", "3000"),
      domain: this.get("DOMAIN", "localhost"),
    }
    this.isAllownUploadVideo = this.toBool(this.get("ALLOW_UPLOAD_VIDEO"))
    this.isDev = this.get("NODE_ENV") !== "production"
  }

  private ensure(env: string) {
    const v = process.env[env]
    if (!v) {
      throw new Error(`env ${env} is required`)
    }
    return v
  }

  private get(env: string, df = "") {
    return process.env[env] || df
  }

  private toBool(str: string) {
    return str.trim().toLocaleLowerCase() === "true"
  }
}
