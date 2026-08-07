import {
  BedrockRuntimeClient,
  InvokeModelCommand,
} from "@aws-sdk/client-bedrock-runtime";

function getClient() {
  return new BedrockRuntimeClient({
    region: process.env.AWS_REGION ?? "us-east-1",
  });
}

export function getEmbeddingDimensions(): number {
  return Number(process.env.EMBEDDING_DIMENSIONS ?? "1024");
}

function formatBedrockError(err: unknown, modelId: string): Error {
  const raw = err instanceof Error ? err.message : String(err);
  if (
    /use case details|end of its life|deprecated|isn't supported|AccessDenied|not authorized/i.test(
      raw
    )
  ) {
    return new Error(
      `${raw} (model: ${modelId}). For Anthropic Claude, submit the Bedrock use-case form in AWS Console. Or set BEDROCK_CHAT_MODEL=amazon.nova-pro-v1:0 (works without that form).`
    );
  }
  return err instanceof Error ? err : new Error(raw);
}

function isNovaModel(modelId: string): boolean {
  return modelId.includes("amazon.nova");
}

function isAnthropicModel(modelId: string): boolean {
  return modelId.includes("anthropic.claude");
}

export async function embedText(text: string): Promise<number[]> {
  const modelId =
    process.env.BEDROCK_EMBED_MODEL ?? "amazon.titan-embed-text-v2:0";
  const dimensions = getEmbeddingDimensions();

  const body = {
    inputText: text.slice(0, 8000),
    dimensions,
    normalize: true,
  };

  try {
    const response = await getClient().send(
      new InvokeModelCommand({
        modelId,
        contentType: "application/json",
        accept: "application/json",
        body: JSON.stringify(body),
      })
    );

    const payload = JSON.parse(new TextDecoder().decode(response.body));
    if (!Array.isArray(payload.embedding)) {
      throw new Error("Unexpected Titan embedding response shape");
    }
    return payload.embedding as number[];
  } catch (err) {
    throw formatBedrockError(err, modelId);
  }
}

function buildChatBody(
  modelId: string,
  opts: {
    system: string;
    messages: Array<{ role: "user" | "assistant"; content: string }>;
    maxTokens: number;
  }
): Record<string, unknown> {
  if (isNovaModel(modelId)) {
    return {
      system: [{ text: opts.system }],
      messages: opts.messages.map((m) => ({
        role: m.role,
        content: [{ text: m.content }],
      })),
      inferenceConfig: { maxTokens: opts.maxTokens },
    };
  }

  // Anthropic Claude (Messages API on Bedrock)
  return {
    anthropic_version: "bedrock-2023-05-31",
    max_tokens: opts.maxTokens,
    system: opts.system,
    messages: opts.messages.map((m) => ({
      role: m.role,
      content: [{ type: "text", text: m.content }],
    })),
  };
}

function extractChatText(modelId: string, payload: unknown): string {
  const p = payload as Record<string, unknown>;

  if (isNovaModel(modelId)) {
    const output = p.output as
      | { message?: { content?: Array<{ text?: string }> } }
      | undefined;
    const text = output?.message?.content?.[0]?.text;
    if (typeof text === "string") return text;
  }

  if (isAnthropicModel(modelId) || Array.isArray(p.content)) {
    const content = p.content as Array<{ text?: string }> | undefined;
    const text = content?.[0]?.text;
    if (typeof text === "string") return text;
  }

  throw new Error("Unexpected Bedrock chat response shape");
}

export async function chatCompletion(opts: {
  system: string;
  messages: Array<{ role: "user" | "assistant"; content: string }>;
  maxTokens?: number;
}): Promise<string> {
  // Default to Nova Pro — Claude requires Anthropic use-case form in Bedrock
  const modelId =
    process.env.BEDROCK_CHAT_MODEL ?? "amazon.nova-pro-v1:0";
  const maxTokens = opts.maxTokens ?? 2048;
  const body = buildChatBody(modelId, { ...opts, maxTokens });

  try {
    const response = await getClient().send(
      new InvokeModelCommand({
        modelId,
        contentType: "application/json",
        accept: "application/json",
        body: JSON.stringify(body),
      })
    );

    const payload = JSON.parse(new TextDecoder().decode(response.body));
    return extractChatText(modelId, payload);
  } catch (err) {
    throw formatBedrockError(err, modelId);
  }
}
