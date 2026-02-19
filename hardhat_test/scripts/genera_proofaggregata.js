const { UltraHonkBackend, Barretenberg } = require('@aztec/bb.js');  // ← Aggiungi Barretenberg
const { Noir } = require('@noir-lang/noir_js');
const fs = require('fs');

// Helper function per convertire proof a fields (come nell'esempio)
function proofToFields(proof) {
  const fields = [];
  for (let i = 0; i < proof.length; i += 32) {
    const chunk = proof.slice(i, i + 32);
    fields.push('0x' + Buffer.from(chunk).toString('hex'));
  }
  return fields;
}

// Helper per convertire VK a fields (come nell'esempio)
function vkToFields(vk) {
  const fields = [];
  for (let i = 0; i < vk.length; i += 32) {
    const chunk = vk.slice(i, i + 32);
    fields.push('0x' + Buffer.from(chunk).toString('hex'));
  }
  return fields;
}

async function main() {
    console.log('🔄 Generazione Proof Aggregata \n');

    // ⭐ AGGIUNGI QUESTO - Inizializza l'API Barretenberg
    console.log('[0] Inizializzazione Barretenberg API...');
    const api = await Barretenberg.new({ threads: 1 });
    
    // 1. Carica circuiti
    const circuit4x4 = JSON.parse(fs.readFileSync('../Sudoku44/target/Sudoku44.json', 'utf8'));
    const circuit9x9 = JSON.parse(fs.readFileSync('../Sudoku99/target/Sudoku99.json', 'utf8'));
    const aggregatorCircuit = JSON.parse(fs.readFileSync('../aggregator/target/aggregator.json', 'utf8'));
    
    // 2. Backend INNER (senza opzioni recursive, usa verifierTarget invece)
    console.log('[1] Setup inner backends...');
    const backend4x4 = new UltraHonkBackend(circuit4x4.bytecode, api);
    const backend9x9 = new UltraHonkBackend(circuit9x9.bytecode, api);
    
    // 3. Genera proof INNER con verifierTarget
    console.log('[2] Generating inner proofs...');
    const witness4x4 = fs.readFileSync('../Sudoku44/target/Sudoku44.gz');
    const witness9x9 = fs.readFileSync('../Sudoku99/target/Sudoku99.gz');
    
    // ⭐ CHIAVE: Specifica verifierTarget: 'noir-recursive-no-zk'
    const { proof: proof4x4, publicInputs: pub4x4 } = await backend4x4.generateProof(
        witness4x4, 
        { verifierTarget: 'noir-recursive-no-zk' }
    );
    const { proof: proof9x9, publicInputs: pub9x9 } = await backend9x9.generateProof(
        witness9x9, 
        { verifierTarget: 'noir-recursive-no-zk' }
    );
    
    console.log('✅ Inner proofs generated');
    console.log(`   4x4 proof size: ${proof4x4.length} bytes`);
    console.log(`   9x9 proof size: ${proof9x9.length} bytes`);
    
    // 4. Genera artifacts con verifierTarget
    console.log('[3] Generating recursive proof artifacts...');
    const artifacts4x4 = await backend4x4.generateRecursiveProofArtifacts(
        proof4x4, 
        pub4x4.length,
        { verifierTarget: 'noir-recursive-no-zk' }  // ⭐ CHIAVE
    );
    const artifacts9x9 = await backend9x9.generateRecursiveProofArtifacts(
        proof9x9, 
        pub9x9.length,
        { verifierTarget: 'noir-recursive-no-zk' }  // ⭐ CHIAVE
    );
    
    // 5. Converti VK e proof a fields (come nell'esempio)
    console.log('[4] Converting to fields...');
    const vk4x4 = await backend4x4.getVerificationKey();
    const vk9x9 = await backend9x9.getVerificationKey();
    
    const vk4x4Fields = vkToFields(vk4x4);
    const vk9x9Fields = vkToFields(vk9x9);
    
    const proof4x4Fields = proofToFields(proof4x4);  // ⭐ Usa helper custom
    const proof9x9Fields = proofToFields(proof9x9);  // ⭐ Usa helper custom
    
    console.log(`   VK 4x4 size: ${vk4x4Fields.length} fields`);
    console.log(`   Proof 4x4 size: ${proof4x4Fields.length} fields`);
    console.log(`   VK 9x9 size: ${vk9x9Fields.length} fields`);
    console.log(`   Proof 9x9 size: ${proof9x9Fields.length} fields`);
    
    console.log(`   key_hash 4x4: ${artifacts4x4.vkHash.substring(0, 20)}...`);
    console.log(`   key_hash 9x9: ${artifacts9x9.vkHash.substring(0, 20)}...`);
    
    // 6. Prepara inputs aggregator
    const aggregatorInputs = {
        vk_4x4: vk4x4Fields,
        proof_4x4: proof4x4Fields,
        public_inputs_4x4: pub4x4,
        key_hash_4x4: artifacts4x4.vkHash,
        
        vk_9x9: vk9x9Fields,
        proof_9x9: proof9x9Fields,
        public_inputs_9x9: pub9x9,
        key_hash_9x9: artifacts9x9.vkHash
    };
    
    // 7. Backend aggregator
    console.log('[5] Setup aggregator backend...');

    // ⭐ Crea API dedicata con più memoria per aggregator
const aggregatorApi = await Barretenberg.new({ threads: 8 });

const aggregatorBackend = new UltraHonkBackend(aggregatorCircuit.bytecode, aggregatorApi);
    
    // 8. Genera witness
    console.log('[6] Generating aggregator witness...');
    const aggregatorNoir = new Noir(aggregatorCircuit);
    const { witness: aggWitness } = await aggregatorNoir.execute(aggregatorInputs);
    console.log('✅ Witness generated');
    
    // 9. Genera proof aggregata con verifierTarget: evm
    console.log('[7] Generating aggregated proof...');
    const { proof: aggProof, publicInputs: aggPub } = await aggregatorBackend.generateProof(
        aggWitness,
        { verifierTarget: 'evm' }  // ⭐ FINALE = evm
    );
    console.log('✅ Aggregated proof generated');
    console.log(`   Proof size: ${aggProof.length} bytes ⭐`);
    
    // 10. Verifica locale
    console.log('\n[8] Verifying locally...');
    const verified = await aggregatorBackend.verifyProof(
        { proof: aggProof, publicInputs: aggPub },
        { verifierTarget: 'evm' }
    );
    
    console.log(`   Result: ${verified ? '✅ VERIFIED' : '❌ FAILED'}`);
    
    if (!verified) {
        console.error('❌ Verifica locale fallita!');
        process.exit(1);
    }
    
    // 11. Salva file
    console.log('\n[9] Saving files...');
    fs.writeFileSync('../aggregator/target/proof', aggProof);
    const proofHex = '0x' + Buffer.from(aggProof).toString('hex');
    fs.writeFileSync('../aggregator/target/proof_hex.txt', proofHex);
    fs.writeFileSync('../aggregator/target/public_inputs.json', JSON.stringify(aggPub));
    const pubInputsArray = `[${aggPub.map(x => `"${x}"`).join(', ')}]`;
    fs.writeFileSync('../aggregator/target/public_inputs_array.txt', pubInputsArray);
    
    console.log('💾 Files salvati');
    
    // Cleanup
    await backend4x4.destroy();
    await backend9x9.destroy();
    await aggregatorBackend.destroy();
    
    console.log('\n✅ PROOF AGGREGATA GENERATA CON SUCCESSO!');
    process.exit(0);
}

main().catch(error => {
    console.error('\n❌ Errore:', error.message);
    console.error(error.stack);
    process.exit(1);
});   