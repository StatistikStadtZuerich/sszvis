/**
 * A minimal ZIP writer: a few small sources and an already-compressed image gain
 * nothing from deflate, and `CompressionStream` would make this async. One archive
 * rather than four downloads because browsers prompt for, or drop, repeated saves.
 */

export type ZipEntry = {
  readonly name: string;
  readonly content: Uint8Array;
};

/** Source files reach the archive as bytes, like every other entry. */
export const utf8 = (value: string): Uint8Array => new TextEncoder().encode(value);

const LOCAL = 0x04034b50;
const CENTRAL = 0x02014b50;
const END = 0x06054b50;

/** Bit 11: filenames are UTF-8, so a non-ASCII name arrives intact rather than as mojibake. */
const UTF8 = 0x800;

/**
 * Fixed at 1980-01-01 00:00 (the DOS epoch; zero is not accepted) so the same
 * spec gives byte-identical output.
 */
const DOS_TIME = 0;
const DOS_DATE = 0x21;

const CRC_TABLE = /* @__PURE__ */ (() => {
  const table = new Uint32Array(256);
  for (let index = 0; index < 256; index += 1) {
    let value = index;
    for (let bit = 0; bit < 8; bit += 1) {
      value = (value & 1) === 1 ? 0xedb88320 ^ (value >>> 1) : value >>> 1;
    }
    table[index] = value >>> 0;
  }
  return table;
})();

function crc32(bytes: Uint8Array): number {
  let crc = 0xffffffff;
  for (const byte of bytes) {
    // SAFETY: the index is masked to 0..255 and the table has 256 entries.
    crc = (CRC_TABLE[(crc ^ byte) & 0xff] as number) ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

export function zip(entries: readonly ZipEntry[]): Uint8Array<ArrayBuffer> {
  const encoder = new TextEncoder();
  const files = entries.map((entry) => {
    const body = entry.content;
    return { name: encoder.encode(entry.name), body, crc: crc32(body), offset: 0 };
  });

  const localSize = files.reduce((total, f) => total + 30 + f.name.length + f.body.length, 0);
  const centralSize = files.reduce((total, f) => total + 46 + f.name.length, 0);
  const out = new Uint8Array(localSize + centralSize + 22);
  const view = new DataView(out.buffer);

  let at = 0;
  const u32 = (value: number) => {
    view.setUint32(at, value, true);
    at += 4;
  };
  const u16 = (value: number) => {
    view.setUint16(at, value, true);
    at += 2;
  };
  const bytes = (value: Uint8Array) => {
    out.set(value, at);
    at += value.length;
  };

  for (const file of files) {
    file.offset = at;
    u32(LOCAL);
    u16(20); // version needed
    u16(UTF8);
    u16(0); // stored
    u16(DOS_TIME);
    u16(DOS_DATE);
    u32(file.crc);
    u32(file.body.length); // compressed
    u32(file.body.length); // uncompressed
    u16(file.name.length);
    u16(0); // extra
    bytes(file.name);
    bytes(file.body);
  }

  const centralAt = at;
  for (const file of files) {
    u32(CENTRAL);
    u16(20); // version made by
    u16(20); // version needed
    u16(UTF8);
    u16(0); // stored
    u16(DOS_TIME);
    u16(DOS_DATE);
    u32(file.crc);
    u32(file.body.length);
    u32(file.body.length);
    u16(file.name.length);
    u16(0); // extra
    u16(0); // comment
    u16(0); // disk
    u16(0); // internal attrs
    u32(0); // external attrs
    u32(file.offset);
    bytes(file.name);
  }

  /* Measured before the end record is written: `at` moves as we write it. */
  const directoryBytes = at - centralAt;

  u32(END);
  u16(0); // this disk
  u16(0); // disk with central directory
  u16(files.length);
  u16(files.length);
  u32(directoryBytes);
  u32(centralAt);
  u16(0); // comment

  return out;
}
