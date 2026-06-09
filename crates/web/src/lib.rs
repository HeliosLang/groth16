use wasm_bindgen::prelude::*;

#[wasm_bindgen]
pub fn setup(prover_json: String) -> Result<String, JsValue> {
    helios_groth16_core::setup(&prover_json).map_err(to_js_error)
}

#[wasm_bindgen]
pub fn prove(request_json: String) -> Result<String, JsValue> {
    helios_groth16_core::prove(&request_json).map_err(to_js_error)
}

#[wasm_bindgen]
pub fn verify(request_json: String) -> Result<bool, JsValue> {
    helios_groth16_core::verify(&request_json).map_err(to_js_error)
}

fn to_js_error(error: helios_groth16_core::EngineError) -> JsValue {
    JsValue::from_str(&error.to_string())
}
