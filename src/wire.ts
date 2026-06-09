import { base64ToBytes, bytesToBase64 } from "./base64.js"
import type {
  BytesLike,
  CircuitWitness,
  ProverArtifact,
  SetupCircuitResult,
  VerificationKey
} from "./types.js"

export type WireProverArtifact = Omit<
  ProverArtifact,
  "constraints" | "provingKey" | "verificationKey"
> & {
  constraints: string
  provingKey?: {
    encoding: "arkworks-groth16-pk-v1"
    bytes?: string | undefined
    hash: string
  }
  verificationKey?: WireVerificationKey | undefined
}

export type WireVerificationKey = {
  alphaG1: string
  betaG2: string
  gammaG2: string
  deltaG2: string
  publicInputsG1: readonly string[]
}

export type WireSetupCircuitResult = {
  prover: WireProverArtifact
  verificationKey: WireVerificationKey
}

export type WireProveRequest = {
  prover: WireProverArtifact
  witness: WireCircuitWitness
}

export type WireVerifyRequest = {
  prover: WireProverArtifact
  publicInputs: Record<string, string>
  proof: string
}

export type WireCircuitWitness = {
  public: Record<string, string>
  private: Record<string, string>
}

export function encodeProverArtifact(
  prover: ProverArtifact
): WireProverArtifact {
  const { constraints, provingKey, verificationKey, ...rest } = prover

  return {
    ...rest,
    constraints: bytesToBase64(constraints),
    ...(provingKey === undefined
      ? {}
      : {
          provingKey: {
            encoding: provingKey.encoding,
            hash: provingKey.hash,
            ...(provingKey.bytes === undefined
              ? {}
              : { bytes: bytesToBase64(provingKey.bytes) })
          }
        }),
    ...(verificationKey === undefined
      ? {}
      : { verificationKey: encodeVerificationKey(verificationKey) })
  }
}

export function decodeProverArtifact(
  prover: WireProverArtifact
): ProverArtifact {
  const { constraints, provingKey, verificationKey, ...rest } = prover

  return {
    ...rest,
    constraints: base64ToBytes(constraints),
    ...(provingKey === undefined
      ? {}
      : {
          provingKey: {
            encoding: provingKey.encoding,
            hash: provingKey.hash,
            ...(provingKey.bytes === undefined
              ? {}
              : { bytes: base64ToBytes(provingKey.bytes) })
          }
        }),
    ...(verificationKey === undefined
      ? {}
      : { verificationKey: decodeVerificationKey(verificationKey) })
  }
}

export function encodeVerificationKey(
  verificationKey: VerificationKey
): WireVerificationKey {
  return {
    alphaG1: encodeBytesLike(verificationKey.alphaG1),
    betaG2: encodeBytesLike(verificationKey.betaG2),
    gammaG2: encodeBytesLike(verificationKey.gammaG2),
    deltaG2: encodeBytesLike(verificationKey.deltaG2),
    publicInputsG1: verificationKey.publicInputsG1.map(encodeBytesLike)
  }
}

export function decodeVerificationKey(
  verificationKey: WireVerificationKey
): VerificationKey {
  return verificationKey
}

export function encodeWitness(witness: CircuitWitness): WireCircuitWitness {
  return {
    public: encodeWitnessGroup(witness.public),
    private: encodeWitnessGroup(witness.private)
  }
}

export function encodePublicInputs(
  publicInputs: CircuitWitness["public"]
): Record<string, string> {
  return encodeWitnessGroup(publicInputs)
}

export function decodeSetupCircuitResult(
  result: WireSetupCircuitResult
): SetupCircuitResult {
  return {
    prover: decodeProverArtifact(result.prover),
    verificationKey: decodeVerificationKey(result.verificationKey)
  }
}

function encodeBytesLike(bytes: BytesLike): string {
  return typeof bytes == "string" ? bytes : bytesToBase64(bytes)
}

function encodeWitnessGroup(
  values: Record<string, bigint | number | string>
): Record<string, string> {
  return Object.fromEntries(
    Object.entries(values).map(([key, value]) => [key, value.toString()])
  )
}
