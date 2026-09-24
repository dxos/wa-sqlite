// Applies src/libtextdecoder.js to already-built dist/*.mjs glue without an
// Emscripten rebuild.
//
// `make` links src/libtextdecoder.js with --js-library, which is the real fix.
// This script exists because the committed dist/ is what gets published, and
// rebuilding it with a different Emscripten or host changes the .wasm as well,
// so a prebuilt glue file can be brought in line with the library alone.
// It evaluates the library with a stub addToLibrary so the injected code is
// the library's own, and fails if the stock decoder declarations are missing.
//
// Usage: node scripts/patch-dist-textdecoder.mjs [dist/wa-sqlite*.mjs ...]

import { readFile, writeFile } from "node:fs/promises"
import vm from "node:vm"

const root = new URL("../", import.meta.url)

const loadLibrary = async () => {
  const source = await readFile(new URL("src/libtextdecoder.js", root), "utf8")
  const library = {}
  vm.runInNewContext(source, {
    addToLibrary: (entries) => Object.assign(library, entries),
  })
  return library
}

const DECODERS = [
  {
    name: "UTF8Decoder",
    stock: /var UTF8Decoder\s*=\s*new TextDecoder(\(\))?\s*;/,
  },
  {
    name: "UTF16Decoder",
    stock:
      /var UTF16Decoder\s*=\s*new TextDecoder\(\s*["']utf-16le["']\s*\)\s*;/,
  },
]

const patch = (glue, library) => {
  if (glue.includes("var boundedTextDecoder=")) {
    return glue
  }
  let patched = glue
  for (const { name, stock } of DECODERS) {
    if (!stock.test(patched)) {
      throw new Error(`stock ${name} declaration not found`)
    }
    patched = patched.replace(
      stock,
      () => `var ${name}=${library[`$${name}`]};`,
    )
  }
  // Declared once, ahead of the first decoder, as the linker emits it. The
  // source keeps its line breaks so its comments and ASI stay valid.
  const helper = `var boundedTextDecoder=${library.$boundedTextDecoder.toString()};`
  return patched.replace("var UTF8Decoder=", () => `${helper}var UTF8Decoder=`)
}

const files = process.argv.slice(2)
const targets = files.length
  ? files.map((file) => new URL(file, `file://${process.cwd()}/`))
  : ["wa-sqlite.mjs", "wa-sqlite-async.mjs", "wa-sqlite-jspi.mjs"].map(
      (file) => new URL(`dist/${file}`, root),
    )

const library = await loadLibrary()
for (const target of targets) {
  const glue = await readFile(target, "utf8")
  const patched = patch(glue, library)
  if (patched === glue) {
    console.log(`${target.pathname}: already patched`)
  } else {
    await writeFile(target, patched)
    console.log(`${target.pathname}: patched`)
  }
}
