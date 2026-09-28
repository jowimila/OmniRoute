import { test, describe } from "node:test";
import assert from "node:assert";

/**
 * GonkaRouter × OmniRoute End-to-End Tests
 *
 * Tests GonkaRouter integration through OmniRoute's routing layer.
 * Requires:
 * - OmniRoute running on localhost:20128
 * - OMNIROUTE_API_KEY environment variable
 * - GONKA_API_KEY environment variable (registered in OmniRoute)
 *
 * Run with: OMNIROUTE_API_KEY=... GONKA_API_KEY=... npm run test:e2e:gonka
 */

const OMNIROUTE_API_KEY = process.env.OMNIROUTE_API_KEY;
const GONKA_API_KEY = process.env.GONKA_API_KEY;
const OMNIROUTE_BASE_URL = process.env.OMNIROUTE_BASE_URL || "http://localhost:20128";

// Skip tests if prerequisites not met
const skipIfNotReady =
  OMNIROUTE_API_KEY && GONKA_API_KEY ? test : test.skip;

describe("GonkaRouter × OmniRoute E2E", () => {
  skipIfNotReady("should route request through OmniRoute to GonkaRouter", async () => {
    // First, ensure GonkaRouter is registered as a provider
    const response = await fetch(
      `${OMNIROUTE_BASE_URL}/v1/chat/completions`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${OMNIROUTE_API_KEY}`,
        },
        body: JSON.stringify({
          // Provider format: "gonka:model-name"
          model: "gonka:zai-org/GLM-5.3-Flash",
          messages: [
            {
              role: "user",
              content:
                "Hello from OmniRoute! Respond with 'ok' if you work.",
            },
          ],
          max_tokens: 20,
        }),
      }
    );

    const contentType = response.headers.get("content-type");
    const isJson = contentType?.includes("application/json");

    if (!isJson) {
      const text = await response.text();
      assert.fail(
        `Expected JSON response, got: ${response.status} ${text.substring(0, 200)}`
      );
    }

    const data = (await response.json()) as {
      choices?: Array<{ message?: { content: string } }>;
      error?: { message: string; code?: string };
    };

    // Handle errors gracefully
    if (data.error) {
      console.log(`API Error: ${data.error.message} (code: ${data.error.code})`);
      // 401/403 likely means credentials not set in OmniRoute yet
      assert(
        response.status >= 200 && response.status < 300,
        `HTTP ${response.status}: ${data.error.message}`
      );
    }

    assert(
      data.choices && data.choices.length > 0,
      "Response should have choices"
    );
    assert(
      data.choices[0]?.message?.content,
      "Choice should have content"
    );
  });

  skipIfNotReady("should list GonkaRouter models via OmniRoute", async () => {
    const response = await fetch(
      `${OMNIROUTE_BASE_URL}/v1/models`,
      {
        method: "GET",
        headers: {
          "Authorization": `Bearer ${OMNIROUTE_API_KEY}`,
        },
      }
    );

    const data = (await response.json()) as {
      data?: Array<{ id: string }>;
      object?: string;
    };

    assert(data.data || data.object, "Should have models or object property");

    if (data.data) {
      // Check if any GonkaRouter models are listed
      const gonkaModels = data.data.filter((m) => m.id.includes("gonka"));
      console.log(
        `  Found ${gonkaModels.length} GonkaRouter models in catalog`
      );
    }
  });

  skipIfNotReady(
    "should handle streaming responses from GonkaRouter",
    async () => {
      const response = await fetch(
        `${OMNIROUTE_BASE_URL}/v1/chat/completions`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${OMNIROUTE_API_KEY}`,
          },
          body: JSON.stringify({
            model: "gonka:zai-org/GLM-5.3-Flash",
            messages: [
              {
                role: "user",
                content: "Count to 3 slowly.",
              },
            ],
            stream: true,
            max_tokens: 50,
          }),
        }
      );

      assert.strictEqual(
        response.status,
        200,
        `Expected 200, got ${response.status}`
      );

      // Verify SSE stream format
      const contentType = response.headers.get("content-type");
      assert(
        contentType?.includes("text/event-stream"),
        `Expected SSE stream, got ${contentType}`
      );

      // Read first chunk
      if (response.body) {
        const reader = response.body.getReader();
        const { value } = await reader.read();

        if (value) {
          const chunk = new TextDecoder().decode(value);
          assert(
            chunk.includes("data:"),
            "Stream should contain SSE 'data:' format"
          );
        }
      }
    }
  );
});

// Summary
if (OMNIROUTE_API_KEY && GONKA_API_KEY) {
  console.log("✓ GonkaRouter E2E tests enabled");
  console.log(`  OmniRoute: ${OMNIROUTE_BASE_URL}`);
  console.log(`  GonkaRouter API: ${GONKA_API_KEY.substring(0, 10)}...`);
} else {
  const missing = [];
  if (!OMNIROUTE_API_KEY) missing.push("OMNIROUTE_API_KEY");
  if (!GONKA_API_KEY) missing.push("GONKA_API_KEY");
  console.log(`⊘ GonkaRouter E2E tests skipped (set: ${missing.join(", ")})`);
}
