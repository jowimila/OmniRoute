import { test } from "node:test";
import assert from "node:assert";
import { APIKEY_PROVIDERS_GATEWAYS } from "@/shared/constants/providers/apikey/gateways";
import { APIKEY_PROVIDERS } from "@/shared/constants/providers/apikey";

test("GonkaRouter provider is registered", () => {
  assert(
    APIKEY_PROVIDERS_GATEWAYS.gonka,
    "GonkaRouter should be defined in APIKEY_PROVIDERS_GATEWAYS"
  );

  const gonka = APIKEY_PROVIDERS_GATEWAYS.gonka;
  assert.strictEqual(gonka.id, "gonka", "ID should be 'gonka'");
  assert.strictEqual(gonka.alias, "gonka", "Alias should be 'gonka'");
  assert.strictEqual(gonka.name, "GonkaRouter", "Name should be 'GonkaRouter'");
  assert.strictEqual(gonka.passthroughModels, true, "Should support passthrough models");
  assert(gonka.website, "Should have a website");
  assert(gonka.authHint, "Should have auth hint");
  assert(gonka.apiHint, "Should have API hint");
});

test("GonkaRouter is in merged APIKEY_PROVIDERS", () => {
  assert(
    APIKEY_PROVIDERS.gonka,
    "GonkaRouter should be in merged APIKEY_PROVIDERS"
  );
  assert.strictEqual(
    APIKEY_PROVIDERS.gonka.id,
    "gonka",
    "Merged provider should have correct ID"
  );
});

test("GonkaRouter API endpoint is correct", () => {
  const gonka = APIKEY_PROVIDERS_GATEWAYS.gonka;
  assert(
    gonka.apiHint.includes("https://api.gonkarouter.io/v1"),
    "API hint should mention the correct endpoint"
  );
});
