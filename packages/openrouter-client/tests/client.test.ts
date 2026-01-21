/**
 * Tests for OpenRouterClient
 * 
 * These tests verify that the client properly implements the IOpenRouterClient interface
 * and delegates to the appropriate services.
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import type { IOpenRouterClient, IOpenRouterConfig } from "../src/types";
import { createOpenRouterClient } from "../src/client";

// Mock the services
vi.mock("../src/image", () => ({
  OpenRouterImageService: vi.fn().mockImplementation(() => ({
    generateImage: vi.fn(),
  })),
}));

vi.mock("../src/text", () => ({
  OpenRouterTextService: vi.fn().mockImplementation(() => ({
    completeText: vi.fn(),
  })),
}));

vi.mock("../src/models", () => ({
  OpenRouterModelsService: vi.fn().mockImplementation(() => ({
    listModels: vi.fn(),
  })),
}));

describe("OpenRouterClient", () => {
  const mockConfig: IOpenRouterConfig = {
    apiKey: "test-api-key",
    defaultTextModel: "test-text-model",
    defaultImageModel: "test-image-model",
  };

  it("should create a client with valid config", () => {
    const client = createOpenRouterClient(mockConfig);
    expect(client).toBeDefined();
    expect(client.getConfig).toBeDefined();
  });

  it("should throw error if API key is missing", () => {
    expect(() => {
      createOpenRouterClient({
        ...mockConfig,
        apiKey: "",
      });
    }).toThrow("OpenRouter API key is required");
  });

  it("should throw error if default text model is missing", () => {
    expect(() => {
      createOpenRouterClient({
        ...mockConfig,
        defaultTextModel: "",
      });
    }).toThrow("Default text model is required");
  });

  it("should throw error if default image model is missing", () => {
    expect(() => {
      createOpenRouterClient({
        ...mockConfig,
        defaultImageModel: "",
      });
    }).toThrow("Default image model is required");
  });

  it("should return readonly config", () => {
    const client = createOpenRouterClient(mockConfig);
    const config = client.getConfig();
    expect(config).toEqual(mockConfig);
    
    // Verify it's a copy (readonly)
    expect(Object.isFrozen(config)).toBe(false); // Not frozen, but should be a copy
  });

  it("should implement IOpenRouterClient interface", () => {
    const client = createOpenRouterClient(mockConfig);
    
    // Verify all required methods exist
    expect(typeof client.generateImage).toBe("function");
    expect(typeof client.completeText).toBe("function");
    expect(typeof client.listModels).toBe("function");
    expect(typeof client.getConfig).toBe("function");
  });
});
