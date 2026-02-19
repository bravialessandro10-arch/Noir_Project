use bb_proof_verification::{UltraHonkZKProof, UltraHonkVerificationKey, verify_honk_proof};

fn main(
    // Merkle Tree Depth 8
    vk_depth8: UltraHonkVerificationKey,
    proof_depth8: UltraHonkZKProof,
    public_inputs_depth8: pub [Field; 1],  // Solo il root
    key_hash_depth8: Field,

    // Merkle Tree Depth 16
    vk_depth16: UltraHonkVerificationKey,
    proof_depth16: UltraHonkZKProof,
    public_inputs_depth16: pub [Field; 1],  // Solo il root
    key_hash_depth16: Field,

    // Merkle Tree Depth 20
    vk_depth20: UltraHonkVerificationKey,
    proof_depth20: UltraHonkZKProof,
    public_inputs_depth20: pub [Field; 1],  // Solo il root
    key_hash_depth20: Field,

    // Sudoku 4x4
    vk_4x4: UltraHonkVerificationKey,
    proof_4x4: UltraHonkZKProof,
    public_inputs_4x4: pub [Field; 16],
    key_hash_4x4: Field,

    // Sudoku 9x9
    vk_9x9: UltraHonkVerificationKey,
    proof_9x9: UltraHonkZKProof,
    public_inputs_9x9: pub [Field; 81],
    key_hash_9x9: Field,

    // Sudoku 16x16
    vk_16x16: UltraHonkVerificationKey,
    proof_16x16: UltraHonkZKProof,
    public_inputs_16x16: pub [Field; 256],
    key_hash_16x16: Field
) {
    // Verify Depth 8 proof recursively (ZK)
    verify_honk_proof(vk_depth8, proof_depth8, public_inputs_depth8, key_hash_depth8);

    // Verify Depth 10 proof recursively (ZK)
    verify_honk_proof(vk_depth16, proof_depth16, public_inputs_depth16, key_hash_depth16);

    // Verify Depth 12 proof recursively (ZK)
    verify_honk_proof(vk_depth20, proof_depth20, public_inputs_depth20, key_hash_depth20);

    // Verify 4x4 proof recursively (ZK)
    verify_honk_proof(vk_4x4, proof_4x4, public_inputs_4x4, key_hash_4x4);

    // Verify 9x9 proof recursively (ZK)
    verify_honk_proof(vk_9x9, proof_9x9, public_inputs_9x9, key_hash_9x9);
 
    // Verify 16x16 proof recursively (ZK)
    verify_honk_proof(vk_16x16, proof_16x16, public_inputs_16x16, key_hash_16x16);
}
