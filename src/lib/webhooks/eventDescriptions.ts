export type WebhookEvent =
  | "request.completed"
  | "request.failed"
  | "provider.error"
  | "provider.recovered"
  | "quota.exceeded"
  | "combo.switched"
  | "security.login_locked"
  | "test.ping";

export interface EventDescription {
  label: string;
  description: string;
  emoji: string;
  exampleData: Record<string, unknown>;
}

export const EVENT_DESCRIPTIONS: Record<WebhookEvent, EventDescription> = {
  "request.completed": {
    label: "Request Completed",
    emoji: "✅",
    description: "Triggered when an upstream request completes successfully (HTTP 2xx).",
    exampleData: {
      model: "claude-opus-4-7",
      provider: "claude",
      latencyMs: 1240,
      tokensIn: 142,
      tokensOut: 38,
    },
  },
  "request.failed": {
    label: "Request Failed",
    emoji: "🚨",
    description: "Triggered when a request fails after all retries and fallback combo targets.",
    exampleData: {
      model: "claude-opus-4-7",
      provider: "claude",
      error: "503 Service Unavailable",
      attempts: 3,
    },
  },
  "provider.error": {
    label: "Provider Error",
    emoji: "⚠️",
    description: "A provider tripped the circuit breaker due to repeated failures.",
    exampleData: { provider: "openai", model: "gpt-4o", errorCode: 503, consecutiveFailures: 3 },
  },
  "provider.recovered": {
    label: "Provider Recovered",
    emoji: "✅",
    description: "A provider recovered from a circuit-breaker OPEN state.",
    exampleData: { provider: "openai", recoveredAfterMs: 60000 },
  },
  "quota.exceeded": {
    label: "Quota Exceeded",
    emoji: "📊",
    description: "A usage threshold (e.g. 95% of quota) was reached.",
    exampleData: { quota: "daily_tokens", used: 950000, limit: 1000000, pct: 95 },
  },
  "combo.switched": {
    label: "Combo Switched",
    emoji: "🔄",
    description: "Combo routing switched to a different target.",
    exampleData: {
      combo: "auto-fallback",
      fromModel: "gpt-4o",
      toModel: "claude-opus-4-7",
      reason: "provider.error",
    },
  },
  "security.login_locked": {
    label: "Login Locked",
    emoji: "🔒",
    description:
      "Repeated failed dashboard logins from one IP triggered the brute-force lockout. The payload never contains the attempted password.",
    exampleData: { ipAddress: "203.0.113.7", retryAfterSeconds: 900, sourceScope: "public" },
  },
  "test.ping": {
    label: "Test Ping",
    emoji: "🏓",
    description: "Manual test delivery to verify your webhook is reachable.",
    exampleData: { message: "Test ping from OmniRoute", webhookId: "preview" },
  },
};
