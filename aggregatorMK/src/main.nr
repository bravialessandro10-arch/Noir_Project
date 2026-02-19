use bb_proof_verification::{UltraHonkZKProof, UltraHonkVerificationKey, verify_honk_proof};

fn main(
    // Merkle Tree Depth 8
    vk_depth8: UltraHonkVerificationKey,
    proof_depth8: UltraHonkZKProof,
    public_inputs_depth8: pub [Field; 1],  // Solo il root
    key_hash_depth8: Field,

    // Merkle Tree Depth 10
    vk_depth16: UltraHonkVerificationKey,
    proof_depth16: UltraHonkZKProof,
    public_inputs_depth16: pub [Field; 1],  // Solo il root
    key_hash_depth16: Field,

    // Merkle Tree Depth 12
    vk_depth20: UltraHonkVerificationKey,
    proof_depth20: UltraHonkZKProof,
    public_inputs_depth20: pub [Field; 1],  // Solo il root
    key_hash_depth20: Field
) {
    // Verify Depth 8 proof recursively (ZK)
    verify_honk_proof(vk_depth8, proof_depth8, public_inputs_depth8, key_hash_depth8);

    // Verify Depth 10 proof recursively (ZK)
    verify_honk_proof(vk_depth16, proof_depth16, public_inputs_depth16, key_hash_depth16);

    // Verify Depth 12 proof recursively (ZK)
    verify_honk_proof(vk_depth20, proof_depth20, public_inputs_depth20, key_hash_depth20);
}