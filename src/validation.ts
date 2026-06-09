import {
  SUPPORTED_ARTIFACT_FORMAT,
  SUPPORTED_CONSTRAINT_FORMAT,
  SUPPORTED_PROOF_ENCODING,
  SUPPORTED_PROOF_LENGTH
} from "./constants.js"
import type { CircuitWitness, ProverArtifact } from "./types.js"

export function validateProverArtifact(prover: ProverArtifact): void {
  if (prover.format != SUPPORTED_ARTIFACT_FORMAT) {
    throw new Error(`unsupported prover artifact format '${prover.format}'`)
  }

  if (!(prover.constraints instanceof Uint8Array)) {
    throw new Error("prover artifact constraints must be Uint8Array")
  }

  if (prover.proof.encoding != SUPPORTED_PROOF_ENCODING) {
    throw new Error(`unsupported proof encoding '${prover.proof.encoding}'`)
  }

  if (prover.proof.length != SUPPORTED_PROOF_LENGTH) {
    throw new Error(`unsupported proof length '${prover.proof.length}'`)
  }

  validateInputs("public", prover.schema.publicInputs)
  validateInputs("private", prover.schema.privateInputs)

  if (prover.schema.proof.type != "ByteArray") {
    throw new Error("proof schema must be ByteArray")
  }
}

export function validateWitness(
  prover: ProverArtifact,
  witness: CircuitWitness
): void {
  validateProverArtifact(prover)
  validateWitnessGroup("public", prover.schema.publicInputs, witness.public)
  validateWitnessGroup("private", prover.schema.privateInputs, witness.private)
}

export function validatePublicInputs(
  prover: ProverArtifact,
  publicInputs: CircuitWitness["public"]
): void {
  validateProverArtifact(prover)
  validateWitnessGroup("public", prover.schema.publicInputs, publicInputs)
}

export function readConstraintHeader(prover: ProverArtifact): {
  format: string
  name?: string
} {
  validateProverArtifact(prover)

  const text = new TextDecoder().decode(prover.constraints)
  const header = JSON.parse(text) as { format?: unknown; name?: unknown }

  if (typeof header.format != "string") {
    throw new Error("constraint payload is missing format")
  }

  return {
    format: header.format,
    ...(typeof header.name == "string" ? { name: header.name } : {})
  }
}

export function isMetadataOnlyConstraintPayload(prover: ProverArtifact): boolean {
  return readConstraintHeader(prover).format == SUPPORTED_CONSTRAINT_FORMAT
}

function validateInputs(kind: string, inputs: readonly { name: string }[]): void {
  const names = new Set<string>()

  for (const input of inputs) {
    if (input.name == "") {
      throw new Error(`${kind} input name cannot be empty`)
    }

    if (names.has(input.name)) {
      throw new Error(`duplicate ${kind} input '${input.name}'`)
    }

    names.add(input.name)
  }
}

function validateWitnessGroup(
  kind: string,
  inputs: readonly { name: string }[],
  values: Record<string, bigint | number | string>
): void {
  for (const input of inputs) {
    if (!(input.name in values)) {
      throw new Error(`missing ${kind} input '${input.name}'`)
    }
  }

  for (const key of Object.keys(values)) {
    if (!inputs.some((input) => input.name == key)) {
      throw new Error(`unknown ${kind} input '${key}'`)
    }
  }
}
