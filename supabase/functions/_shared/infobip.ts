import {
  normalizeProviderDestination,
  type SmsAcceptedResult,
  type SmsProvider,
  type SmsSendRequest,
} from "./sms.ts";

type FetchLike = (
  input: string | URL | Request,
  init?: RequestInit,
) => Promise<Response>;

export class InfobipSmsProvider implements SmsProvider {
  constructor(
    private readonly baseUrl: string,
    private readonly apiKey: string,
    private readonly senderId: string,
    private readonly fetcher: FetchLike = fetch,
  ) {
    if (!baseUrl.trim() || !apiKey.trim() || !senderId.trim()) {
      throw new Error("Infobip SMS configuration is incomplete");
    }
  }

  async send(request: SmsSendRequest): Promise<SmsAcceptedResult> {
    const response = await this.fetcher(
      `${this.baseUrl.replace(/\/$/, "")}/sms/3/messages`,
      {
        method: "POST",
        headers: {
          Authorization: `App ${this.apiKey}`,
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messages: [
            {
              sender: this.senderId,
              destinations: [
                {
                  to: normalizeProviderDestination(request.toE164),
                },
              ],
              content: {
                text: request.body,
              },
            },
          ],
        }),
      },
    );

    const raw = await response.text();
    let payload: unknown;

    try {
      payload = raw ? JSON.parse(raw) : null;
    } catch {
      payload = null;
    }

    if (!response.ok) {
      throw new Error(`Infobip rejected SMS request with HTTP ${response.status}`);
    }

    const message = firstMessage(payload);
    if (!message?.messageId) {
      throw new Error("Infobip response did not include a message ID");
    }

    return {
      providerMessageId: message.messageId,
      providerStatus: message.status?.name ?? "ACCEPTED",
    };
  }
}

function firstMessage(payload: unknown): {
  messageId?: string;
  status?: { name?: string };
} | null {
  if (
    typeof payload !== "object" ||
    payload === null ||
    !("messages" in payload) ||
    !Array.isArray((payload as { messages?: unknown }).messages)
  ) {
    return null;
  }

  const value = (payload as { messages: unknown[] }).messages[0];
  return typeof value === "object" && value !== null
    ? value as { messageId?: string; status?: { name?: string } }
    : null;
}
