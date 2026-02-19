import { expect } from "chai";
import { ethers } from "hardhat";
import * as fs from "fs";
import * as path from "path";

describe("HonkVerifier On-Chain Verification", function () {
  it("Verifica proof zk on-chain", async function () {
     let transcriptLib: any;
     let transcriptAddress: string;
     let verifier: any;
    // Deploy library mancante (ZKTranscriptLib)
    const TranscriptLibFactory = await ethers.getContractFactory("contracts/Verifier16.sol:ZKTranscriptLib");
     transcriptLib = await TranscriptLibFactory.deploy();
    await transcriptLib.waitForDeployment();
     transcriptAddress = await transcriptLib.getAddress();

     // Gas deploy library
     const transcriptDeployTx = transcriptLib.deploymentTransaction();
     const transcriptReceipt = await transcriptDeployTx?.wait();
     const transcriptGas = transcriptReceipt?.gasUsed || 0n;
     console.log(`Gas deploy ZKTranscriptLib: ${transcriptGas.toString()}`);

    // Deploy temp HonkVerifier con linking (risolve errore missing links)
    const VerifierFactory = await ethers.getContractFactory("contracts/Verifier16.sol:HonkVerifier", {
      libraries: {
        ZKTranscriptLib: transcriptAddress,  // Link qui
      },
    });
     verifier = await VerifierFactory.deploy();
    await verifier.waitForDeployment();

    // Gas deploy verifier
    const verifierDeployTx = verifier.deploymentTransaction();
    const verifierReceipt = await verifierDeployTx?.wait();
    const verifierGas = verifierReceipt?.gasUsed || 0n;
    console.log(`Gas deploy HonkVerifier: ${verifierGas.toString()}`);
    console.log(`TOTAL DEPLOY GAS: ${(transcriptGas + verifierGas).toString()}\n`);

    // Carica proof hex da file
    const proofPath = path.join(__dirname, "../../Sudoku1616/target/proof_hex.txt");  
    const proof = fs.readFileSync(proofPath, "utf8").trim();

    // Carica publicInputs array da file (parse JSON)
    const publicInputsPath = path.join(__dirname, "../../Sudoku1616/target/public_inputs_array.txt");
    const publicInputsStr = fs.readFileSync(publicInputsPath, "utf8").trim();
    const publicInputs = JSON.parse(publicInputsStr);
    
    // Stima il gas che verrebbe utilizzato per la verifica
    const estimatedGas = await verifier.verify.estimateGas(proof, publicInputs);
    console.log(`Gas per verifica: ${estimatedGas.toString()}`);
    
    // Verifica con misurazione tempo
    const startTime = Date.now();
    const result = await verifier.verify(proof, publicInputs);
    const endTime = Date.now();
    const verificationTime = endTime - startTime;

    console.log(`Tempo verifica: ${verificationTime} ms\n`);

    expect(result).to.be.true;
    console.log("✅ Verifica zk on-chain completata con successo!");
  });
});