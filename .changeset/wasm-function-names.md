---
"@dxos/wa-sqlite": patch
---

Keep the wasm name section in `dist/` (`--profiling-funcs`), so DevTools profiles name SQLite's functions instead of `wasm-function[N]`. FTS5 is now a default define, and `dist/` is rebuilt with emsdk 4.0.23.
