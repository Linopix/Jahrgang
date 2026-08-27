/** Byte-mode QR, ECC M. Enough for invite URLs, no extra dependency. */

const EXP = new Uint8Array(512);
const LOG = new Uint8Array(256);
(() => {
  let x = 1;
  for (let i = 0; i < 255; i += 1) {
    EXP[i] = x;
    LOG[x] = i;
    x *= 2;
    if (x & 0x100) x ^= 0x11d;
  }
  for (let i = 255; i < 512; i += 1) EXP[i] = EXP[i - 255];
})();

function gfMul(a: number, b: number) {
  if (!a || !b) return 0;
  return EXP[LOG[a] + LOG[b]];
}

function rsGenerator(count: number) {
  let poly = [1];
  for (let i = 0; i < count; i += 1) {
    const next = new Array(poly.length + 1).fill(0);
    for (let j = 0; j < poly.length; j += 1) {
      next[j] ^= poly[j];
      next[j + 1] ^= gfMul(poly[j], EXP[i]);
    }
    poly = next;
  }
  return poly;
}

function rsEcc(data: number[], count: number) {
  const gen = rsGenerator(count);
  const ecc = new Array(count).fill(0);
  for (const byte of data) {
    const factor = byte ^ (ecc[0] as number);
    ecc.shift();
    ecc.push(0);
    if (!factor) continue;
    for (let i = 0; i < count; i += 1) {
      ecc[i] ^= gfMul(gen[i + 1] ?? 0, factor);
    }
  }
  return ecc;
}

type Group = { blocks: number; data: number; ecc: number };
type Version = { size: number; groups: Group[]; align: number[] };

const VERSIONS: Version[] = [
  { size: 25, groups: [{ blocks: 1, data: 28, ecc: 16 }], align: [18] },
  { size: 29, groups: [{ blocks: 1, data: 44, ecc: 26 }], align: [22] },
  { size: 33, groups: [{ blocks: 2, data: 32, ecc: 18 }], align: [26] },
  { size: 37, groups: [{ blocks: 2, data: 43, ecc: 24 }], align: [30] },
  { size: 41, groups: [{ blocks: 4, data: 27, ecc: 16 }], align: [34] },
  { size: 45, groups: [{ blocks: 4, data: 31, ecc: 18 }], align: [22, 38] },
  { size: 49, groups: [{ blocks: 2, data: 38, ecc: 22 }, { blocks: 2, data: 39, ecc: 22 }], align: [24, 42] },
];

function totalData(row: Version) {
  return row.groups.reduce((sum, g) => sum + g.blocks * g.data, 0);
}

function bitPush(bits: number[], value: number, len: number) {
  for (let i = len - 1; i >= 0; i -= 1) bits.push((value >> i) & 1);
}

function bytesToBits(text: string) {
  const bytes = Array.from(new TextEncoder().encode(text));
  const bits: number[] = [];
  bitPush(bits, 0b0100, 4);
  bitPush(bits, bytes.length, 8);
  for (const b of bytes) bitPush(bits, b, 8);
  bitPush(bits, 0, Math.min(4, 8 - (bits.length % 8 || 8)));
  while (bits.length % 8) bits.push(0);
  return bits;
}

function pickVersion(byteLen: number) {
  for (let i = 0; i < VERSIONS.length; i += 1) {
    const cap = totalData(VERSIONS[i]!) - 2;
    if (byteLen <= cap) return i;
  }
  return VERSIONS.length - 1;
}

function reserved(size: number, align: number[]) {
  const n = size * size;
  const mark = new Uint8Array(n);
  const set = (x: number, y: number) => {
    if (x >= 0 && y >= 0 && x < size && y < size) mark[y * size + x] = 1;
  };
  const finder = (x0: number, y0: number) => {
    for (let y = -1; y <= 7; y += 1) {
      for (let x = -1; x <= 7; x += 1) set(x0 + x, y0 + y);
    }
  };
  finder(0, 0);
  finder(size - 7, 0);
  finder(0, size - 7);
  for (let i = 0; i < size; i += 1) {
    set(i, 6);
    set(6, i);
  }
  for (const ay of [6, ...align]) {
    for (const ax of [6, ...align]) {
      if ((ax === 6 && ay === 6) || (ax === 6 && ay === size - 7) || (ax === size - 7 && ay === 6)) continue;
      for (let y = -2; y <= 2; y += 1) {
        for (let x = -2; x <= 2; x += 1) set(ax + x, ay + y);
      }
    }
  }
  for (let i = 0; i < 9; i += 1) {
    set(8, i);
    set(i, 8);
    set(size - 1 - i, 8);
    set(8, size - 1 - i);
  }
  set(8, size - 8);
  if (size >= 45) {
    for (let i = 0; i < 6; i += 1) {
      for (let j = 0; j < 3; j += 1) {
        set(size - 11 + j, i);
        set(i, size - 11 + j);
      }
    }
  }
  return mark;
}

