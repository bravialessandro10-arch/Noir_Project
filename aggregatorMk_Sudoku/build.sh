#!/bin/bash

echo "========================================="
echo "  AGGREGATOR BUILD & PROOF GENERATION"
echo "========================================="
echo ""

# Funzione per calcolare tempo in secondi
time_diff() {
    local start=$1
    local end=$2
    echo "scale=2; ($end - $start) / 1000000000" | bc
}

# Timestamp iniziale
TOTAL_START=$(date +%s%N)

# Step 1: Compile aggregator
echo "[1/6] Compiling aggregator..."
STEP_START=$(date +%s%N)
nargo compile
STEP_END=$(date +%s%N)
TIME_COMPILE=$(time_diff $STEP_START $STEP_END)
echo " Compile done in ${TIME_COMPILE}s"
echo ""

# Step 2: Generate VK
echo "[2/6] Generating verification key..."
STEP_START=$(date +%s%N)
bb write_vk --verifier_target evm -b ./target/aggregatorMk_Sudoku.json -o ./target
STEP_END=$(date +%s%N)
TIME_VK=$(time_diff $STEP_START $STEP_END)
echo " VK generation done in ${TIME_VK}s"
echo ""

# Step 3: Generate Solidity verifier
echo "[3/6] Generating Solidity verifier..."
STEP_START=$(date +%s%N)
bb write_solidity_verifier --verifier_target evm -k ./target/vk -o ./target/VerifierAggregatorMk_Sudoku.sol
STEP_END=$(date +%s%N)
TIME_VERIFIER=$(time_diff $STEP_START $STEP_END)
echo " Verifier generation done in ${TIME_VERIFIER}s"
echo ""

# Step 4: Generate Prover.toml with JS
echo "[4/6] Generating Prover.toml with JS script..."
STEP_START=$(date +%s%N)
cd ../hardhat_test
node scripts/genera_proofaggregataMk_Sudoku.js
cd ../aggregatorMk_Sudoku
STEP_END=$(date +%s%N)
TIME_PROVER_TOML=$(time_diff $STEP_START $STEP_END)
echo " Prover.toml generation done in ${TIME_PROVER_TOML}s"
echo ""

# Step 5: Execute circuit
echo "[5/6] Executing circuit (nargo execute)..."
STEP_START=$(date +%s%N)
nargo execute
STEP_END=$(date +%s%N)
TIME_EXECUTE=$(time_diff $STEP_START $STEP_END)
echo " Execute done in ${TIME_EXECUTE}s"
echo ""

# Step 6: Generate proof
echo "[6/6] Generating aggregated proof..."
STEP_START=$(date +%s%N)
bb prove --scheme ultra_honk --verifier_target evm -b ./target/aggregatorMk_Sudoku.json -w ./target/aggregatorMk_Sudoku.gz -o ./target
STEP_END=$(date +%s%N)
TIME_PROVE=$(time_diff $STEP_START $STEP_END)
echo " Proof generation done in ${TIME_PROVE}s"
echo ""

# Calcola tempo totale
TOTAL_END=$(date +%s%N)
TIME_TOTAL=$(time_diff $TOTAL_START $TOTAL_END)

# Summary
echo "========================================="
echo "           TIME SUMMARY"
echo "========================================="
echo "1. Compile aggregator:      ${TIME_COMPILE}s"
echo "2. Generate VK:              ${TIME_VK}s"
echo "3. Generate Solidity:        ${TIME_VERIFIER}s"
echo "4. Generate Prover.toml:     ${TIME_PROVER_TOML}s"
echo "5. Execute circuit:          ${TIME_EXECUTE}s"
echo "6. Generate proof:           ${TIME_PROVE}s"
echo "-----------------------------------------"
echo "TOTAL TIME:                  ${TIME_TOTAL}s"
echo "========================================="