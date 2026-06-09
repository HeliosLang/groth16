# groth16

Standalone Groth16 proof engine for Helios circuit artifacts.

The package is standalone and does not import other `@helios-lang/*` packages.
It exposes the same TypeScript API through native Node and browser WASM
entrypoints:

- `@helios-lang/groth16/node`
- `@helios-lang/groth16/web`

The root entrypoint, `@helios-lang/groth16`, selects the Node implementation
when it is running in Node and otherwise selects the browser WASM
implementation.

## Usage

Create a proof engine, run setup for a compiler-produced prover artifact, prove
with named public and private inputs, then verify with the public inputs and the
proof bytes:

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

`setup` validates the artifact and returns a prover artifact that includes the
material needed by `prove` and `verify`, plus the verification key separately.
`prove` validates that every declared public and private input is present, that
no unknown input names were supplied, and returns a `Uint8Array` proof.
`verify` performs the same public input validation and returns a boolean.

## Prover Artifact Format

The proof engine consumes a `ProverArtifact` object. Binary fields are
`Uint8Array` values in TypeScript. When the artifact crosses the native/WASM
binding boundary, these fields are encoded as base64 strings internally.

```ts
type ProverArtifact = {
  name: string
  format: "helios-groth16-bls12-381-v1"
  circuitId: string
  constraints: Uint8Array
  schema: {
    privateInputs: { name: string; type: string }[]
    publicInputs: { name: string; type: string }[]
    fieldModulus: string
    proof: { type: "ByteArray" }
  }
  provingKey?: {
    encoding: "arkworks-groth16-pk-v1"
    bytes?: Uint8Array
    hash: string
  }
  verificationKey?: {
    alphaG1: string | Uint8Array
    betaG2: string | Uint8Array
    gammaG2: string | Uint8Array
    deltaG2: string | Uint8Array
    publicInputsG1: readonly (string | Uint8Array)[]
  }
  proof: {
    encoding: "groth16-bls12-381-compact-v1"
    length: 192
    layout: "A:g1-compressed:48|B:g2-compressed:96|C:g1-compressed:48"
  }
}
```

Important fields:

- `format` identifies the Helios Groth16 BLS12-381 artifact contract.
- `circuitId` is the stable identifier for the circuit the artifact belongs to.
- `constraints` contains the compiler-produced constraint payload.
- `schema.publicInputs` and `schema.privateInputs` define the required witness
  object keys. Input values may be `bigint`, `number`, or decimal strings.
- `schema.fieldModulus` records the field modulus used by the circuit.
- `provingKey` is optional before setup. After setup, the returned prover
  artifact is expected to contain proving material for `prove`.
- `verificationKey` is optional before setup. It is returned by setup and may
  also be embedded in the returned prover artifact.
- `proof` declares the proof byte encoding. The current compact proof is 192
  bytes: compressed `A` in G1, compressed `B` in G2, and compressed `C` in G1.

Witness objects are keyed by the names declared in the artifact schema:

```ts
type CircuitWitness = {
  public: Record<string, bigint | number | string>
  private: Record<string, bigint | number | string>
}
```

For the example above, the artifact must declare one public input named `n` and
two private inputs named `p` and `q`.

## Build

Build commands:

- `pnpm run build:ts`
- `pnpm run build:native`
- `pnpm run build:wasm` requires `wasm-pack`

## Current Constraint Support

Current `compiler-v2` artifacts contain metadata-only constraints. The engine
therefore rejects setup/prove calls with a clear unsupported-constraint error
until compiler artifacts include a concrete constraint system.
