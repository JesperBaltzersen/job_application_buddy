/**
 * OpenRouter Client
 * 
 * Main client class that combines all OpenRouter services
 */

import type {
  IOpenRouterClient,
  IOpenRouterConfig,
  ImageGenerationRequest,
  ImageGenerationResponse,
  TextGenerationRequest,
  TextGenerationResponse,
  ListModelsResponse,
} from "./types";
import { OpenRouterImageService } from "./image";
import { OpenRouterTextService } from "./text";
import { OpenRouterModelsService } from "./models";

export class OpenRouterClient implements IOpenRouterClient {
  private readonly imageService: OpenRouterImageService;
  private readonly textService: OpenRouterTextService;
  private readonly modelsService: OpenRouterModelsService;
  private readonly config: IOpenRouterConfig;

  constructor(config: IOpenRouterConfig) {
    // Validate required config
    if (!config.apiKey) {
      throw new Error("OpenRouter API key is required");
    }
    if (!config.defaultTextModel) {
      throw new Error("Default text model is required");
    }
    if (!config.defaultImageModel) {
      throw new Error("Default image model is required");
    }

    this.config = { ...config };
    this.imageService = new OpenRouterImageService(this.config);
    this.textService = new OpenRouterTextService(this.config);
    this.modelsService = new OpenRouterModelsService(this.config);
  }

  /**
   * Generate an image using OpenRouter API
   */
  async generateImage(
    request: ImageGenerationRequest
  ): Promise<ImageGenerationResponse> {
    return this.imageService.generateImage(request);
  }

  /**
   * Generate text using OpenRouter API
   */
  async completeText(
    request: TextGenerationRequest
  ): Promise<TextGenerationResponse> {
    return this.textService.completeText(request);
  }

  /**
   * List available models from OpenRouter API
   */
  async listModels(): Promise<ListModelsResponse> {
    return this.modelsService.listModels();
  }

  /**
   * Get the current configuration
   */
  getConfig(): Readonly<IOpenRouterConfig> {
    return { ...this.config };
  }
}

/**
 * Factory function to create an OpenRouterClient instance
 * 
 * @param config Configuration for the OpenRouter client
 * @returns New OpenRouterClient instance
 */
export function createOpenRouterClient(
  config: IOpenRouterConfig
): IOpenRouterClient {
  return new OpenRouterClient(config);
}
