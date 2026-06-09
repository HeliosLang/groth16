use base64::prelude::*;
use serde::{Deserialize, Serialize};
use std::collections::BTreeMap;
use thiserror::Error;

pub const SUPPORTED_ARTIFACT_FORMAT: &str = "helios-groth16-bls12-381-v1";
pub const METADATA_ONLY_CONSTRAINT_FORMAT: &str =
    "helios-groth16-bls12-381-constraints-v1";
pub const PROOF_LENGTH: usize = 192;

#[derive(Debug, Error)]
pub enum EngineError {
    #[error("unsupported prover artifact format '{0}'")]
    UnsupportedArtifactFormat(String),

    #[error("unsupported constraint encoding '{0}'; compiler artifacts must include a concrete constraint system")]
    UnsupportedConstraintEncoding(String),

    #[error("invalid artifact: {0}")]
    InvalidArtifact(String),

    #[error("invalid json: {0}")]
    Json(#[from] serde_json::Error),

    #[error("invalid base64: {0}")]
    Base64(#[from] base64::DecodeError),
}

pub type Result<T> = std::result::Result<T, EngineError>;

pub fn setup(prover_json: &str) -> Result<String> {
    let prover: ProverArtifact = serde_json::from_str(prover_json)?;
    validate_prover(&prover)?;
    reject_metadata_only_constraints(&prover)?;

    Err(EngineError::UnsupportedConstraintEncoding(
        "unknown".to_string(),
    ))
}

pub fn prove(request_json: &str) -> Result<String> {
    let request: ProveRequest = serde_json::from_str(request_json)?;
    validate_prover(&request.prover)?;
    validate_witness_group(
        "public",
        &request.prover.schema.public_inputs,
        &request.witness.public,
    )?;
    validate_witness_group(
        "private",
        &request.prover.schema.private_inputs,
        &request.witness.private,
    )?;
    reject_metadata_only_constraints(&request.prover)?;

    Err(EngineError::UnsupportedConstraintEncoding(
        "unknown".to_string(),
    ))
}

pub fn verify(request_json: &str) -> Result<bool> {
    let request: VerifyRequest = serde_json::from_str(request_json)?;
    validate_prover(&request.prover)?;
    validate_witness_group(
        "public",
        &request.prover.schema.public_inputs,
        &request.public_inputs,
    )?;

    let proof = BASE64_STANDARD.decode(request.proof)?;

    if proof.len() != PROOF_LENGTH {
        return Ok(false);
    }

    reject_metadata_only_constraints(&request.prover)?;

    Err(EngineError::UnsupportedConstraintEncoding(
        "unknown".to_string(),
    ))
}

fn validate_prover(prover: &ProverArtifact) -> Result<()> {
    if prover.format != SUPPORTED_ARTIFACT_FORMAT {
        return Err(EngineError::UnsupportedArtifactFormat(prover.format.clone()));
    }

    if prover.proof.length != PROOF_LENGTH {
        return Err(EngineError::InvalidArtifact(format!(
            "proof length must be {PROOF_LENGTH}"
        )));
    }

    if prover.schema.proof.r#type != "ByteArray" {
        return Err(EngineError::InvalidArtifact(
            "proof schema must be ByteArray".to_string(),
        ));
    }

    Ok(())
}

fn reject_metadata_only_constraints(prover: &ProverArtifact) -> Result<()> {
    let bytes = BASE64_STANDARD.decode(&prover.constraints)?;
    let header: ConstraintHeader = serde_json::from_slice(&bytes)?;

    Err(EngineError::UnsupportedConstraintEncoding(header.format))
}

fn validate_witness_group(
    kind: &str,
    inputs: &[CircuitInput],
    values: &BTreeMap<String, String>,
) -> Result<()> {
    for input in inputs {
        if !values.contains_key(&input.name) {
            return Err(EngineError::InvalidArtifact(format!(
                "missing {kind} input '{}'",
                input.name
            )));
        }
    }

    for key in values.keys() {
        if !inputs.iter().any(|input| &input.name == key) {
            return Err(EngineError::InvalidArtifact(format!(
                "unknown {kind} input '{key}'"
            )));
        }
    }

    Ok(())
}

#[allow(dead_code)]
#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
struct ProverArtifact {
    name: String,
    format: String,
    circuit_id: String,
    constraints: String,
    schema: CircuitSchema,
    proving_key: Option<ProvingKey>,
    verification_key: Option<VerificationKey>,
    proof: ProofSchema,
}

#[allow(dead_code)]
#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
struct CircuitSchema {
    private_inputs: Vec<CircuitInput>,
    public_inputs: Vec<CircuitInput>,
    field_modulus: String,
    proof: ProofTypeSchema,
}

#[allow(dead_code)]
#[derive(Debug, Deserialize)]
struct CircuitInput {
    name: String,
    r#type: String,
}

#[derive(Debug, Deserialize)]
struct ProofTypeSchema {
    r#type: String,
}

#[allow(dead_code)]
#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
struct ProvingKey {
    encoding: String,
    bytes: Option<String>,
    hash: String,
}

#[derive(Debug, Deserialize, Serialize)]
#[serde(rename_all = "camelCase")]
struct VerificationKey {
    alpha_g1: String,
    beta_g2: String,
    gamma_g2: String,
    delta_g2: String,
    public_inputs_g1: Vec<String>,
}

#[allow(dead_code)]
#[derive(Debug, Deserialize)]
struct ProofSchema {
    encoding: String,
    length: usize,
    layout: String,
}

#[derive(Debug, Deserialize)]
struct ConstraintHeader {
    format: String,
}

#[derive(Debug, Deserialize)]
struct ProveRequest {
    prover: ProverArtifact,
    witness: CircuitWitness,
}

#[derive(Debug, Deserialize)]
struct CircuitWitness {
    public: BTreeMap<String, String>,
    private: BTreeMap<String, String>,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
struct VerifyRequest {
    prover: ProverArtifact,
    public_inputs: BTreeMap<String, String>,
    proof: String,
}
