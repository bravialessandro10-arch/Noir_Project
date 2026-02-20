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
    console.log(' Generating Merkle Aggregator Inputs for Prover.toml\n');

    // Initialize Barretenberg API
    console.log('[0] Initializing Barretenberg API...');
    const api = await Barretenberg.new({ threads: 8 });

    // 1. Load circuits
    console.log('[1] Loading merkle tree circuits...');
    const circuitDepth8 = JSON.parse(fs.readFileSync(`../merkle_depth8/target/merkle_depth8.json`, 'utf8'));
    const circuitDepth16 = JSON.parse(fs.readFileSync(`../merkle_depth16/target/merkle_depth16.json`, 'utf8'));
    const circuitDepth20 = JSON.parse(fs.readFileSync(`../merkle_depth20/target/merkle_depth20.json`, 'utf8'));

    // 2. Setup inner backends
    console.log('[2] Setting up inner backends...');
    const backendDepth8 = new UltraHonkBackend(circuitDepth8.bytecode, api);
    const backendDepth16 = new UltraHonkBackend(circuitDepth16.bytecode, api);
    const backendDepth20 = new UltraHonkBackend(circuitDepth20.bytecode, api);

    // 3. Generate inner proofs with verifierTarget
    console.log('[3] Generating inner proofs...');
    const witnessDepth8 = fs.readFileSync(`../merkle_depth8/target/merkle_depth8.gz`);
    const witnessDepth16 = fs.readFileSync(`../merkle_depth16/target/merkle_depth16.gz`);
    const witnessDepth20 = fs.readFileSync(`../merkle_depth20/target/merkle_depth20.gz`);

    // Specify verifierTarget: 'noir-recursive' (ZK variant)
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

    console.log(' Inner proofs generated');
    console.log(`   Depth 8 proof size: ${proofDepth8.length} bytes, public inputs: ${pubDepth8.length}`);
    console.log(`   Depth 16 proof size: ${proofDepth16.length} bytes, public inputs: ${pubDepth16.length}`);
    console.log(`   Depth 20 proof size: ${proofDepth20.length} bytes, public inputs: ${pubDepth20.length}`);

    // 4. Generate recursive proof artifacts
    console.log('[4] Generating recursive proof artifacts...');
    const artifactsDepth8 = await backendDepth8.generateRecursiveProofArtifacts(
        proofDepth8,
        pubDepth8.length,
        { verifierTarget: 'noir-recursive' }
    );
    const artifactsDepth16 = await backendDepth16.generateRecursiveProofArtifacts(
        proofDepth16,
        pubDepth16.length,
        { verifierTarget: 'noir-recursive' }
    );
    const artifactsDepth20 = await backendDepth20.generateRecursiveProofArtifacts(
        proofDepth20,
        pubDepth20.length,
        { verifierTarget: 'noir-recursive' }
    );

    // 5. Convert VK and proof to fields
    console.log('[5] Converting to fields...');
    const vkDepth8 = await backendDepth8.getVerificationKey();
    const vkDepth16 = await backendDepth16.getVerificationKey();
    const vkDepth20 = await backendDepth20.getVerificationKey();

    const vkDepth8Fields = vkToFields(vkDepth8);
    const vkDepth16Fields = vkToFields(vkDepth16);
    const vkDepth20Fields = vkToFields(vkDepth20);

    const proofDepth8Fields = proofToFields(proofDepth8);
    const proofDepth16Fields = proofToFields(proofDepth16);
    const proofDepth20Fields = proofToFields(proofDepth20);

    console.log(`   VK Depth 8 size: ${vkDepth8Fields.length} fields`);
    console.log(`   Proof Depth 8 size: ${proofDepth8Fields.length} fields`);
    console.log(`   VK Depth 16 size: ${vkDepth16Fields.length} fields`);
    console.log(`   Proof Depth 16 size: ${proofDepth16Fields.length} fields`);
    console.log(`   VK Depth 20 size: ${vkDepth20Fields.length} fields`);
    console.log(`   Proof Depth 20 size: ${proofDepth20Fields.length} fields`);

    console.log(`   key_hash Depth 8: ${artifactsDepth8.vkHash}`);
    console.log(`   key_hash Depth 16: ${artifactsDepth16.vkHash}`);
    console.log(`   key_hash Depth 20: ${artifactsDepth20.vkHash}`);

    // 6. Generate Prover.toml content
    console.log('[6] Generating Prover.toml...');

    // Format arrays for TOML
    const formatArray = (arr) => `[${arr.map(x => `"${x}"`).join(', ')}]`;

    const proverToml = `# Auto-generated Prover.toml for merkle aggregator circuit

# Merkle Tree Depth 8 inputs
vk_depth8 = ${formatArray(vkDepth8Fields)}
proof_depth8 = ${formatArray(proofDepth8Fields)}
public_inputs_depth8 = ${formatArray(pubDepth8)}
key_hash_depth8 = "${artifactsDepth8.vkHash}"

# Merkle Tree Depth 16 inputs
vk_depth16 = ${formatArray(vkDepth16Fields)}
proof_depth16 = ${formatArray(proofDepth16Fields)}
public_inputs_depth16 = ${formatArray(pubDepth16)}
key_hash_depth16 = "${artifactsDepth16.vkHash}"

# Merkle Tree Depth 20 inputs
vk_depth20 = ${formatArray(vkDepth20Fields)}
proof_depth20 = ${formatArray(proofDepth20Fields)}
public_inputs_depth20 = ${formatArray(pubDepth20)}
key_hash_depth20 = "${artifactsDepth20.vkHash}"
`;


    const proverTomlPath = `../aggregatorMK/Prover.toml`;
    fs.writeFileSync(proverTomlPath, proverToml);
    console.log(` Prover.toml saved to ${proverTomlPath}`);

    console.log('\n MERKLE AGGREGATOR INPUTS GENERATED SUCCESSFULLY!');
    console.log('\nNext steps:');
    console.log('1. cd ../aggregatorMK');
    console.log('2. nargo execute');
    console.log('3. bb prove --scheme ultra_honk --verifier_target evm --write_vk -b ./target/aggregatorMK.json -w ./target/aggregatorMK.gz -o ./target');

    process.exit(0);
}

main().catch(error => {
    console.error('\n Error:', error.message);
    console.error(error.stack);
    process.exit(1);
});