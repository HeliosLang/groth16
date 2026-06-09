import { spawnSync } from "node:child_process"

const args = [
  "build",
  "crates/web",
  "--target",
  "web",
  "--out-dir",
  "../../dist/web/pkg"
]

const result = spawnSync("wasm-pack", args, { stdio: "inherit" })

if (result.error?.code == "ENOENT") {
  throw new Error(
    "wasm-pack is required for pnpm run build:wasm. Install it from https://rustwasm.github.io/wasm-pack/."
  )
}

if (result.error !== undefined) {
  throw result.error
}

if (result.status != 0) {
  process.exit(result.status ?? 1)
}