function drawFinders(grid: Uint8Array, size: number) {
  const paint = (x0: number, y0: number) => {
    for (let y = 0; y < 7; y += 1) {
      for (let x = 0; x < 7; x += 1) {
        const edge = x === 0 || y === 0 || x === 6 || y === 6;
        const core = x >= 2 && x <= 4 && y >= 2 && y <= 4;
        if (edge || core) grid[(y0 + y) * size + (x0 + x)] = 1;
      }
    }
  };
  paint(0, 0);
  paint(size - 7, 0);
  paint(0, size - 7);
}

function drawTiming(grid: Uint8Array, size: number) {
  for (let i = 8; i < size - 8; i += 1) {
    const bit = i % 2 === 0 ? 1 : 0;
    grid[6 * size + i] = bit;
    grid[i * size + 6] = bit;
  }
}

function drawAlign(grid: Uint8Array, size: number, align: number[]) {
  for (const ay of [6, ...align]) {
    for (const ax of [6, ...align]) {
      if ((ax === 6 && ay === 6) || (ax === 6 && ay === size - 7) || (ax === size - 7 && ay === 6)) continue;
      for (let y = -2; y <= 2; y += 1) {
        for (let x = -2; x <= 2; x += 1) {
          const edge = Math.abs(x) === 2 || Math.abs(y) === 2;
          grid[(ay + y) * size + (ax + x)] = edge || (x === 0 && y === 0) ? 1 : 0;
        }
      }
    }
  }
}

function bch(data: number, poly: number, bits: number) {
  let v = data << bits;
  const d = 31 - Math.clz32(poly);
  for (let i = bits + 4; i >= bits; i -= 1) {
    if ((v >> i) & 1) v ^= poly << (i - d);
  }
  return (data << bits) | v;
}

function drawFormat(grid: Uint8Array, size: number, mask: number) {
  const raw = bch((0 << 3) | mask, 0x537, 10) ^ 0x5412;
  const put = (i: number, bit: number) => {
    const positions: Array<[number, number]> = [];
    if (i < 8) {
      positions.push([i < 6 ? i : i + 1, 8]);
      positions.push([8, size - 1 - i]);
    } else {
      positions.push([8, i < 9 ? 8 - (i - 7) : 14 - i]);
      positions.push([size - 15 + i, 8]);
    }
    for (const [x, y] of positions) grid[y * size + x] = bit;
  };
  for (let i = 0; i < 15; i += 1) put(i, (raw >> i) & 1);
  grid[(size - 8) * size + 8] = 1;
}

function drawVersion(grid: Uint8Array, size: number, version: number) {
  if (size < 45) return;
  const raw = bch(version, 0x1f25, 12);
  let k = 0;
  for (let i = 0; i < 6; i += 1) {
    for (let j = 0; j < 3; j += 1) {
      const bit = (raw >> k) & 1;
      k += 1;
      grid[i * size + (size - 11 + j)] = bit;
      grid[(size - 11 + j) * size + i] = bit;
    }
  }
}

function maskAt(mask: number, x: number, y: number) {
  switch (mask) {
    case 0:
      return (x + y) % 2 === 0;
    case 1:
      return y % 2 === 0;
    case 2:
      return x % 3 === 0;
    case 3:
      return (x + y) % 3 === 0;
    case 4:
      return (Math.floor(y / 2) + Math.floor(x / 3)) % 2 === 0;
    case 5:
      return ((x * y) % 2) + ((x * y) % 3) === 0;
    case 6:
      return (((x * y) % 2) + ((x * y) % 3)) % 2 === 0;
    default:
      return (((x + y) % 2) + ((x * y) % 3)) % 2 === 0;
  }
}

function placeData(grid: Uint8Array, reservedMap: Uint8Array, size: number, bits: number[], mask: number) {
  let i = 0;
  let up = true;
  for (let col = size - 1; col > 0; col -= 2) {
    if (col === 6) col -= 1;
    for (let n = 0; n < size; n += 1) {
      const y = up ? size - 1 - n : n;
      for (const x of [col, col - 1]) {
        const idx = y * size + x;
        if (reservedMap[idx]) continue;
        const bit = bits[i] ?? 0;
        i += 1;
        grid[idx] = bit ^ (maskAt(mask, x, y) ? 1 : 0);
      }
    }
    up = !up;
  }
}

