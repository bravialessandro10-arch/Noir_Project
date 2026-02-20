const readline = require("readline");

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

// ── Utilità ──────────────────────────────────────────────────────────────────

function shuffle(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

// ── Validazione ──────────────────────────────────────────────────────────────

function isValid(grid, row, col, num, n, boxR, boxC) {
  // Controlla riga
  for (let c = 0; c < n; c++) {
    if (grid[row][c] === num) return false;
  }
  // Controlla colonna
  for (let r = 0; r < n; r++) {
    if (grid[r][col] === num) return false;
  }
  // Controlla box
  const startR = Math.floor(row / boxR) * boxR;
  const startC = Math.floor(col / boxC) * boxC;
  for (let r = startR; r < startR + boxR; r++) {
    for (let c = startC; c < startC + boxC; c++) {
      if (grid[r][c] === num) return false;
    }
  }
  return true;
}

// ── Generazione griglia completa (backtracking) ─────────────────────────────

function fillGrid(grid, n, boxR, boxC) {
  for (let row = 0; row < n; row++) {
    for (let col = 0; col < n; col++) {
      if (grid[row][col] === 0) {
        const nums = shuffle([...Array(n)].map((_, i) => i + 1));
        for (const num of nums) {
          if (isValid(grid, row, col, num, n, boxR, boxC)) {
            grid[row][col] = num;
            if (fillGrid(grid, n, boxR, boxC)) return true;
            grid[row][col] = 0;
          }
        }
        return false;
      }
    }
  }
  return true;
}

// ── Conteggio soluzioni (per garantire unicità) ─────────────────────────────

function countSolutions(grid, n, boxR, boxC, limit) {
  for (let row = 0; row < n; row++) {
    for (let col = 0; col < n; col++) {
      if (grid[row][col] === 0) {
        let count = 0;
        for (let num = 1; num <= n; num++) {
          if (isValid(grid, row, col, num, n, boxR, boxC)) {
            grid[row][col] = num;
            count += countSolutions(grid, n, boxR, boxC, limit - count);
            grid[row][col] = 0;
            if (count >= limit) return count;
          }
        }
        return count;
      }
    }
  }
  return 1;
}

// ── Rimozione celle per creare il puzzle ─────────────────────────────────────

function createPuzzle(solution, n, boxR, boxC) {
  const puzzle = solution.map((r) => [...r]);

  // Quante celle rimuovere (circa 50-60% per n<=9, meno per griglie grandi)
  const totalCells = n * n;
  const removeTarget = Math.floor(totalCells * (n <= 9 ? 0.55 : 0.45));

  const positions = shuffle(
    [...Array(totalCells)].map((_, i) => [Math.floor(i / n), i % n])
  );

  let removed = 0;

  for (const [row, col] of positions) {
    if (removed >= removeTarget) break;

    const backup = puzzle[row][col];
    puzzle[row][col] = 0;

    // Verifica unicità della soluzione
    const copy = puzzle.map((r) => [...r]);
    if (countSolutions(copy, n, boxR, boxC, 2) !== 1) {
      puzzle[row][col] = backup; // ripristina se non unica
    } else {
      removed++;
    }
  }

  return puzzle;
}

// ── Stampa griglia ───────────────────────────────────────────────────────────

function printGrid(grid, n, boxR, boxC, title) {
  const maxDigits = String(n).length;
  const pad = (v) =>
    v === 0 ? ".".padStart(maxDigits) : String(v).padStart(maxDigits);

  const colSep = " ";
  const boxColSep = " | ";

  console.log(`\n${"═".repeat(40)}`);
  console.log(`  ${title}`);
  console.log(`${"═".repeat(40)}`);

  for (let r = 0; r < n; r++) {
    if (r > 0 && r % boxR === 0) {
      // Separatore orizzontale tra box
      let line = "";
      for (let c = 0; c < n; c++) {
        if (c > 0 && c % boxC === 0) line += "-+-";
        else if (c > 0) line += "-";
        line += "-".repeat(maxDigits);
      }
      console.log(line);
    }
    let row = "";
    for (let c = 0; c < n; c++) {
      if (c > 0 && c % boxC === 0) row += boxColSep;
      else if (c > 0) row += colSep;
      row += pad(grid[r][c]);
    }
    console.log(row);
  }
  console.log();
}

// ── Calcolo dimensioni box ───────────────────────────────────────────────────

function getBoxDimensions(n) {
  const sqrt = Math.sqrt(n);
  if (Number.isInteger(sqrt)) return [sqrt, sqrt];

  // Per n non quadrato perfetto, cerca la coppia (r, c) tale che r*c = n
  // e r <= c con r il più grande possibile
  for (let r = Math.floor(sqrt); r >= 2; r--) {
    if (n % r === 0) return [r, n / r];
  }
  return null;
}

// ── Main ─────────────────────────────────────────────────────────────────────

rl.question(
  "Inserisci la dimensione del Sudoku (es. 4, 6, 9, 16): ",
  (answer) => {
    const n = parseInt(answer, 10);

    if (isNaN(n) || n < 4) {
      console.log(" Inserisci un numero valido >= 4.");
      rl.close();
      return;
    }

    const dims = getBoxDimensions(n);
    if (!dims) {
      console.log(
        ` ${n} non è una dimensione valida per un Sudoku (serve un n scomponibile in r × c con r,c >= 2).`
      );
      rl.close();
      return;
    }

    const [boxR, boxC] = dims;
    console.log(
      `\n Generazione Sudoku ${n}×${n} (box ${boxR}×${boxC})...\n`
    );

    // 1) Genera soluzione completa
    const solution = Array.from({ length: n }, () => Array(n).fill(0));
    fillGrid(solution, n, boxR, boxC);

    // 2) Crea puzzle rimuovendo celle
    console.log(" Creazione puzzle con soluzione unica...");
    const puzzle = createPuzzle(solution, n, boxR, boxC);

    const filled = puzzle.flat().filter((v) => v !== 0).length;
    const empty = n * n - filled;

    // 3) Stampa
    printGrid(puzzle, n, boxR, boxC, `PROBLEMA  (${filled} indizi, ${empty} vuote)`);
    printGrid(solution, n, boxR, boxC, "SOLUZIONE");

    rl.close();
  }
);