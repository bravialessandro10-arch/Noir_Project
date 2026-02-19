#!/bin/bash
# convert_sudoku_16x16.sh
set -e

echo "=== PREPARO PROOF SUDOKU 16×16 ==="
echo ""

# 1. Verifica file
if [ ! -f "target/proof" ] || [ ! -f "target/public_inputs" ]; then
    echo " File mancanti!"
    exit 1
fi

# 2. Converti proof
echo "[1] Converting proof to hex..."
PROOF_HEX="0x$(xxd -p -c 0 target/proof)"
PROOF_SIZE=$(wc -c < target/proof)
echo "    Proof: $PROOF_SIZE bytes"

# 3. Converti public inputs
echo "[2] Converting public inputs..."
PUBLIC_INPUTS_HEX=$(xxd -p -c 0 target/public_inputs)
PUBLIC_INPUTS_SIZE=$(wc -c < target/public_inputs)
NUM_INPUTS=$((PUBLIC_INPUTS_SIZE / 32))

echo "    Public inputs: $NUM_INPUTS elementi"

if [ $NUM_INPUTS -ne 256 ]; then
    echo "  Warning: 256 inputs per  Sudoku 16×16, ne ho $NUM_INPUTS"
fi

# 4. Estrai valori (BIG-ENDIAN)
declare -a INPUTS_ARRAY
declare -a DECODED_VALUES

for i in $(seq 0 $((NUM_INPUTS - 1))); do
    OFFSET=$((i * 64))
    
    INPUT_HEX_NO_PREFIX=${PUBLIC_INPUTS_HEX:$OFFSET:64}
    INPUT_HEX="0x$INPUT_HEX_NO_PREFIX"
    INPUTS_ARRAY[$i]=$INPUT_HEX
    
    # Decodifica big-endian
    VALUE_HEX_CLEAN=$(echo "$INPUT_HEX_NO_PREFIX" | sed 's/^0*//')
    if [ -z "$VALUE_HEX_CLEAN" ]; then
        VALUE_DEC=0
    else
        VALUE_DEC=$((16#$VALUE_HEX_CLEAN))
    fi
    DECODED_VALUES[$i]=$VALUE_DEC
done


# 6. Genera JSON per Solidity
echo ""
echo "[3] Generating Solidity parameters..."
PUBLIC_INPUTS_JSON="["
for i in $(seq 0 $((NUM_INPUTS - 1))); do
    if [ $i -eq $((NUM_INPUTS - 1)) ]; then
        PUBLIC_INPUTS_JSON+="\"${INPUTS_ARRAY[$i]}\""
    else
        PUBLIC_INPUTS_JSON+="\"${INPUTS_ARRAY[$i]}\","
    fi
done
PUBLIC_INPUTS_JSON+="]"

# 7. Salva
echo "$PROOF_HEX" > target/proof_hex.txt
echo "$PUBLIC_INPUTS_JSON" > target/public_inputs_array.txt

# 8. Output
echo "Proof size: $(echo "scale=2; $PROOF_SIZE / 1024" | bc) KB"
echo "Public inputs: $NUM_INPUTS elementi (16×16 grid)"
echo ""
echo "Proof (primi 100 char): ${PROOF_HEX:0:100}..."
echo ""
echo "Files salvati:"
echo "  - target/proof_hex.txt"
echo "  - target/public_inputs_array.txt"
echo ""