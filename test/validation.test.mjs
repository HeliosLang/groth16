import { strictEqual, throws } from "node:assert"
import { test } from "node:test"

import {
  isMetadataOnlyConstraintPayload,
  validatePublicInputs,
  validateWitness
} from "../dist/index.js"

const encoder = new TextEncoder()

function makeArtifact() {
  return {
    name: "main::prove_factors",
    format: "helios-groth16-bls12-381-v1",
    circuitId: "compiler-fnv1a64:0000000000000000",
    constraints: encoder.encode(
      JSON.stringify({
        format: "helios-groth16-bls12-381-constraints-v1",
        name: "main::prove_factors"
      })
    ),
    schema: {
      privateInputs: [
        { name: "p", type: "Int" },
        { name: "q", type: "Int" }
      ],
      publicInputs: [{ name: "n", type: "Int" }],
      fieldModulus:
        "52435875175126190479447740508185965837690552500527637822603658699938581184513",
      proof: { type: "ByteArray" }
    },
    proof: {
      encoding: "groth16-bls12-381-compact-v1",
      length: 192,
      layout: "A:g1-compressed:48|B:g2-compressed:96|C:g1-compressed:48"
    }
  }
}

test("detects current metadata-only constraint payload", () => {
  strictEqual(isMetadataOnlyConstraintPayload(makeArtifact()), true)
})

test("validates complete witness", () => {
  validateWitness(makeArtifact(), {
    public: { n: 15n },
    private: { p: 3n, q: 5n }
  })
})

test("rejects missing witness fields", () => {
  throws(() =>
    validateWitness(makeArtifact(), {
      public: { n: 15n },
      private: { p: 3n }
    })
  )
})

test("validates public inputs separately", () => {
  validatePublicInputs(makeArtifact(), { n: 15n })
})
