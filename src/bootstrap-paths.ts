const tsConfigPaths = require("tsconfig-paths")

tsConfigPaths.register({
  baseUrl: __dirname,
  paths: {
    "@port/*": ["./internal/port/*"],
    "@model/*": ["./internal/model/*"],
    "@service/*": ["./internal/service/*"],
    "@repo/*": ["./repo/*"],
    "@server/*": ["./server/*"],
  },
})
