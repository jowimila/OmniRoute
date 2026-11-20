import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

const TEST_DATA_DIR = fs.mkdtempSync(path.join(os.tmpdir(), "omniroute-login-lockout-webhook-"));
const FRESH_DATA_DIR = path.join(TEST_DATA_DIR, "fresh-data-dir"); // does not exist yet
process.env.DATA_DIR = FRESH_DATA_DIR;
process.env.JWT_SECRET = "test-jwt-secret-for-lockout-webhook";
process.env.INITIAL_PASSWORD = "correct-horse-battery";

const core = await import("../../src/lib/db/core.ts");
const webhooksDb = await import("../../src/lib/db/webhooks.ts");
const loginRoute = await import("../../src/app/api/auth/login/route.ts");

const originalFetch = globalThis.fetch;

test.after(() => {
  globalThis.fetch = originalFetch;
  core.resetDbInstance();
  fs.rmSync(TEST_DATA_DIR, { recursive: true, force: true });
});

test("data directory created by the DB layer is owner-only (0o700)", () => {
  core.getDbInstance();
  assert.equal(fs.statSync(FRESH_DATA_DIR).mode & 0o777, 0o700);
});

test("lockout fires a security.login_locked webhook once and never leaks the password", async () => {
  // Warm the dispatcher's lazy imports so timing below is not dominated by module loading.
  const dispatcher = await import("../../src/lib/webhookDispatcher.ts");
  await dispatcher.dispatchEvent("test.ping", {});

  webhooksDb.createWebhook({
    url: "https://hooks.example.com/omniroute",
    events: ["security.login_locked"],
  });

  // No real network: every delivery attempt is recorded in webhook_deliveries (with the payload
  // snapshot) whether or not the HTTP call succeeds, so assert on that record.
  globalThis.fetch = (async () => new Response("ok", { status: 200 })) as typeof fetch;

  const attempt = (pw: string) =>
    loginRoute.POST(
      new Request("http://localhost/api/auth/login", {
        method: "POST",
        headers: { "content-type": "application/json", "x-forwarded-for": "198.51.100.23" },
        body: JSON.stringify({ password: pw }),
      })
    );

  const statuses: number[] = [];
  for (let i = 0; i < 6; i++) statuses.push((await attempt(`wrong-password-${i}`)).status);
  assert.ok(statuses.includes(429), `expected a 429 lockout, got ${statuses.join(",")}`);

  const db = core.getDbInstance();
  const read = () =>
    db
      .prepare("SELECT payload_snapshot FROM webhook_deliveries WHERE event_type = ?")
      .all("security.login_locked") as { payload_snapshot: string }[];

  let rows = read();
  for (let i = 0; i < 300 && rows.length === 0; i++) {
    await new Promise((r) => setTimeout(r, 100));
    rows = read();
  }

  assert.equal(rows.length, 1, "alert is sent once, on the failure that trips the lockout");
  const snapshot = rows[0].payload_snapshot;
  assert.ok(snapshot.includes("198.51.100.23"), "payload names the offending IP");
  assert.ok(!snapshot.includes("wrong-password"), "attempted password must not be in the payload");
  assert.ok(!snapshot.includes("correct-horse"), "stored password must not be in the payload");
});
