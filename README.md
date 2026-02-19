# Noir_Project

Progetto di tesi triennale sull'aggregazione di prove Zero-Knowledge (ZK) 
utilizzando il linguaggio Noir e il backend crittografico Barretenberg (UltraHonk).

## Descrizione

Il progetto esplora tecniche di **ZK Proof Aggregation** applicate a due casi di studio:
- **Sudoku** (4x4, 9x9, 16x16): dimostrazione della conoscenza di una soluzione valida senza rivelarla
- **Merkle Tree** (depth 8, 16, 20): verifica di appartenenza a una whitelist tramite Merkle proof

Le prove vengono aggregate ricorsivamente in un'unica prova verificabile on-chain 
su blockchain Ethereum-compatibile tramite smart contract Solidity generati da Noir.

## Struttura del Progetto

- `aggregator/` — Circuito aggregatore Sudoku (aggregazione batch di prove)
- `aggregator10/` — Variante aggregatore 10 Prove Sudoku 4*4
- `aggregatorMK/` — Aggregatore per prove Merkle Tree
- `aggregatorMk_Sudoku/` — Aggregatore combinato Merkle + Sudoku
- `Sudoku44/`, `Sudoku99/`, `Sudoku1616/` — Circuiti Noir per Sudoku
- `merkle_depth8/`, `merkle_depth16/`, `merkle_depth20/` — Circuiti Noir per Merkle Tree
- `hardhat_test/` — Script di deploy e verifica on-chain con Hardhat
