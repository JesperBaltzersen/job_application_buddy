/**
 * OpenRouter Client - Main Entry Point
 * 
 * Self-contained OpenRouter API client with TypeScript interfaces
 * 
 * @example
 * ```typescript
 * import { IOpenRouterClient, createOpenRouterClient, DEFAULT_OPENROUTER_TEXT_MODEL, DEFAULT_OPENROUTER_IMAGE_MODEL } from '@/packages/openrouter-client';
 * 
 * const client = createOpenRouterClient({
 *   apiKey: process.env.OPENROUTER_API_KEY!,
 *   defaultTextModel: DEFAULT_OPENROUTER_TEXT_MODEL,
 *   defaultImageModel: DEFAULT_OPENROUTER_IMAGE_MODEL,
 * });
 * 
 * const result = await client.completeText({ ... });
 * ```
 */

// Export all types and interfaces
export type {
  IOpenRouterClient,
  IOpenRouterConfig,
  IOpenRouterImageService,
  IOpenRouterTextService,
  IOpenRouterModelsService,
  ImageGenerationRequest,
  ImageGenerationResponse,
  TextGenerationRequest,
  TextGenerationResponse,
  ListModelsResponse,
  OpenRouterModel,
  CategorizedModels,
  ImageSize,
} from "./types";

// Export client implementation and factory
export { OpenRouterClient, createOpenRouterClient } from "./client";

// Export default model constants
export const DEFAULT_OPENROUTER_TEXT_MODEL = "openai/gpt-5.2";
export const DEFAULT_OPENROUTER_IMAGE_MODEL = "google/gemini-2.0-flash-001";
