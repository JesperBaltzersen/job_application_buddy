/**
 * OpenRouter Models Service
 * 
 * Handles listing available models from OpenRouter API
 */

import type {
  IOpenRouterConfig,
  IOpenRouterModelsService,
  ListModelsResponse,
  OpenRouterModel,
  CategorizedModels,
} from "./types";

export class OpenRouterModelsService implements IOpenRouterModelsService {
  constructor(private readonly config: IOpenRouterConfig) {}

  async listModels(): Promise<ListModelsResponse> {
    if (!this.config.apiKey) {
      throw new Error("Missing OPENROUTER_API_KEY in configuration");
    }

    const baseUrl = this.config.baseUrl || "https://openrouter.ai/api/v1";
    const endpoint = `${baseUrl}/models`;

    const headers: Record<string, string> = {
      "Authorization": `Bearer ${this.config.apiKey}`,
    };

    if (this.config.httpReferer) {
      headers["HTTP-Referer"] = this.config.httpReferer;
    }

    if (this.config.xTitle) {
      headers["X-Title"] = this.config.xTitle;
    }

    const response = await fetch(endpoint, {
      method: "GET",
      headers,
    });

    if (!response.ok) {
      const text = await response.text().catch(() => "");
      const errorMessage = text
        ? `OpenRouter models API failed: ${response.status} - ${text}`
        : `OpenRouter models API failed: ${response.status}`;
      throw new Error(errorMessage);
    }

    let data: { data?: OpenRouterModel[] };
    try {
      data = (await response.json()) as { data?: OpenRouterModel[] };
    } catch (e) {
      throw new Error(
        `OpenRouter models API returned invalid JSON: ${e instanceof Error ? e.message : "Unknown error"}`
      );
    }

    if (!data.data || !Array.isArray(data.data)) {
      throw new Error(
        `OpenRouter models API returned invalid response format: expected data array, got ${typeof data.data}`
      );
    }

    const models = data.data;
    const categorized: CategorizedModels = {
      text: [],
      image: [],
    };

    for (const model of models) {
      // Categorize models based on architecture
      const outputModalities = model.architecture?.output_modalities || [];

      // Image generation models
      const isImageGenerationModel = outputModalities.includes("image");
      // Text generation models
      const isTextGenerationModel = outputModalities.includes("text");

      if (isImageGenerationModel) {
        categorized.image.push(model);
      } else if (isTextGenerationModel) {
        categorized.text.push(model);
      }
    }

    // Sort by name for better UX
    categorized.text.sort((a, b) => a.name.localeCompare(b.name));
    categorized.image.sort((a, b) => a.name.localeCompare(b.name));

    return { models: categorized };
  }
}
