import fs from "fs"

export class CsvLoader {
  constructor(private path: string) {}
  load(opt?: { includeFirstRow?: boolean }): string[][] {
    const rawData = fs.readFileSync(this.path, "utf-8")
    const rows = rawData.split("\n")
    const result: string[][] = []
    rows.forEach((row, idx) => {
      if (!row || (idx === 0 && !opt?.includeFirstRow)) {
        // skip header && empty row
        return
      }
      result.push(row.split(",").map((d) => d.trim()))
    })
    return result
  }
}
