/**
 * Tests for OpenRouterTextService
 * 
 * These tests verify text completion functionality with mocked HTTP responses.
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import { OpenRouterTextService } from "../src/text";
import type { IOpenRouterConfig, TextGenerationRequest } from "../src/types";

// Mock fetch globally
global.fetch = vi.fn();

describe("OpenRouterTextService", () => {
  const mockConfig: IOpenRouterConfig = {
    apiKey: "test-api-key",
    defaultTextModel: "test-text-model",
    defaultImageModel: "test-image-model",
  };

  let service: OpenRouterTextService;

  beforeEach(() => {
    service = new OpenRouterTextService(mockConfig);
    vi.clearAllMocks();
    vi.resetAllMocks();
  });

  it("should throw error if API key is missing", () => {
    const invalidConfig = { ...mockConfig, apiKey: "" };
    const invalidService = new OpenRouterTextService(invalidConfig);
    
    return expect(
      invalidService.completeText({
        systemPrompt: "test",
        userPayload: {},
      })
    ).rejects.toThrow("Missing OPENROUTER_API_KEY in configuration");
  });

  it("should throw error if model is invalid", async () => {
    // Mock fetch to prevent it from being called (validation should happen first)
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({}),
    });

    // Pass undefined to test the fallback to default, then override default with empty string
    const invalidConfig = { ...mockConfig, defaultTextModel: "" };
    const invalidService = new OpenRouterTextService(invalidConfig);
    
    await expect(
      invalidService.completeText({
        systemPrompt: "test",
        userPayload: {},
        model: undefined,
      })
    ).rejects.toThrow("OpenRouter text model is required");
  });

  it("should complete text successfully", async () => {
    const mockResponse = {
      choices: [
        {
          message: {
            content: '{"text": "Hello world", "conformance": {}}',
          },
        },
      ],
      model: "test-model",
    };

    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => mockResponse,
    });

    const result = await service.completeText({
      systemPrompt: "You are a helpful assistant",
      userPayload: { message: "Hello" },
    });

    expect(result.text).toBe('{"text": "Hello world", "conformance": {}}');
    expect(result.model).toBe("test-model");
  });

  it("should include temperature and topP in request", async () => {
    const mockResponse = {
      choices: [
        {
          message: {
            content: "test response",
          },
        },
      ],
      model: "test-model",
    };

    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => mockResponse,
    });

    await service.completeText({
      systemPrompt: "test",
      userPayload: {},
      temperature: 0.7,
      topP: 0.9,
    });

    expect(global.fetch).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        body: expect.stringContaining('"temperature":0.7'),
      })
    );
  });

  it("should throw error on API failure", async () => {
    (global.fetch as any).mockResolvedValueOnce({
      ok: false,
      status: 401,
      statusText: "Unauthorized",
      text: async () => "Invalid API key",
    });

    await expect(
      service.completeText({
        systemPrompt: "test",
        userPayload: {},
      })
    ).rejects.toThrow("OpenRouter chat completion failed: 401");
  });

  it("should throw error if response is missing content", async () => {
    const mockResponse = {
      choices: [
        {
          message: {},
        },
      ],
      model: "test-model",
    };

    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => mockResponse,
    });

    await expect(
      service.completeText({
        systemPrompt: "test",
        userPayload: {},
      })
    ).rejects.toThrow("OpenRouter response missing content");
  });
});
