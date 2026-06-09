import { copyFileSync, existsSync, mkdirSync, readdirSync } from "node:fs"
import { basename, join, resolve } from "node:path"

const root = resolve(new URL("..", import.meta.url).pathname)
const releaseDir = join(root, "target", "release")
const outDir = join(root, "dist", "node")

mkdirSync(outDir, { recursive: true })

const candidates = readdirSync(releaseDir)
  .filter((name) => {
    return (
      name == "helios_groth16_node.node" ||
      name == "libhelios_groth16_node.so" ||
      name == "libhelios_groth16_node.dylib" ||
      name == "helios_groth16_node.dll"
    )
  })
  .map((name) => join(releaseDir, name))

const source = candidates.find((path) => existsSync(path))

if (source === undefined) {
  throw new Error(`native proof engine artifact not found in ${releaseDir}`)
}

copyFileSync(source, join(outDir, "helios_groth16_node.node"))
console.log(`copied ${basename(source)} to dist/node/helios_groth16_node.node`)