function penalty(grid: Uint8Array, size: number) {
  let score = 0;
  for (let y = 0; y < size; y += 1) {
    let run = 1;
    for (let x = 1; x < size; x += 1) {
      if (grid[y * size + x] === grid[y * size + x - 1]) run += 1;
      else {
        if (run >= 5) score += run - 2;
        run = 1;
      }
    }
    if (run >= 5) score += run - 2;
  }
  for (let x = 0; x < size; x += 1) {
    let run = 1;
    for (let y = 1; y < size; y += 1) {
      if (grid[y * size + x] === grid[(y - 1) * size + x]) run += 1;
      else {
        if (run >= 5) score += run - 2;
        run = 1;
      }
    }
    if (run >= 5) score += run - 2;
  }
  for (let y = 0; y < size - 1; y += 1) {
    for (let x = 0; x < size - 1; x += 1) {
      const a = grid[y * size + x];
      if (a === grid[y * size + x + 1] && a === grid[(y + 1) * size + x] && a === grid[(y + 1) * size + x + 1]) {
        score += 3;
      }
    }
  }
  let dark = 0;
  for (const bit of grid) dark += bit;
  score += Math.floor(Math.abs((dark * 100) / (size * size) - 50) / 5) * 10;
  return score;
}

function interleave(version: Version, data: number[]) {
  const blocks: number[][] = [];
  const eccs: number[][] = [];
  let offset = 0;
  for (const g of version.groups) {
    for (let b = 0; b < g.blocks; b += 1) {
      const slice = data.slice(offset, offset + g.data);
      offset += g.data;
      blocks.push(slice);
      eccs.push(rsEcc(slice, g.ecc));
    }
  }
  const out: number[] = [];
  const maxData = Math.max(...blocks.map((b) => b.length));
  for (let i = 0; i < maxData; i += 1) {
    for (const block of blocks) if (i < block.length) out.push(block[i]!);
  }
  const maxEcc = Math.max(...eccs.map((b) => b.length));
  for (let i = 0; i < maxEcc; i += 1) {
    for (const block of eccs) if (i < block.length) out.push(block[i]!);
  }
  return out;
}

export function encodeQr(text: string): boolean[][] {
  const payload = text.slice(0, 120);
  const bits = bytesToBits(payload);
  const index = pickVersion(Math.ceil(bits.length / 8));
  const version = VERSIONS[index]!;
  const size = version.size;
  const dataBytes = totalData(version);
  const pad = [0xec, 0x11];
  const bytes: number[] = [];
  for (let i = 0; i < bits.length; i += 8) {
    let v = 0;
    for (let b = 0; b < 8; b += 1) v = (v << 1) | (bits[i + b] ?? 0);
    bytes.push(v);
  }
  let p = 0;
  while (bytes.length < dataBytes) {
    bytes.push(pad[p % 2]!);
    p += 1;
  }
  const codewords = interleave(version, bytes.slice(0, dataBytes));
  const stream: number[] = [];
  for (const cw of codewords) bitPush(stream, cw, 8);
  const reservedMap = reserved(size, version.align);
  let best: Uint8Array | null = null;
  let bestScore = Infinity;
  for (let mask = 0; mask < 8; mask += 1) {
    const grid = new Uint8Array(size * size);
    drawFinders(grid, size);
    drawTiming(grid, size);
    drawAlign(grid, size, version.align);
    drawFormat(grid, size, mask);
    drawVersion(grid, size, index + 2);
    placeData(grid, reservedMap, size, stream, mask);
    const score = penalty(grid, size);
    if (score < bestScore) {
      bestScore = score;
      best = grid;
    }
  }
  const grid = best!;
  const matrix: boolean[][] = [];
  for (let y = 0; y < size; y += 1) {
    const row: boolean[] = [];
    for (let x = 0; x < size; x += 1) row.push(grid[y * size + x] === 1);
    matrix.push(row);
  }
  return matrix;
}

export function qrPath(matrix: boolean[][]) {
  let d = "";
  for (let y = 0; y < matrix.length; y += 1) {
    const row = matrix[y]!;
    for (let x = 0; x < row.length; x += 1) {
      if (row[x]) d += `M${x} ${y}h1v1h-1z`;
    }
  }
  return d;
}
