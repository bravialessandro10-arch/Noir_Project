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
    console.log('🔄 Generating FINAL Aggregator Inputs (Sudoku + Merkle) for Prover.toml\n');

    // Initialize Barretenberg API
    console.log('[0] Initializing Barretenberg API...');
    const api = await Barretenberg.new({ threads: 8 });

    // ============================================================
    // 1. Load all circuits (3 Merkle + 3 Sudoku)
    // ============================================================
    console.log('[1] Loading circuits...');
    
    // Merkle Tree circuits
    const circuitDepth8 = JSON.parse(fs.readFileSync(`../merkle_depth8/target/merkle_depth8.json`, 'utf8'));
    const circuitDepth16 = JSON.parse(fs.readFileSync(`../merkle_depth16/target/merkle_depth16.json`, 'utf8'));
    const circuitDepth20 = JSON.parse(fs.readFileSync(`../merkle_depth20/target/merkle_depth20.json`, 'utf8'));
    
    // Sudoku circuits
    const circuit4x4 = JSON.parse(fs.readFileSync(`../Sudoku44/target/Sudoku44.json`, 'utf8'));
    const circuit9x9 = JSON.parse(fs.readFileSync(`../Sudoku99/target/Sudoku99.json`, 'utf8'));
    const circuit16x16 = JSON.parse(fs.readFileSync(`../Sudoku1616/target/Sudoku1616.json`, 'utf8'));

    console.log('✅ All circuits loaded');

    // ============================================================
    // 2. Setup backends
    // ============================================================
    console.log('[2] Setting up backends...');
    
    // Merkle backends
    const backendDepth8 = new UltraHonkBackend(circuitDepth8.bytecode, api);
    const backendDepth16 = new UltraHonkBackend(circuitDepth16.bytecode, api);
    const backendDepth20 = new UltraHonkBackend(circuitDepth20.bytecode, api);
    
    // Sudoku backends
    const backend4x4 = new UltraHonkBackend(circuit4x4.bytecode, api);
    const backend9x9 = new UltraHonkBackend(circuit9x9.bytecode, api);
    const backend16x16 = new UltraHonkBackend(circuit16x16.bytecode, api);

    console.log('✅ All backends ready');

    // ============================================================
    // 3. Generate inner proofs with verifierTarget: 'noir-recursive'
    // ============================================================
    console.log('[3] Generating inner proofs (this may take a while)...');
    
    // Load witnesses
    const witnessDepth8 = fs.readFileSync(`../merkle_depth8/target/merkle_depth8.gz`);
    const witnessDepth16 = fs.readFileSync(`../merkle_depth16/target/merkle_depth16.gz`);
    const witnessDepth20 = fs.readFileSync(`../merkle_depth20/target/merkle_depth20.gz`);
    const witness4x4 = fs.readFileSync(`../Sudoku44/target/Sudoku44.gz`);
    const witness9x9 = fs.readFileSync(`../Sudoku99/target/Sudoku99.gz`);
    const witness16x16 = fs.readFileSync(`../Sudoku1616/target/Sudoku1616.gz`);

    // Generate Merkle proofs
    console.log('   Generating Merkle Tree proofs...');
    const { proof: proofDepth8, publicInputs: pubDepth8 } = await backendDepth8.generateProof(
        witnessDepth8,
        { verifierTarget: 'noir-recursive' }
    );
    const { proof: proofDepth16, publicInputs: pubDepth16 } = await backendDepth16.generateProof(
        witnessDepth16,
        { verifierTarget: 'noir-recursive' }
    );
    const { proof: proofDepth20, publicInputs: pubDepth20 } = await backendDepth20.generateProof(
        witnessDepth20,
        { verifierTarget: 'noir-recursive' }
    );

    // Generate Sudoku proofs
    console.log('   Generating Sudoku proofs...');
    const { proof: proof4x4, publicInputs: pub4x4 } = await backend4x4.generateProof(
        witness4x4,
        { verifierTarget: 'noir-recursive' }
    );
    const { proof: proof9x9, publicInputs: pub9x9 } = await backend9x9.generateProof(
        witness9x9,
        { verifierTarget: 'noir-recursive' }
    );
    const { proof: proof16x16, publicInputs: pub16x16 } = await backend16x16.generateProof(
        witness16x16,
        { verifierTarget: 'noir-recursive' }
    );

    console.log('✅ All inner proofs generated');
    console.log('\n📊 Proof sizes:');
    console.log(`   Merkle Depth 8:  ${proofDepth8.length} bytes, ${pubDepth8.length} public inputs`);
    console.log(`   Merkle Depth 16: ${proofDepth16.length} bytes, ${pubDepth16.length} public inputs`);
    console.log(`   Merkle Depth 20: ${proofDepth20.length} bytes, ${pubDepth20.length} public inputs`);
    console.log(`   Sudoku 4x4:      ${proof4x4.length} bytes, ${pub4x4.length} public inputs`);
    console.log(`   Sudoku 9x9:      ${proof9x9.length} bytes, ${pub9x9.length} public inputs`);
    console.log(`   Sudoku 16x16:    ${proof16x16.length} bytes, ${pub16x16.length} public inputs`);

    // ============================================================
    // 4. Generate recursive proof artifacts
    // ============================================================
    console.log('\n[4] Generating recursive proof artifacts...');
    
    const artifactsDepth8 = await backendDepth8.generateRecursiveProofArtifacts(
        proofDepth8, pubDepth8.length, { verifierTarget: 'noir-recursive' }
    );
    const artifactsDepth16 = await backendDepth16.generateRecursiveProofArtifacts(
        proofDepth16, pubDepth16.length, { verifierTarget: 'noir-recursive' }
    );
    const artifactsDepth20 = await backendDepth20.generateRecursiveProofArtifacts(
        proofDepth20, pubDepth20.length, { verifierTarget: 'noir-recursive' }
    );
    const artifacts4x4 = await backend4x4.generateRecursiveProofArtifacts(
        proof4x4, pub4x4.length, { verifierTarget: 'noir-recursive' }
    );
    const artifacts9x9 = await backend9x9.generateRecursiveProofArtifacts(
        proof9x9, pub9x9.length, { verifierTarget: 'noir-recursive' }
    );
    const artifacts16x16 = await backend16x16.generateRecursiveProofArtifacts(
        proof16x16, pub16x16.length, { verifierTarget: 'noir-recursive' }
    );

    console.log('✅ Artifacts generated');

    // ============================================================
    // 5. Get verification keys and convert to fields
    // ============================================================
    console.log('[5] Converting VKs and proofs to fields...');
    
    // Get VKs
    const vkDepth8 = await backendDepth8.getVerificationKey();
    const vkDepth16 = await backendDepth16.getVerificationKey();
    const vkDepth20 = await backendDepth20.getVerificationKey();
    const vk4x4 = await backend4x4.getVerificationKey();
    const vk9x9 = await backend9x9.getVerificationKey();
    const vk16x16 = await backend16x16.getVerificationKey();

    // Convert to fields
    const vkDepth8Fields = vkToFields(vkDepth8);
    const vkDepth16Fields = vkToFields(vkDepth16);
    const vkDepth20Fields = vkToFields(vkDepth20);
    const vk4x4Fields = vkToFields(vk4x4);
    const vk9x9Fields = vkToFields(vk9x9);
    const vk16x16Fields = vkToFields(vk16x16);

    const proofDepth8Fields = proofToFields(proofDepth8);
    const proofDepth16Fields = proofToFields(proofDepth16);
    const proofDepth20Fields = proofToFields(proofDepth20);
    const proof4x4Fields = proofToFields(proof4x4);
    const proof9x9Fields = proofToFields(proof9x9);
    const proof16x16Fields = proofToFields(proof16x16);

    console.log('✅ Conversion complete');
    console.log('\n📊 Field counts:');
    console.log(`   VK Depth 8:  ${vkDepth8Fields.length} fields, Proof: ${proofDepth8Fields.length} fields`);
    console.log(`   VK Depth 16: ${vkDepth16Fields.length} fields, Proof: ${proofDepth16Fields.length} fields`);
    console.log(`   VK Depth 20: ${vkDepth20Fields.length} fields, Proof: ${proofDepth20Fields.length} fields`);
    console.log(`   VK 4x4:      ${vk4x4Fields.length} fields, Proof: ${proof4x4Fields.length} fields`);
    console.log(`   VK 9x9:      ${vk9x9Fields.length} fields, Proof: ${proof9x9Fields.length} fields`);
    console.log(`   VK 16x16:    ${vk16x16Fields.length} fields, Proof: ${proof16x16Fields.length} fields`);

    // ============================================================
    // 6. Generate Prover.toml content
    // ============================================================
    console.log('\n[6] Generating Prover.toml...');

    // Format arrays for TOML
    const formatArray = (arr) => `[${arr.map(x => `"${x}"`).join(', ')}]`;

    const proverToml = `# Auto-generated Prover.toml for FINAL aggregator circuit
# Contains 3 Merkle Tree proofs + 3 Sudoku proofs

# ============================================================
# MERKLE TREE PROOFS
# ============================================================

# Merkle Tree Depth 8
vk_depth8 = ${formatArray(vkDepth8Fields)}
proof_depth8 = ${formatArray(proofDepth8Fields)}
public_inputs_depth8 = ${formatArray(pubDepth8)}
key_hash_depth8 = "${artifactsDepth8.vkHash}"

# Merkle Tree Depth 16
vk_depth16 = ${formatArray(vkDepth16Fields)}
proof_depth16 = ${formatArray(proofDepth16Fields)}
public_inputs_depth16 = ${formatArray(pubDepth16)}
key_hash_depth16 = "${artifactsDepth16.vkHash}"

# Merkle Tree Depth 20
vk_depth20 = ${formatArray(vkDepth20Fields)}
proof_depth20 = ${formatArray(proofDepth20Fields)}
public_inputs_depth20 = ${formatArray(pubDepth20)}
key_hash_depth20 = "${artifactsDepth20.vkHash}"

# ============================================================
# SUDOKU PROOFS
# ============================================================

# Sudoku 4x4
vk_4x4 = ${formatArray(vk4x4Fields)}
proof_4x4 = ${formatArray(proof4x4Fields)}
public_inputs_4x4 = ${formatArray(pub4x4)}
key_hash_4x4 = "${artifacts4x4.vkHash}"

# Sudoku 9x9
vk_9x9 = ${formatArray(vk9x9Fields)}
proof_9x9 = ${formatArray(proof9x9Fields)}
public_inputs_9x9 = ${formatArray(pub9x9)}
key_hash_9x9 = "${artifacts9x9.vkHash}"

# Sudoku 16x16
vk_16x16 = ${formatArray(vk16x16Fields)}
proof_16x16 = ${formatArray(proof16x16Fields)}
public_inputs_16x16 = ${formatArray(pub16x16)}
key_hash_16x16 = "${artifacts16x16.vkHash}"
`;

    // Save to file (modify path as needed for your aggregator directory)
    const proverTomlPath = `../aggregatorMk_Sudoku/Prover.toml`;
    fs.writeFileSync(proverTomlPath, proverToml);
    console.log(`✅ Prover.toml saved to ${proverTomlPath}`);

    // ============================================================
    // Cleanup
    // ============================================================
    await backendDepth8.destroy();
    await backendDepth16.destroy();
    await backendDepth20.destroy();
    await backend4x4.destroy();
    await backend9x9.destroy();
    await backend16x16.destroy();

    console.log('\n✅ FINAL AGGREGATOR INPUTS GENERATED SUCCESSFULLY!');
    console.log('\n📋 Summary:');
    console.log('   - 3 Merkle Tree proofs (Depth 8, 16, 20)');
    console.log('   - 3 Sudoku proofs (4x4, 9x9, 16x16)');
    console.log('   - All ready for recursive verification');
    console.log('\n🚀 Next steps:');
    console.log('1. cd ../aggregatorMk_Sudoku');
    console.log('2. nargo execute');
    console.log('3. bb prove --scheme ultra_honk --verifier_target evm -b ./target/aggregatorMk_Sudoku.json -w ./target/aggregatorMk_Sudoku.gz -o ./target');

    process.exit(0);
}

main().catch(error => {
    console.error('\n❌ Error:', error.message);
    console.error(error.stack);
    process.exit(1);
});