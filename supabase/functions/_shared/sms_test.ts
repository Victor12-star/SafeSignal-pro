import { buildEmergencySms, normalizeProviderDestination } from "./sms.ts";
import { InfobipSmsProvider } from "./infobip.ts";

Deno.test("emergency SMS is truthful and includes current location when available", () => {
  const body = buildEmergencySms({
    senderName: "Victor",
    emergencyType: "MEDICAL",
    occurredAtIso: "2026-10-07T18:00:00Z",
    latitude: 59.3293,
    longitude: 18.0686,
  });

  assert(body.includes("SafeSignal alert from Victor."));
  assert(body.includes("Type: Medical."));
  assert(body.includes("https://maps.google.com/?q=59.3293,18.0686"));
  assert(!body.toLowerCase().includes("delivered"));
  assert(!body.toLowerCase().includes("police notified"));
});

Deno.test("provider destination strips plus only after E.164 validation", () => {
  assertEquals(normalizeProviderDestination("+46701234567"), "46701234567");
  assertThrows(() => normalizeProviderDestination("0701234567"));
});

Deno.test("Infobip adapter treats provider acceptance as SMS_SENT input, not delivery", async () => {
  let capturedBody = "";
  const provider = new InfobipSmsProvider(
    "https://example.api.infobip.com",
    "secret-test-key",
    "SafeSignal",
    async (_input, init) => {
      capturedBody = String(init?.body ?? "");
      return new Response(
        JSON.stringify({
          messages: [
            {
              messageId: "provider-message-1",
              status: { name: "PENDING_ACCEPTED" },
            },
          ],
        }),
        { status: 200 },
      );
    },
  );

  const result = await provider.send({
    toE164: "+2348031234567",
    body: "SafeSignal emergency test",
  });

  assertEquals(result.providerMessageId, "provider-message-1");
  assertEquals(result.providerStatus, "PENDING_ACCEPTED");
  assert(capturedBody.includes('"to":"2348031234567"'));
});

Deno.test("Infobip adapter fails closed when provider response lacks message ID", async () => {
  const provider = new InfobipSmsProvider(
    "https://example.api.infobip.com",
    "secret-test-key",
    "SafeSignal",
    async () => new Response(JSON.stringify({ messages: [] }), { status: 200 }),
  );

  await assertRejects(() =>
    provider.send({
      toE164: "+46701234567",
      body: "test",
    })
  );
});

function assert(condition: unknown, message = "Assertion failed"): asserts condition {
  if (!condition) throw new Error(message);
}

function assertEquals(actual: unknown, expected: unknown): void {
  if (actual !== expected) {
    throw new Error(`Expected ${String(expected)}, got ${String(actual)}`);
  }
}

function assertThrows(block: () => unknown): void {
  let threw = false;
  try {
    block();
  } catch {
    threw = true;
  }
  if (!threw) throw new Error("Expected function to throw");
}

async function assertRejects(block: () => Promise<unknown>): Promise<void> {
  let threw = false;
  try {
    await block();
  } catch {
    threw = true;
  }
  if (!threw) throw new Error("Expected promise to reject");
}
