import test from "node:test";
import assert from "node:assert/strict";

const { checkUpload, looksLikeExecutable, getMaxUploadBytes } =
  await import("../../src/lib/files/uploadPolicy.ts");

const enc = (s: string) => new TextEncoder().encode(s);

function peHeader(): Uint8Array {
  const buf = new Uint8Array(128);
  buf[0] = 0x4d;
  buf[1] = 0x5a;
  buf[0x3c] = 0x40; // e_lfanew
  buf.set([0x50, 0x45, 0, 0], 0x40);
  return buf;
}

test("accepts a normal jsonl batch file", () => {
  const r = checkUpload({
    filename: "batch.jsonl",
    mimeType: "application/jsonl",
    size: 10,
    head: enc('{"a":1}\n'),
  });
  assert.equal(r.ok, true);
});

test("rejects unexpected MIME types with 415", () => {
  const r = checkUpload({
    filename: "x.html",
    mimeType: "application/x-msdownload",
    size: 10,
    head: enc("hi"),
  });
  assert.deepEqual(r.ok, false);
  assert.equal((r as { status: number }).status, 415);
});

test("rejects a Windows PE executable even when labelled octet-stream and renamed", () => {
  const r = checkUpload({
    filename: "report.txt",
    mimeType: "application/octet-stream",
    size: 128,
    head: peHeader(),
  });
  assert.equal(r.ok, false);
  assert.equal(looksLikeExecutable(peHeader()), true);
});

test("rejects ELF binaries", () => {
  assert.equal(looksLikeExecutable(new Uint8Array([0x7f, 0x45, 0x4c, 0x46, 2, 1, 1])), true);
});

test("does not flag plain text that merely starts with MZ", () => {
  assert.equal(looksLikeExecutable(enc("MZ-1 quarterly report")), false);
});

test("rejects blocked extensions", () => {
  const r = checkUpload({
    filename: "run.ps1",
    mimeType: "text/plain",
    size: 3,
    head: enc("abc"),
  });
  assert.equal(r.ok, false);
});

test("rejects a declared PDF whose bytes are not a PDF", () => {
  const r = checkUpload({
    filename: "a.pdf",
    mimeType: "application/pdf",
    size: 5,
    head: enc("<html>"),
  });
  assert.equal(r.ok, false);
  const ok = checkUpload({
    filename: "a.pdf",
    mimeType: "application/pdf",
    size: 5,
    head: enc("%PDF-1.7"),
  });
  assert.equal(ok.ok, true);
});

test("enforces the size limit with 413 and honours the env override", () => {
  const r = checkUpload(
    { filename: "a.txt", mimeType: "text/plain", size: 11, head: enc("x") },
    10
  );
  assert.equal(r.ok, false);
  assert.equal((r as { status: number }).status, 413);
  assert.equal(getMaxUploadBytes({ OMNIROUTE_FILES_MAX_BYTES: "2048" } as NodeJS.ProcessEnv), 2048);
  assert.equal(getMaxUploadBytes({} as NodeJS.ProcessEnv), 512 * 1024 * 1024);
});
