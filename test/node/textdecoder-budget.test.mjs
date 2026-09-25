// Regression test for Safari 18's per-instance TextDecoder byte cap.
//
// WebKit safari-7619 to safari-7621 counts bytes across every decode() call on
// one TextDecoder and throws a message-less RangeError on every call once the
// total passes 2^31 - 1. This installs a TextDecoder with that behaviour and
// reads more than 2 GiB of text out of SQLite through each built module.
//
// Run with `pnpm test-node`.

import { readFile } from "node:fs/promises"
import { test } from "node:test"
import assert from "node:assert/strict"

import * as SQLite from "../../src/sqlite-api.js"

const WEBKIT_DECODE_CAP = 2 ** 31 - 1
const ROW_BYTES = 64 * 1024 * 1024
const QUERIES = Math.ceil((WEBKIT_DECODE_CAP + 1) / ROW_BYTES) + 1

const NativeTextDecoder = globalThis.TextDecoder

class CappedTextDecoder extends NativeTextDecoder {
  #decoded = 0

  decode(input, options) {
    this.#decoded += input ? input.byteLength : 0
    if (this.#decoded > WEBKIT_DECODE_CAP) {
      throw new RangeError()
    }
    return super.decode(input, options)
  }
}

const BUILDS = [
  { name: "wa-sqlite", supported: true },
  { name: "wa-sqlite-async", supported: true },
  {
    name: "wa-sqlite-jspi",
    supported: typeof WebAssembly.Suspending === "function",
  },
]

for (const build of BUILDS) {
  test(
    `${build.name} decodes past the WebKit per-decoder cap`,
    { skip: !build.supported && "no JSPI" },
    async () => {
      const distUrl = new URL(`../../dist/${build.name}`, import.meta.url)
      const { default: SQLiteESMFactory } = await import(`${distUrl}.mjs`)
      const wasmBinary = await readFile(new URL(`${distUrl}.wasm`))

      // The glue constructs its decoders while the module is being created.
      globalThis.TextDecoder = CappedTextDecoder
      let module
      try {
        module = await SQLiteESMFactory({ wasmBinary })
      } finally {
        globalThis.TextDecoder = NativeTextDecoder
      }

      const sqlite3 = SQLite.Factory(module)
      const db = sqlite3.open_v2(":memory:")
      try {
        const sql = `SELECT printf('%.*c', ${ROW_BYTES}, 'x')`
        for (let query = 0; query < QUERIES; query++) {
          let text
          try {
            text = sqlite3.exec(db, sql)[0][0]
          } catch (error) {
            throw new Error(
              `query ${query} failed after ${query * ROW_BYTES} decoded bytes`,
              { cause: error },
            )
          }
          assert.equal(
            text.length,
            ROW_BYTES,
            `query ${query} returned a truncated string`,
          )
        }
      } finally {
        sqlite3.close(db)
      }
    },
  )
}
