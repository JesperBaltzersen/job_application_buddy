/**
 * OpenRouter Text Completion Service
 * 
 * Handles text/chat completion requests to OpenRouter API
 */

import type {
  IOpenRouterConfig,
  IOpenRouterTextService,
  TextGenerationRequest,
  TextGenerationResponse,
} from "./types";

export class OpenRouterTextService implements IOpenRouterTextService {
  constructor(private readonly config: IOpenRouterConfig) {}

  async completeText(request: TextGenerationRequest): Promise<TextGenerationResponse> {
    if (!this.config.apiKey) {
      throw new Error("Missing OPENROUTER_API_KEY in configuration");
    }

    // Use provided model or fallback to default
    const model = request.model || this.config.defaultTextModel;

    if (!model || typeof model !== "string" || model.trim() === "") {
      throw new Error("OpenRouter text model is required but was not provided or is invalid");
    }

    const baseUrl = this.config.baseUrl || "https://openrouter.ai/api/v1";
    const endpoint = `${baseUrl}/chat/completions`;

    const body = {
      model: model.trim(),
      // Use response_format to encourage JSON-only outputs
      response_format: { type: "json_object" },
      temperature: typeof request.temperature === "number" ? request.temperature : undefined,
      top_p: typeof request.topP === "number" ? request.topP : undefined,
      messages: [
        { role: "system", content: request.systemPrompt },
        { role: "user", content: JSON.stringify(request.userPayload) },
      ],
    } as Record<string, unknown>;

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${this.config.apiKey}`,
    };

    if (this.config.httpReferer) {
      headers["HTTP-Referer"] = this.config.httpReferer;
    }

    if (this.config.xTitle) {
      headers["X-Title"] = this.config.xTitle;
    }

    const res = await fetch(endpoint, {
      method: "POST",
      headers,
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const txt = await res.text().catch(() => "");
      throw new Error(`OpenRouter chat completion failed: ${res.status} ${txt}`);
    }

    const json = (await res.json()) as any;
    const content: string | undefined = json?.choices?.[0]?.message?.content;

    if (!content || typeof content !== "string") {
      throw new Error("OpenRouter response missing content");
    }

    return {
      text: content,
      model: json?.model || model,
      rawResponse: json,
    };
  }
}
