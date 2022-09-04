import "./bootstrap-paths"
import { HttpServerEvent } from "@server/http"
import { Bootstrap } from "@app/bootstrap"
import { Config } from "@app/config"
import { MongoClient } from "mongodb"

const exec = async () => {
  const config = new Config()
  const client = await MongoClient.connect(config.db.uri).catch((e) => {
    console.log("fail to connect mongodb:", e)
    process.exit(1)
  })
  const dbCnn = client.db(config.db.name)
  const bootstrap = new Bootstrap(config, dbCnn)
  const server = await bootstrap.server()
  server.start()
  server.on(HttpServerEvent.ServerClosed, async () => {
    // TODO should close mongo client after all process finish!
    await client.close()
    console.log("gracefully shudown...")
  })
}

exec()
