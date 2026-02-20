import { expect } from "chai";
import { ethers } from "hardhat";
import * as fs from "fs";
import * as path from "path";

describe("HonkVerifier On-Chain Verification", function () {
  it("Verifica proof zk on-chain con metriche complete", async function () {
     let transcriptLib: any;
     let transcriptAddress: string;
     let verifier: any;
    
    console.log("\n=== Deploying Contracts ===");
    
    // Deploy library mancante (ZKTranscriptLib)
    const TranscriptLibFactory = await ethers.getContractFactory("contracts/Verifier9.sol:ZKTranscriptLib");
    transcriptLib = await TranscriptLibFactory.deploy();
    await transcriptLib.waitForDeployment();
    transcriptAddress = await transcriptLib.getAddress();
    
    // Gas per deploy della library
    const transcriptDeployTx = transcriptLib.deploymentTransaction();
    const transcriptReceipt = await transcriptDeployTx?.wait();
    const transcriptGas = transcriptReceipt?.gasUsed || 0n;
    
    console.log(`✅ ZKTranscriptLib deployed at: ${transcriptAddress}`);
    console.log(`   Gas used: ${transcriptGas.toString()}`);

    // Deploy HonkVerifier con linking
    const VerifierFactory = await ethers.getContractFactory("contracts/Verifier9.sol:HonkVerifier", {
      libraries: {
        ZKTranscriptLib: transcriptAddress,
      },
    });
    verifier = await VerifierFactory.deploy();
    await verifier.waitForDeployment();
    
    // Gas per deploy del verifier
    const verifierDeployTx = verifier.deploymentTransaction();
    const verifierReceipt = await verifierDeployTx?.wait();
    const verifierGas = verifierReceipt?.gasUsed || 0n;
    const verifierAddress = await verifier.getAddress();
    
    console.log(`✅ HonkVerifier deployed at: ${verifierAddress}`);
    console.log(`   Gas used: ${verifierGas.toString()}`);
    console.log(`   Total deployment gas: ${(transcriptGas + verifierGas).toString()}\n`);

    // Carica proof e public inputs
    const proofPath = path.join(__dirname, "../../Sudoku99/target/proof_hex.txt");  
    const proof = fs.readFileSync(proofPath, "utf8").trim();

    const publicInputsPath = path.join(__dirname, "../../Sudoku99/target/public_inputs_array.txt");
    const publicInputsStr = fs.readFileSync(publicInputsPath, "utf8").trim();
    const publicInputs = JSON.parse(publicInputsStr);

    console.log("=== Verification Metrics ===");
    
    // Stima il gas che verrebbe utilizzato per la verifica
    const estimatedGas = await verifier.verify.estimateGas(proof, publicInputs);
    
    console.log("\n=== Gas Usage Report ===");
    console.log(`Gas per verifica proof: ${estimatedGas.toString()}`);

    // Misurazione tempo di verifica
    const startTime = Date.now();
    const result = await verifier.verify(proof, publicInputs);
    const endTime = Date.now();
    const verificationTime = endTime - startTime;

    console.log(`Tempo verifica: ${verificationTime} ms`);
    console.log("========================\n");

    expect(result).to.be.true;
    console.log(" Verifica zk on-chain completata con successo!");
  });
});