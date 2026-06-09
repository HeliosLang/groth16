# groth16

Standalone proof engine for Helios circuit artifacts.

The public TypeScript API is intentionally generic:

```ts
import { createProofEngine } from "@helios-lang/groth16/node"

const engine = await createProofEngine()
const setup = await engine.setup(proverArtifact)
const proof = await engine.prove(setup.prover, {
  public: { n: 15n },
  private: { p: 3n, q: 5n }
})
const ok = await engine.verify(setup.prover, { n: 15n }, proof)
```

The package is standalone and does not import other `@helios-lang/*` packages.
The implementation validates the current compiler artifact contract and exposes
native Node and browser WASM entrypoints:

- `@helios-lang/groth16/node`
- `@helios-lang/groth16/web`

Build commands:

- `pnpm run build:ts`
- `pnpm run build:native`
- `pnpm run build:wasm` requires `wasm-pack`

Current `compiler-v2` artifacts contain metadata-only constraints. The engine
therefore rejects setup/prove calls with a clear unsupported-constraint error
until compiler artifacts include a concrete constraint system.
