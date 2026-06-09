export type {
  BytesLike,
  CircuitInput,
  CircuitWitness,
  ProofEngine,
  ProverArtifact,
  SetupCircuitResult,
  VerificationKey
} from "./types.js"

export {
  SUPPORTED_ARTIFACT_FORMAT,
  SUPPORTED_CONSTRAINT_FORMAT,
  SUPPORTED_PROOF_ENCODING,
  SUPPORTED_PROOF_LENGTH
} from "./constants.js"

export {
  isMetadataOnlyConstraintPayload,
  readConstraintHeader,
  validateProverArtifact,
  validatePublicInputs,
  validateWitness
} from "./validation.js"

import type { ProofEngine } from "./types.js"

export async function createProofEngine(): Promise<ProofEngine> {
  if (isNodeRuntime()) {
    return (await import("./node/index.js")).createProofEngine()
  }

  return (await import("./web/index.js")).createProofEngine()
}

function isNodeRuntime(): boolean {
  const processLike = (globalThis as { process?: { versions?: object } }).process

  return typeof processLike?.versions == "object"
}
