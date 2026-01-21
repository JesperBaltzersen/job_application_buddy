/**
 * Tests for OpenRouterImageService
 * 
 * These tests verify image generation functionality with mocked HTTP responses.
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import { OpenRouterImageService } from "../src/image";
import type { IOpenRouterConfig, ImageGenerationRequest } from "../src/types";

// Mock fetch globally
global.fetch = vi.fn();

describe("OpenRouterImageService", () => {
  const mockConfig: IOpenRouterConfig = {
    apiKey: "test-api-key",
    defaultTextModel: "test-text-model",
    defaultImageModel: "test-image-model",
  };

  let service: OpenRouterImageService;

  beforeEach(() => {
    service = new OpenRouterImageService(mockConfig);
    vi.clearAllMocks();
    vi.resetAllMocks();
  });

  it("should throw error if API key is missing", () => {
    const invalidConfig = { ...mockConfig, apiKey: "" };
    const invalidService = new OpenRouterImageService(invalidConfig);
    
    return expect(
      invalidService.generateImage({
        systemPrompt: "test",
        userPrompt: "test",
      })
    ).rejects.toThrow("Missing OPENROUTER_API_KEY in configuration");
  });

  it("should throw error if model is invalid", async () => {
    // Mock fetch to prevent it from being called (validation should happen first)
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      status: 200,
      text: async () => "{}",
    });

    // Pass undefined to test the fallback to default, then override default with empty string
    const invalidConfig = { ...mockConfig, defaultImageModel: "" };
    const invalidService = new OpenRouterImageService(invalidConfig);
    
    await expect(
      invalidService.generateImage({
        systemPrompt: "test",
        userPrompt: "test",
        model: undefined,
      })
    ).rejects.toThrow("OpenRouter image model is required");
  });

  it("should generate image from base64 data URL", async () => {
    const mockResponse = {
      choices: [
        {
          message: {
            images: [
              {
                type: "image_url",
                image_url: {
                  url: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
                },
              },
            ],
          },
        },
      ],
      model: "test-model",
    };

    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      status: 200,
      text: async () => JSON.stringify(mockResponse),
    });

    const result = await service.generateImage({
      systemPrompt: "test system",
      userPrompt: "test user",
    });

    expect(result.image).toBeInstanceOf(Blob);
    expect(result.model).toBe("test-model");
  });

  it("should handle HTTP image URLs", async () => {
    const mockResponse = {
      choices: [
        {
          message: {
            images: [
              {
                type: "image_url",
                image_url: {
                  url: "https://example.com/image.png",
                },
              },
            ],
          },
        },
      ],
      model: "test-model",
    };

    const mockImageBlob = new Blob(["fake image data"], { type: "image/png" });

    (global.fetch as any)
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        text: async () => JSON.stringify(mockResponse),
      })
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Map([["content-type", "image/png"]]),
        arrayBuffer: async () => new ArrayBuffer(10),
      });

    const result = await service.generateImage({
      systemPrompt: "test system",
      userPrompt: "test user",
    });

    expect(result.image).toBeInstanceOf(Blob);
  });

  it("should throw error on API failure", async () => {
    (global.fetch as any).mockResolvedValueOnce({
      ok: false,
      status: 401,
      statusText: "Unauthorized",
      text: async () => "Invalid API key",
    });

    await expect(
      service.generateImage({
        systemPrompt: "test",
        userPrompt: "test",
      })
    ).rejects.toThrow("OpenRouter image generation failed");
  });

  it("should throw error if response is missing image data", async () => {
    const mockResponse = {
      choices: [
        {
          message: {
            content: "text only, no image",
          },
        },
      ],
      model: "test-model",
    };

    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      status: 200,
      text: async () => JSON.stringify(mockResponse),
    });

    await expect(
      service.generateImage({
        systemPrompt: "test",
        userPrompt: "test",
      })
    ).rejects.toThrow("OpenRouter image response missing image data");
  });
});
