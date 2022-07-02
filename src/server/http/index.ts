import express, { Request, Response, NextFunction } from "express"

export class HttpServer {
  public start() {
    const app = express()

    app.use("/", (req: Request, res: Response, next: NextFunction) => {
      res.send("Hello there")
    })

    app.listen("8080", () => {
      console.log("Listining on 8080")
    })
  }
}
