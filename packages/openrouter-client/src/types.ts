/**
 * OpenRouter Client Types and Interfaces
 * 
 * This module defines all TypeScript interfaces and types for the OpenRouter client.
 * All types are self-contained and do not depend on external project files.
 */

// ============================================================================
// Configuration Types
// ============================================================================

export interface IOpenRouterConfig {
  /** OpenRouter API key (required) */
  apiKey: string;
  
  /** Default text model to use when none is specified */
  defaultTextModel: string;
  
  /** Default image model to use when none is specified */
  defaultImageModel: string;
  
  /** HTTP Referer header for OpenRouter attribution (optional) */
  httpReferer?: string;
  
  /** X-Title header for OpenRouter attribution (optional) */
  xTitle?: string;
  
  /** Image quality setting for DALL-E 3 models (optional) */
  imageQuality?: "standard" | "hd";
  
  /** Image style setting for DALL-E 3 models (optional) */
  imageStyle?: "vivid" | "natural";
  
  /** Base URL for OpenRouter API (defaults to https://openrouter.ai/api/v1) */
  baseUrl?: string;
}

// ============================================================================
// Image Generation Types
// ============================================================================

export type ImageSize =
  | "256x256"
  | "512x512"
  | "1024x1024"
  | "1024x1536"
  | "1536x1024"
  | "1024x1792"
  | "1792x1024";

export interface ImageGenerationRequest {
  /** System prompt for image generation */
  systemPrompt: string;
  
  /** User prompt for image generation */
  userPrompt: string;
  
  /** Negative prompt (things to avoid) */
  negativePrompt?: string;
  
  /** Image width in pixels */
  width?: number;
  
  /** Image height in pixels */
  height?: number;
  
  /** Target size as a string (e.g., "1024x1024") */
  targetSize?: ImageSize;
  
  /** Seed for reproducible generation */
  seed?: number;
  
  /** Number of steps for generation */
  steps?: number;
  
  /** Guidance scale */
  guidance?: number;
  
  /** Initial image as ArrayBuffer (for img2img) */
  initImage?: ArrayBuffer;
  
  /** Specific model to use (overrides default) */
  model?: string;
}

export interface ImageGenerationResponse {
  /** Generated image as Blob */
  image: Blob;
  
  /** Model used for generation */
  model: string;
}

// ============================================================================
// Text Generation Types
// ============================================================================

export interface TextGenerationRequest {
  /** System prompt/instruction */
  systemPrompt: string;
  
  /** User payload (will be JSON stringified) */
  userPayload: Record<string, unknown>;
  
  /** Temperature for generation (0-2) */
  temperature?: number;
  
  /** Top-p sampling parameter (0-1) */
  topP?: number;
  
  /** Specific model to use (overrides default) */
  model?: string;
}

export interface TextGenerationResponse {
  /** Generated text content */
  text: string;
  
  /** Model used for generation */
  model: string;
  
  /** Raw response from API (for advanced use cases) */
  rawResponse?: unknown;
}

// ============================================================================
// Model Listing Types
// ============================================================================

export interface OpenRouterModel {
  id: string;
  name: string;
  description?: string;
  pricing?: {
    prompt?: string;
    completion?: string;
  };
  context_length?: number;
  architecture?: {
    modality?: string;
    tokenizer?: string;
    instruct_type?: string;
    output_modalities?: string[];
  };
  top_provider?: {
    name?: string;
    max_completion_tokens?: number;
  };
  per_request_limits?: {
    prompt_tokens?: string;
    completion_tokens?: string;
  };
}

export interface CategorizedModels {
  text: OpenRouterModel[];
  image: OpenRouterModel[];
}

export interface ListModelsResponse {
  models: CategorizedModels;
}

// ============================================================================
// Service Interfaces
// ============================================================================

export interface IOpenRouterImageService {
  /**
   * Generate an image using OpenRouter API
   * @param request Image generation request
   * @returns Promise resolving to the generated image
   * @throws Error if generation fails
   */
  generateImage(request: ImageGenerationRequest): Promise<ImageGenerationResponse>;
}

export interface IOpenRouterTextService {
  /**
   * Generate text using OpenRouter API
   * @param request Text generation request
   * @returns Promise resolving to the generation result
   * @throws Error if generation fails
   */
  completeText(request: TextGenerationRequest): Promise<TextGenerationResponse>;
}

export interface IOpenRouterModelsService {
  /**
   * List available models from OpenRouter API
   * @returns Promise resolving to categorized models
   * @throws Error if listing fails
   */
  listModels(): Promise<ListModelsResponse>;
}

// ============================================================================
// Main Client Interface
// ============================================================================

export interface IOpenRouterClient
  extends IOpenRouterImageService,
          IOpenRouterTextService,
          IOpenRouterModelsService {
  /**
   * Get the current configuration
   */
  getConfig(): Readonly<IOpenRouterConfig>;
}
