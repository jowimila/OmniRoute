/**
 * Upload policy for the OpenAI-compatible Files API (`POST /v1/files`).
 *
 * Files are stored in the database and served back as attachments, never executed.
 * The policy still blocks the obvious abuse cases: executables disguised as data,
 * declared types that do not match the real bytes, and unexpected MIME types.
 */

export const DEFAULT_MAX_UPLOAD_BYTES = 512 * 1024 * 1024; // 512 MB (batch .jsonl files can be large)

const ALLOWED_EXACT_MIME = new Set([
  "application/json",
  "application/jsonl",
  "application/x-ndjson",
  "application/pdf",
  "application/octet-stream",
  "application/xml",
  "application/yaml",
  "application/x-yaml",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  "image/png",
  "image/jpeg",
  "image/webp",
  "image/gif",
]);

const ALLOWED_MIME_PREFIXES = ["text/", "audio/"];

const BLOCKED_EXTENSIONS = new Set([
  "exe",
  "dll",
  "msi",
  "com",
  "scr",
  "bat",
  "cmd",
  "ps1",
  "sh",
  "jar",
  "apk",
  "app",
  "bin",
  "so",
  "dylib",
]);

export interface UploadCheckInput {
  filename: string;
  mimeType: string;
  size: number;
  /** First bytes of the file (at least 64 are used; the whole buffer is fine). */
  head: Uint8Array;
}

export type UploadCheckResult =
  { ok: true } | { ok: false; status: 400 | 413 | 415; message: string };

export function getMaxUploadBytes(env: NodeJS.ProcessEnv = process.env): number {
  const raw = Number.parseInt(env.OMNIROUTE_FILES_MAX_BYTES || "", 10);
  return Number.isFinite(raw) && raw > 0 ? raw : DEFAULT_MAX_UPLOAD_BYTES;
}

function startsWith(head: Uint8Array, bytes: number[]): boolean {
  return head.length >= bytes.length && bytes.every((b, i) => head[i] === b);
}

/** Detect native executables by magic bytes (PE, ELF, Mach-O). */
export function looksLikeExecutable(head: Uint8Array): boolean {
  if (startsWith(head, [0x7f, 0x45, 0x4c, 0x46])) return true; // ELF
  const machO = [
    [0xfe, 0xed, 0xfa, 0xce],
    [0xfe, 0xed, 0xfa, 0xcf],
    [0xce, 0xfa, 0xed, 0xfe],
    [0xcf, 0xfa, 0xed, 0xfe],
    [0xca, 0xfe, 0xba, 0xbe], // also Java class / fat binary
  ];
  if (machO.some((m) => startsWith(head, m))) return true;
  if (startsWith(head, [0x4d, 0x5a]) && head.length >= 0x40) {
    // PE: "MZ" header whose e_lfanew points at "PE\0\0" (avoids flagging text that starts with "MZ")
    const view = new DataView(head.buffer, head.byteOffset, head.byteLength);
    const peOffset = view.getUint32(0x3c, true);
    return (
      peOffset + 4 <= head.length &&
      head[peOffset] === 0x50 &&
      head[peOffset + 1] === 0x45 &&
      head[peOffset + 2] === 0 &&
      head[peOffset + 3] === 0
    );
  }
  return false;
}

function magicMatchesDeclared(mime: string, head: Uint8Array): boolean {
  switch (mime) {
    case "application/pdf":
      return startsWith(head, [0x25, 0x50, 0x44, 0x46]); // %PDF
    case "image/png":
      return startsWith(head, [0x89, 0x50, 0x4e, 0x47]);
    case "image/jpeg":
      return startsWith(head, [0xff, 0xd8, 0xff]);
    case "image/gif":
      return startsWith(head, [0x47, 0x49, 0x46, 0x38]); // GIF8
    case "image/webp":
      return startsWith(head, [0x52, 0x49, 0x46, 0x46]) && head[8] === 0x57 && head[9] === 0x45; // RIFF....WE
    default:
      return true;
  }
}

export function checkUpload(
  input: UploadCheckInput,
  maxBytes = getMaxUploadBytes()
): UploadCheckResult {
  if (input.size > maxBytes) {
    return {
      ok: false,
      status: 413,
      message: `File exceeds maximum allowed size of ${Math.floor(maxBytes / (1024 * 1024))} MB`,
    };
  }

  const mime = (input.mimeType || "application/octet-stream").split(";")[0].trim().toLowerCase();
  const allowed =
    ALLOWED_EXACT_MIME.has(mime) || ALLOWED_MIME_PREFIXES.some((p) => mime.startsWith(p));
  if (!allowed) {
    return { ok: false, status: 415, message: `Unsupported file type: ${mime}` };
  }

  const ext = input.filename.includes(".") ? input.filename.split(".").pop()!.toLowerCase() : "";
  if (BLOCKED_EXTENSIONS.has(ext)) {
    return { ok: false, status: 415, message: `Files with the .${ext} extension are not accepted` };
  }

  if (looksLikeExecutable(input.head)) {
    return { ok: false, status: 415, message: "Executable files are not accepted" };
  }

  if (!magicMatchesDeclared(mime, input.head)) {
    return { ok: false, status: 415, message: "File content does not match its declared type" };
  }

  return { ok: true };
}
