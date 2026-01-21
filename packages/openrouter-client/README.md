# OpenRouter Client

A self-contained, testable TypeScript client for the OpenRouter API. This module provides a clean interface for interacting with OpenRouter's image generation, text completion, and model listing APIs.

## Features

- **Self-Contained**: No dependencies on the rest of the codebase
- **Type-Safe**: Full TypeScript support with clear interfaces
- **Testable**: Can be tested independently with mocked HTTP responses
- **Reusable**: Can be copied to other projects

## Installation

This is a local module within the project. To use it in another project, copy the entire `packages/openrouter-client/` directory.

## Usage

### Basic Example

```typescript
import {
  IOpenRouterClient,
  createOpenRouterClient,
  DEFAULT_OPENROUTER_TEXT_MODEL,
  DEFAULT_OPENROUTER_IMAGE_MODEL,
} from "./packages/openrouter-client/src";

// Create a client instance
const client = createOpenRouterClient({
  apiKey: process.env.OPENROUTER_API_KEY!,
  defaultTextModel: DEFAULT_OPENROUTER_TEXT_MODEL,
  defaultImageModel: DEFAULT_OPENROUTER_IMAGE_MODEL,
  httpReferer: process.env.OPENROUTER_HTTP_REFERER,
  xTitle: "My App",
});

// Generate an image
const imageResult = await client.generateImage({
  systemPrompt: "You are an image generator",
  userPrompt: "A beautiful sunset",
  width: 1024,
  height: 1024,
});

// Complete text
const textResult = await client.completeText({
  systemPrompt: "You are a helpful assistant",
  userPayload: { message: "Hello" },
  temperature: 0.7,
});

// List available models
const models = await client.listModels();
```

### Using the Interface

You can also use the `IOpenRouterClient` interface for dependency injection:

```typescript
import type { IOpenRouterClient } from "./packages/openrouter-client/src";

function myFunction(client: IOpenRouterClient) {
  return client.generateImage({ ... });
}
```

## API Reference

### `createOpenRouterClient(config: IOpenRouterConfig): IOpenRouterClient`

Creates a new OpenRouter client instance.

**Configuration:**
- `apiKey` (required): Your OpenRouter API key
- `defaultTextModel` (required): Default model for text completion
- `defaultImageModel` (required): Default model for image generation
- `httpReferer` (optional): HTTP Referer header for attribution
- `xTitle` (optional): X-Title header for attribution
- `imageQuality` (optional): Image quality for DALL-E 3 ("standard" | "hd")
- `imageStyle` (optional): Image style for DALL-E 3 ("vivid" | "natural")
- `baseUrl` (optional): Base URL for API (defaults to OpenRouter)

### `IOpenRouterClient`

Main interface providing:
- `generateImage(request: ImageGenerationRequest): Promise<ImageGenerationResponse>`
- `completeText(request: TextGenerationRequest): Promise<TextGenerationResponse>`
- `listModels(): Promise<ListModelsResponse>`
- `getConfig(): Readonly<IOpenRouterConfig>`

## Testing

Tests are located in the `tests/` directory. To run tests, install dependencies and use your preferred test runner:

```bash
cd packages/openrouter-client
npm install
npm test
```

Tests use mocked HTTP responses to verify functionality without making actual API calls.

## Architecture

The module is organized as follows:

- `src/types.ts` - All TypeScript interfaces and types
- `src/client.ts` - Main client implementation
- `src/image.ts` - Image generation service
- `src/text.ts` - Text completion service
- `src/models.ts` - Model listing service
- `src/utils.ts` - Utility functions
- `src/index.ts` - Main exports

## Default Models

- `DEFAULT_OPENROUTER_TEXT_MODEL`: "deepseek/deepseek-chat"
- `DEFAULT_OPENROUTER_IMAGE_MODEL`: "black-forest-labs/flux-pro"

## License

Part of the story-image-visualizer project.
