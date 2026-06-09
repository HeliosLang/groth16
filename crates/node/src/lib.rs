use napi_derive::napi;

#[napi]
pub fn setup(prover_json: String) -> napi::Result<String> {
    helios_groth16_core::setup(&prover_json).map_err(to_napi_error)
}

#[napi]
pub fn prove(request_json: String) -> napi::Result<String> {
    helios_groth16_core::prove(&request_json).map_err(to_napi_error)
}

#[napi]
pub fn verify(request_json: String) -> napi::Result<bool> {
    helios_groth16_core::verify(&request_json).map_err(to_napi_error)
}

fn to_napi_error(error: helios_groth16_core::EngineError) -> napi::Error {
    napi::Error::from_reason(error.to_string())
}
