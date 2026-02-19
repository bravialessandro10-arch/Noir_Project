use bb_proof_verification::{UltraHonkZKProof, UltraHonkVerificationKey, verify_honk_proof};

fn main(
    // Array di 10 verification keys (tutte per 4x4)
    vk_proofs: [UltraHonkVerificationKey; 10],
    
    // Array di 10 proofs
    proofs: [UltraHonkZKProof; 10],
    
    // Array di 10 public inputs (ognuno con 16 field per 4x4)
    public_inputs: pub [[Field; 16]; 10],
    
    // Array di 10 key hashes
    key_hashes: [Field; 10]
) {
    // Verifica ricorsivamente tutte le 10 prove in un loop
    for i in 0..10 {
        verify_honk_proof(
            vk_proofs[i],
            proofs[i],
            public_inputs[i],
            key_hashes[i]
        );
    }
}