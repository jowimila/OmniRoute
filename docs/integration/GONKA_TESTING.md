# GonkaRouter Integration Testing

This guide explains how to test GonkaRouter integration with OmniRoute using the provided test suites.

## Prerequisites

1. **GonkaRouter Account**: Sign up at https://www.gonkarouter.io and create an API key
2. **Node.js**: v22.0.0 or higher
3. **OmniRoute**: Running locally (for E2E tests)

## Test Suites

### 1. Unit Tests (No API Required)

Tests that GonkaRouter is properly registered in OmniRoute's provider catalog.

```bash
node --import tsx/esm --test tests/unit/gonka-provider.test.ts
```

**What it checks:**
- Provider is registered in `APIKEY_PROVIDERS_GATEWAYS`
- Metadata (name, website, hints) is correct
- Passthrough models feature is enabled

### 2. Integration Tests (API Key Required)

Tests direct connectivity to the GonkaRouter API without OmniRoute.

```bash
GONKA_API_KEY="sk-..." npm run test:integration
```

Or target the specific test file:

```bash
GONKA_API_KEY="sk-..." node --import tsx/esm --test tests/integration/gonka-router.test.ts
```

**What it checks:**
- ✓ Fetches available models from `/v1/models`
- ✓ Sends a chat completion request to `/v1/chat/completions`
- ✓ Handles model-not-found errors gracefully
- ✓ Validates authentication (rejects invalid keys)

**Example Output:**
```
✓ should fetch available models
  Models found: zai-org/GLM-5.3-Flash, glm-4-9b, ...

✓ should send a chat completion request
  Response: "ok"

✓ should handle model not found gracefully
  (expected 404)

✓ should validate authentication
  (expected 401/403 for invalid key)
```

### 3. End-to-End Tests (OmniRoute + API Key)

Tests the full integration: OmniRoute → GonkaRouter.

**Setup:**

```bash
# Terminal 1: Start OmniRoute
npm run dev

# Terminal 2: Run E2E tests
OMNIROUTE_API_KEY="your-omniroute-key" \
GONKA_API_KEY="sk-..." \
npm run test:e2e:gonka
```

Or manually:

```bash
OMNIROUTE_API_KEY="your-key" \
GONKA_API_KEY="sk-..." \
node --import tsx/esm --test tests/integration/gonka-omniroute-e2e.test.ts
```

**What it checks:**
- ✓ Routes request through OmniRoute to GonkaRouter
- ✓ Provider `gonka:zai-org/GLM-5.3-Flash` works
- ✓ Models are listed via `/v1/models`
- ✓ Streaming responses work correctly

## Manual Testing

### Test Models Endpoint

```bash
export API_KEY="sk-..."

curl -X GET https://api.gonkarouter.io/v1/models \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $API_KEY"
```

### Test Chat Completion

```bash
curl -X POST https://api.gonkarouter.io/v1/chat/completions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $API_KEY" \
  -d '{
    "model": "zai-org/GLM-5.3-Flash",
    "messages": [{"role": "user", "content": "Hello!"}],
    "max_tokens": 50
  }'
```

### Test via OmniRoute (if running locally)

```bash
export OMNIROUTE_KEY="your-omniroute-api-key"

curl -X POST http://localhost:20128/v1/chat/completions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $OMNIROUTE_KEY" \
  -d '{
    "model": "gonka:zai-org/GLM-5.3-Flash",
    "messages": [{"role": "user", "content": "Hello!"}]
  }'
```

## Registering GonkaRouter in OmniRoute

### Via Dashboard

1. Navigate to **Settings → Providers**
2. Click **+ Add Provider**
3. Select **GonkaRouter** from the gateways list
4. Paste your API key (starts with `sk-`)
5. Click **Save**

### Via API

```bash
curl -X POST http://localhost:20128/api/providers \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $OMNIROUTE_KEY" \
  -d '{
    "providerId": "gonka",
    "apiKey": "sk-...",
    "priority": 1
  }'
```

## Troubleshooting

### "GONKA_API_KEY not set"

```bash
# Make sure to export it before running tests
export GONKA_API_KEY="sk-..."
npm run test:integration
```

### "Cannot find package 'tsx'"

Run `npm install` first to install dependencies.

### "Connection refused to localhost:20128"

Make sure OmniRoute is running:

```bash
npm run dev
```

### "401 Unauthorized" from GonkaRouter

- Verify your API key is correct
- Check it hasn't expired at https://www.gonkarouter.io/settings
- Make sure you copied the full key (starts with `sk-`)

### "404 model not found"

Not all models may be available in all regions or on all tiers. Check available models:

```bash
GONKA_API_KEY="sk-..." curl https://api.gonkarouter.io/v1/models
```

## Continuous Integration

To run these tests in CI/CD:

```yaml
# .github/workflows/test-gonka.yml
name: GonkaRouter Integration Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '22'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Unit tests
        run: npm run test:unit -- tests/unit/gonka-provider.test.ts
      
      - name: Integration tests
        run: GONKA_API_KEY=${{ secrets.GONKA_API_KEY }} npm run test:integration
        if: secrets.GONKA_API_KEY != ''
```

## Related Documentation

- [GonkaRouter Official Docs](https://www.gonkarouter.io)
- [OmniRoute Provider Integration](../architecture/PROVIDER_INTEGRATION.md)
- [Testing Guide](../ops/TESTING.md)
