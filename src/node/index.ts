import { createRequire } from "node:module"
import type {
  CircuitWitness,
  ProofEngine,
  ProverArtifact
} from "../types.js"
import { base64ToBytes, bytesToBase64 } from "../base64.js"
import {
  decodeSetupCircuitResult,
  encodeProverArtifact,
  encodePublicInputs,
  encodeWitness,
  type WireSetupCircuitResult
} from "../wire.js"
import {
  validateProverArtifact,
  validatePublicInputs,
  validateWitness
} from "../validation.js"

type NativeBinding = {
  setup(proverJson: string): string
  prove(requestJson: string): string
  verify(requestJson: string): boolean
}

export async function createProofEngine(): Promise<ProofEngine> {
  const binding = loadNativeBinding()

  return {
    async setup(prover: ProverArtifact) {
      validateProverArtifact(prover)
      const response = binding.setup(JSON.stringify(encodeProverArtifact(prover)))
      return decodeSetupCircuitResult(
        JSON.parse(response) as WireSetupCircuitResult
      )
    },

    async prove(prover: ProverArtifact, witness: CircuitWitness) {
      validateWitness(prover, witness)
      const proof = binding.prove(
        JSON.stringify({
          prover: encodeProverArtifact(prover),
          witness: encodeWitness(witness)
        })
      )

      return base64ToBytes(proof)
    },

    async verify(
      prover: ProverArtifact,
      publicInputs: CircuitWitness["public"],
      proof: Uint8Array
    ) {
      validatePublicInputs(prover, publicInputs)
      return binding.verify(
        JSON.stringify({
          prover: encodeProverArtifact(prover),
          publicInputs: encodePublicInputs(publicInputs),
          proof: bytesToBase64(proof)
        })
      )
    }
  }
}

function loadNativeBinding(): NativeBinding {
  const require = createRequire(import.meta.url)

  try {
    return require("./helios_groth16_node.node") as NativeBinding
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)

    throw new Error(
      `failed to load native proof engine from dist/node/helios_groth16_node.node: ${message}`
    )
  }
}
