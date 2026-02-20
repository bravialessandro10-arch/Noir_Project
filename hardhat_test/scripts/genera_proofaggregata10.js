const { UltraHonkBackend, Barretenberg } = require('@aztec/bb.js');
const fs = require('fs');

// Helper function to convert proof to fields
function proofToFields(proof) {
  const fields = [];
  for (let i = 0; i < proof.length; i += 32) {
    const chunk = proof.slice(i, i + 32);
    fields.push('0x' + Buffer.from(chunk).toString('hex'));
  }
  return fields;
}

// Helper function to convert VK to fields
function vkToFields(vk) {
  const fields = [];
  for (let i = 0; i < vk.length; i += 32) {
    const chunk = vk.slice(i, i + 32);
    fields.push('0x' + Buffer.from(chunk).toString('hex'));
  }
  return fields;
}

async function main() {
    console.log(' Generating Aggregator Inputs for 10x 4x4 Sudoku Proofs\n');

    // Initialize Barretenberg API
    console.log('[0] Initializing Barretenberg API...');
    const api = await Barretenberg.new({ threads: 8 });

    // 1. Load circuit (solo 4x4)
    const circuit4x4 = JSON.parse(fs.readFileSync(`../Sudoku44/target/Sudoku44.json`, 'utf8'));

    // 2. Setup backend
    console.log('[1] Setup backend...');
    const backend4x4 = new UltraHonkBackend(circuit4x4.bytecode, api);

    // 3. Carica il witness
    const witness4x4 = fs.readFileSync(`../Sudoku44/target/Sudoku44.gz`);

    // Arrays per salvare le prove
    const proofs = [];
    const publicInputs = [];
    const artifacts = [];

    // 4. Genera 10 prove
    console.log('[2] Generating 10 inner proofs...');
    
    for (let i = 0; i < 10; i++) {
        console.log(`   Generating proof ${i + 1}/10...`);
        
        // Genera la prova
        const { proof, publicInputs: pubInputs } = await backend4x4.generateProof(
            witness4x4,
            { verifierTarget: 'noir-recursive' }
        );
        
        // Genera artifacts ricorsivi
        const artifact = await backend4x4.generateRecursiveProofArtifacts(
            proof,
            pubInputs.length,
            { verifierTarget: 'noir-recursive' }
        );
        
        proofs.push(proof);
        publicInputs.push(pubInputs);
        artifacts.push(artifact);
    }

    console.log(' All 10 inner proofs generated');
    console.log(`   Proof size: ${proofs[0].length} bytes`);
    console.log(`   Public inputs: ${publicInputs[0].length} fields (should be 16 for 4x4)`);

    // 5. Get VK (uguale per tutte le prove)
    console.log('[3] Getting verification key...');
    const vk = await backend4x4.getVerificationKey();
    const vkFields = vkToFields(vk);

    // 6. Converti tutte le prove in fields
    console.log('[4] Converting to fields...');
    const proofFields = proofs.map(p => proofToFields(p));

    console.log(`   VK size: ${vkFields.length} fields`);
    console.log(`   Each proof size: ${proofFields[0].length} fields`);
    console.log(`   Key hash: ${artifacts[0].vkHash}`);

    // 10. Generate Prover.toml content
    console.log('[5] Generating Prover.toml...');

    // Format arrays for TOML
    const formatArray = (arr) => `[${arr.map(x => `"${x}"`).join(', ')}]`;

    // Crea array di 10 VK (tutte uguali)
    const vkProofsArray = Array(10).fill(vkFields);
    
    // Array di key hashes (tutti uguali)
    const keyHashesArray = artifacts.map(a => a.vkHash);

    const proverToml = `# Auto-generated Prover.toml for aggregator circuit (10x 4x4 Sudoku)

# Array di 10 verification keys (tutte uguali per 4x4)
vk_proofs = [
${vkProofsArray.map(vk => `  ${formatArray(vk)}`).join(',\n')}
]

# Array di 10 proofs
proofs = [
${proofFields.map(proof => `  ${formatArray(proof)}`).join(',\n')}
]

# Array di 10 public inputs (ogni elemento è un array di 16 fields per 4x4)
public_inputs = [
${publicInputs.map(pub => `  ${formatArray(pub)}`).join(',\n')}
]

# Array di 10 key hashes (tutti uguali)
key_hashes = ${formatArray(keyHashesArray)}
`;

    const proverTomlPath = `../aggregator10/Prover.toml`;
    fs.writeFileSync(proverTomlPath, proverToml);
    console.log(` Prover.toml saved to ${proverTomlPath}`);

    console.log('\n AGGREGATOR INPUTS GENERATED SUCCESSFULLY!');
    console.log('\nNext steps:');
    console.log('1. cd ../aggregator');
    console.log('2. nargo execute');
    console.log('3. bb prove --verifier_target evm --write_vk -b ./target/aggregator.json -w ./target/aggregator.gz -o ./target/proof');
    console.log('4. bb write_solidity_verifier --verifier_target evm -k ./target/proof/vk -o ./target/Verifier.sol');

    process.exit(0);
}

main().catch(error => {
    console.error('\n Error:', error.message);
    console.error(error.stack);
    process.exit(1);
});