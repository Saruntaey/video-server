import fs from "fs"

export class CsvLoader {
  constructor(private path: string) {}
  load(): string[][] {
    const rawData = fs.readFileSync(this.path, "utf-8")
    const rows = rawData.split("\n")
    const result: string[][] = []
    rows.forEach((row, idx) => {
      if (idx === 0) {
        // skip header
        return
      }
      result.push(row.split(",").map((d) => d.trim()))
    })
    return result
  }
}
