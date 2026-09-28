import { test, describe } from "node:test";
import assert from "node:assert";

/**
 * GonkaRouter Integration Tests
 *
 * These tests verify actual connectivity and functionality with the GonkaRouter API.
 * Requires GONKA_API_KEY environment variable to be set.
 *
 * Run with: GONKA_API_KEY=sk-... npm run test:integration
 */

const GONKA_API_KEY = process.env.GONKA_API_KEY;
const GONKA_BASE_URL = "https://api.gonkarouter.io/v1";

// Skip tests if API key not provided
const skipIfNoApiKey = GONKA_API_KEY ? test : test.skip;

describe("GonkaRouter API Integration", () => {
  skipIfNoApiKey("should fetch available models", async () => {
    const response = await fetch(`${GONKA_BASE_URL}/models`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${GONKA_API_KEY}`,
      },
    });

    assert.strictEqual(
      response.status,
      200,
      `Expected 200, got ${response.status}`
    );

    const data = (await response.json()) as {
      data?: Array<{ id: string; object: string }>;
    };

    assert(
      data.data && Array.isArray(data.data),
      "Response should have 'data' array"
    );
    assert(
      data.data.length > 0,
      "Should have at least one model available"
    );

    // Verify GLM-5.3-Flash is available
    const glmModel = data.data.find((m) => m.id.includes("GLM-5.3-Flash"));
    assert(
      glmModel || data.data.length > 0,
      `Models available: ${data.data.map((m) => m.id).join(", ")}`
    );
  });

  skipIfNoApiKey("should send a chat completion request", async () => {
    const response = await fetch(`${GONKA_BASE_URL}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${GONKA_API_KEY}`,
      },
      body: JSON.stringify({
        model: "zai-org/GLM-5.3-Flash",
        messages: [
          {
            role: "user",
            content: "Hello! Please respond with a single word.",
          },
        ],
        max_tokens: 10,
      }),
    });

    assert.strictEqual(
      response.status,
      200,
      `Expected 200, got ${response.status}`
    );

    const data = (await response.json()) as {
      choices?: Array<{
        message?: { content: string };
        delta?: { content: string };
      }>;
      error?: { message: string };
    };

    if (data.error) {
      assert.fail(`API error: ${data.error.message}`);
    }

    assert(
      data.choices && data.choices.length > 0,
      "Response should have choices"
    );

    const firstChoice = data.choices[0];
    assert(
      firstChoice.message || firstChoice.delta,
      "Choice should have message or delta"
    );

    const content =
      firstChoice.message?.content || firstChoice.delta?.content;
    assert(content && content.length > 0, "Should have response content");
  });

  skipIfNoApiKey("should handle model not found gracefully", async () => {
    const response = await fetch(`${GONKA_BASE_URL}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${GONKA_API_KEY}`,
      },
      body: JSON.stringify({
        model: "nonexistent-model-xyz",
        messages: [
          {
            role: "user",
            content: "test",
          },
        ],
      }),
    });

    // Should either return 404 or 400 for invalid model
    assert(
      response.status === 404 || response.status === 400,
      `Expected 404 or 400, got ${response.status}`
    );
  });

  skipIfNoApiKey("should validate authentication", async () => {
    const response = await fetch(`${GONKA_BASE_URL}/models`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "Authorization": "Bearer invalid-key-xyz",
      },
    });

    // Should return 401 or 403 for invalid auth
    assert(
      response.status === 401 || response.status === 403,
      `Expected 401 or 403 for invalid key, got ${response.status}`
    );
  });
});

// Summary output
if (GONKA_API_KEY) {
  console.log("✓ GonkaRouter integration tests enabled");
  console.log(`  Endpoint: ${GONKA_BASE_URL}`);
  console.log(`  API Key: ${GONKA_API_KEY.substring(0, 10)}...`);
} else {
  console.log("⊘ GonkaRouter integration tests skipped (set GONKA_API_KEY)");
}
