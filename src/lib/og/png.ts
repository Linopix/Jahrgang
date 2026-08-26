import { crc32, deflateSync } from "node:zlib";

function chunk(type: string, data: Uint8Array) {
  const head = Buffer.from(type, "ascii");
  const body = Buffer.concat([head, Buffer.from(data)]);
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body) >>> 0);
  return Buffer.concat([len, body, crc]);
}

export function encodePng(width: number, height: number, rgb: Uint8Array) {
  const raw = Buffer.alloc((width * 3 + 1) * height);
  for (let y = 0; y < height; y++) {
    const src = y * width * 3;
    const dst = y * (width * 3 + 1);
    raw[dst] = 0;
    raw.set(rgb.subarray(src, src + width * 3), dst + 1);
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8;
  ihdr[9] = 2;
  return Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    chunk("IHDR", ihdr),
    chunk("IDAT", deflateSync(raw, { level: 9 })),
    chunk("IEND", new Uint8Array()),
  ]);
}

export class Canvas {
  readonly w: number;
  readonly h: number;
  readonly px: Uint8Array;

  constructor(width: number, height: number, color = [12, 11, 10]) {
    this.w = width;
    this.h = height;
    this.px = new Uint8Array(width * height * 3);
    this.fill(color);
  }

  fill(color: number[]) {
    for (let i = 0; i < this.px.length; i += 3) {
      this.px[i] = color[0];
      this.px[i + 1] = color[1];
      this.px[i + 2] = color[2];
    }
  }

  set(x: number, y: number, color: number[], a = 1) {
    if (x < 0 || y < 0 || x >= this.w || y >= this.h || a <= 0) return;
    const i = (y * this.w + x) * 3;
    const k = a > 1 ? 1 : a;
    this.px[i] = Math.round(this.px[i] * (1 - k) + color[0] * k);
    this.px[i + 1] = Math.round(this.px[i + 1] * (1 - k) + color[1] * k);
    this.px[i + 2] = Math.round(this.px[i + 2] * (1 - k) + color[2] * k);
  }

  fillRect(x: number, y: number, w: number, h: number, color: number[], a = 1) {
    const x0 = Math.max(0, Math.floor(x));
    const y0 = Math.max(0, Math.floor(y));
    const x1 = Math.min(this.w, Math.ceil(x + w));
    const y1 = Math.min(this.h, Math.ceil(y + h));
    for (let yy = y0; yy < y1; yy++) {
      for (let xx = x0; xx < x1; xx++) this.set(xx, yy, color, a);
    }
  }

  fillCircle(cx: number, cy: number, r: number, color: number[], a = 1) {
    const x0 = Math.max(0, Math.floor(cx - r - 1));
    const y0 = Math.max(0, Math.floor(cy - r - 1));
    const x1 = Math.min(this.w, Math.ceil(cx + r + 1));
    const y1 = Math.min(this.h, Math.ceil(cy + r + 1));
    const rr = r * r;
    for (let y = y0; y < y1; y++) {
      for (let x = x0; x < x1; x++) {
        const d = (x + 0.5 - cx) ** 2 + (y + 0.5 - cy) ** 2;
        if (d <= rr) this.set(x, y, color, a);
      }
    }
  }

  strokeCircle(cx: number, cy: number, r: number, color: number[], width = 1.2, a = 1) {
    const x0 = Math.max(0, Math.floor(cx - r - width - 1));
    const y0 = Math.max(0, Math.floor(cy - r - width - 1));
    const x1 = Math.min(this.w, Math.ceil(cx + r + width + 1));
    const y1 = Math.min(this.h, Math.ceil(cy + r + width + 1));
    const outer = (r + width / 2) ** 2;
    const inner = Math.max(0, r - width / 2) ** 2;
    for (let y = y0; y < y1; y++) {
      for (let x = x0; x < x1; x++) {
        const d = (x + 0.5 - cx) ** 2 + (y + 0.5 - cy) ** 2;
        if (d <= outer && d >= inner) this.set(x, y, color, a);
      }
    }
  }

  png() {
    return encodePng(this.w, this.h, this.px);
  }

  downscale(factor: number) {
    const w = Math.floor(this.w / factor);
    const h = Math.floor(this.h / factor);
    const out = new Uint8Array(w * h * 3);
    const area = factor * factor;
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        let r = 0;
        let g = 0;
        let b = 0;
        for (let oy = 0; oy < factor; oy++) {
          for (let ox = 0; ox < factor; ox++) {
            const i = ((y * factor + oy) * this.w + (x * factor + ox)) * 3;
            r += this.px[i];
            g += this.px[i + 1];
            b += this.px[i + 2];
          }
        }
        const j = (y * w + x) * 3;
        out[j] = Math.round(r / area);
        out[j + 1] = Math.round(g / area);
        out[j + 2] = Math.round(b / area);
      }
    }
    return encodePng(w, h, out);
  }
}
