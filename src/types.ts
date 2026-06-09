export type BytesLike = string | Uint8Array

export type CircuitInput = {
  name: string
  type: string
}

export type VerificationKey = {
  alphaG1: BytesLike
  betaG2: BytesLike
  gammaG2: BytesLike
  deltaG2: BytesLike
  publicInputsG1: readonly BytesLike[]
}

export type ProverArtifact = {
  name: string
  format: "helios-groth16-bls12-381-v1"
  circuitId: string
  constraints: Uint8Array
  schema: {
    privateInputs: CircuitInput[]
    publicInputs: CircuitInput[]
    fieldModulus: string
    proof: { type: "ByteArray" }
  }
  provingKey?: {
    encoding: "arkworks-groth16-pk-v1"
    bytes?: Uint8Array | undefined
    hash: string
  }
  verificationKey?: VerificationKey | undefined
  proof: {
    encoding: "groth16-bls12-381-compact-v1"
    length: 192
    layout: "A:g1-compressed:48|B:g2-compressed:96|C:g1-compressed:48"
  }
}

export type CircuitWitness = {
  public: Record<string, bigint | number | string>
  private: Record<string, bigint | number | string>
}

export type SetupCircuitResult = {
  prover: ProverArtifact
  verificationKey: VerificationKey
}

export interface ProofEngine {
  setup(prover: ProverArtifact): Promise<SetupCircuitResult>
  prove(prover: ProverArtifact, witness: CircuitWitness): Promise<Uint8Array>
  verify(
    prover: ProverArtifact,
    publicInputs: CircuitWitness["public"],
    proof: Uint8Array
  ): Promise<boolean>
}
