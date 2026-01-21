/**
 * Tests for OpenRouterModelsService
 * 
 * These tests verify model listing functionality with mocked HTTP responses.
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import { OpenRouterModelsService } from "../src/models";
import type { IOpenRouterConfig } from "../src/types";

// Mock fetch globally
global.fetch = vi.fn();

describe("OpenRouterModelsService", () => {
  const mockConfig: IOpenRouterConfig = {
    apiKey: "test-api-key",
    defaultTextModel: "test-text-model",
    defaultImageModel: "test-image-model",
  };

  let service: OpenRouterModelsService;

  beforeEach(() => {
    service = new OpenRouterModelsService(mockConfig);
    vi.clearAllMocks();
  });

  it("should throw error if API key is missing", () => {
    const invalidConfig = { ...mockConfig, apiKey: "" };
    const invalidService = new OpenRouterModelsService(invalidConfig);
    
    return expect(invalidService.listModels()).rejects.toThrow(
      "Missing OPENROUTER_API_KEY in configuration"
    );
  });

  it("should list models successfully", async () => {
    const mockResponse = {
      data: [
        {
          id: "model-1",
          name: "Text Model",
          architecture: {
            output_modalities: ["text"],
          },
        },
        {
          id: "model-2",
          name: "Image Model",
          architecture: {
            output_modalities: ["image"],
          },
        },
      ],
    };

    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => mockResponse,
    });

    const result = await service.listModels();

    expect(result.models.text).toHaveLength(1);
    expect(result.models.image).toHaveLength(1);
    expect(result.models.text[0].id).toBe("model-1");
    expect(result.models.image[0].id).toBe("model-2");
  });

  it("should categorize models correctly", async () => {
    const mockResponse = {
      data: [
        {
          id: "text-1",
          name: "Text Model 1",
          architecture: {
            output_modalities: ["text"],
          },
        },
        {
          id: "text-2",
          name: "Text Model 2",
          architecture: {
            output_modalities: ["text"],
          },
        },
        {
          id: "image-1",
          name: "Image Model 1",
          architecture: {
            output_modalities: ["image"],
          },
        },
      ],
    };

    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => mockResponse,
    });

    const result = await service.listModels();

    expect(result.models.text).toHaveLength(2);
    expect(result.models.image).toHaveLength(1);
  });

  it("should sort models by name", async () => {
    const mockResponse = {
      data: [
        {
          id: "model-z",
          name: "Z Model",
          architecture: {
            output_modalities: ["text"],
          },
        },
        {
          id: "model-a",
          name: "A Model",
          architecture: {
            output_modalities: ["text"],
          },
        },
      ],
    };

    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => mockResponse,
    });

    const result = await service.listModels();

    expect(result.models.text[0].name).toBe("A Model");
    expect(result.models.text[1].name).toBe("Z Model");
  });

  it("should throw error on API failure", async () => {
    (global.fetch as any).mockResolvedValueOnce({
      ok: false,
      status: 401,
      statusText: "Unauthorized",
      text: async () => "Invalid API key",
    });

    await expect(service.listModels()).rejects.toThrow(
      "OpenRouter models API failed"
    );
  });

  it("should throw error if response format is invalid", async () => {
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({ invalid: "format" }),
    });

    await expect(service.listModels()).rejects.toThrow(
      "OpenRouter models API returned invalid response format"
    );
  });
});
