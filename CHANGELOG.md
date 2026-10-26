# @effect/wa-sqlite

## 0.2.2

### Patch Changes

- [`be69e52`](https://github.com/dxos/wa-sqlite/commit/be69e52d1ebb6ba8784c4833955d05f7878c8844) Keep the wasm name section in `dist/` (`--profiling-funcs`), so DevTools profiles name SQLite's functions instead of `wasm-function[N]`. FTS5 is now a default define, and `dist/` is rebuilt with emsdk 4.0.23.
- [`c71bf7a`](https://github.com/dxos/wa-sqlite/commit/c71bf7a163fbfb282e65a8f83664dac1a44bfc56) Bound Emscripten's TextDecoders under Safari 18's per-instance cap.

## 0.2.1

### Patch Changes

- [`a1ac0e9`](https://github.com/Effect-TS/wa-sqlite/commit/a1ac0e99a4249f8ed6a2555155fe58346718ced7) Thanks [@tim-smart](https://github.com/tim-smart)! - rebase

## 0.1.1

### Patch Changes

- [`261bb21`](https://github.com/Effect-TS/wa-sqlite/commit/261bb21bedbd233721446c1a6af23beb78da65d4) Thanks [@tim-smart](https://github.com/tim-smart)! - fix type exports

## 0.1.0

### Minor Changes

- [`2969da5`](https://github.com/Effect-TS/wa-sqlite/commit/2969da5309bd540a55eff971d7f579e6cc1a17a7) Thanks [@tim-smart](https://github.com/tim-smart)! - initial release
