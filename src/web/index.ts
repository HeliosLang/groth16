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

type WasmBinding = {
  default?: () => Promise<unknown>
  setup(proverJson: string): string
  prove(requestJson: string): string
  verify(requestJson: string): boolean
}

export async function createProofEngine(): Promise<ProofEngine> {
  const binding = await loadWasmBinding()

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

async function loadWasmBinding(): Promise<WasmBinding> {
  const specifier = new URL("./pkg/helios_groth16_web.js", import.meta.url).href
  const dynamicImport = new Function(
    "specifier",
    "return import(specifier)"
  ) as (specifier: string) => Promise<unknown>
  const binding = (await dynamicImport(specifier)) as WasmBinding

  if (typeof binding.default == "function") {
    await binding.default()
  }

  return binding
}
