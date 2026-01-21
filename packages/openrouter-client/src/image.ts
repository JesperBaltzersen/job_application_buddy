/**
 * OpenRouter Image Generation Service
 * 
 * Handles image generation requests to OpenRouter API
 */

import type {
  IOpenRouterConfig,
  IOpenRouterImageService,
  ImageGenerationRequest,
  ImageGenerationResponse,
} from "./types";
import { decodeBase64ToArrayBuffer } from "./utils";

export class OpenRouterImageService implements IOpenRouterImageService {
  constructor(private readonly config: IOpenRouterConfig) {}

  async generateImage(request: ImageGenerationRequest): Promise<ImageGenerationResponse> {
    if (!this.config.apiKey) {
      throw new Error("Missing OPENROUTER_API_KEY in configuration");
    }

    // Use provided model or fallback to default
    const model = request.model || this.config.defaultImageModel;

    if (!model || typeof model !== "string" || model.trim() === "") {
      throw new Error("OpenRouter image model is required but was not provided or is invalid");
    }

    // Determine size based on targetSize or dimensions
    let size = "1024x1024";
    if (request.targetSize) {
      size = request.targetSize;
    } else if (request.width && request.height) {
      if (request.width === request.height) {
        size = "1024x1024";
      } else {
        const landscape = request.width > request.height;
        // DALL-E 3 supports: 1024x1024, 1024x1792, 1792x1024
        size = landscape ? "1792x1024" : "1024x1792";
      }
    }

    let prompt = `${request.systemPrompt}\n\n${request.userPrompt}`;
    if (request.negativePrompt) {
      prompt += `\n\nAvoid: ${request.negativePrompt}`;
    }

    const baseUrl = this.config.baseUrl || "https://openrouter.ai/api/v1";
    const endpoint = `${baseUrl}/chat/completions`;

    // Build the request body for chat completions with image generation
    const requestBody: Record<string, unknown> = {
      model,
      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],
      // Required: modalities parameter tells OpenRouter this is an image generation request
      modalities: ["image", "text"],
      stream: false,
    };

    // Add image generation specific parameters
    // Note: Some models may not support all parameters
    if (request.width && request.height) {
      requestBody.width = request.width;
      requestBody.height = request.height;
    }
    if (size) {
      requestBody.size = size;
    }
    if (request.seed !== undefined) requestBody.seed = request.seed;
    if (request.steps !== undefined) requestBody.steps = request.steps;
    if (request.guidance !== undefined) requestBody.guidance_scale = request.guidance;

    // For DALL-E 3, add quality and style
    if (model.toLowerCase().includes("dall-e-3")) {
      requestBody.quality =
        this.config.imageQuality === "hd" ? "hd" : "standard";
      requestBody.style =
        this.config.imageStyle === "natural" ? "natural" : "vivid";
    }

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

    const response = await fetch(endpoint, {
      method: "POST",
      headers,
      body: JSON.stringify(requestBody),
    });

    const responseText = await response.text();

    if (!response.ok) {
      let errorDetails = responseText;
      try {
        const errorJson = JSON.parse(responseText);
        errorDetails = JSON.stringify(errorJson, null, 2);
      } catch {
        // Keep as text if not JSON
      }

      const err = new Error(
        `OpenRouter image generation failed: ${response.status} ${response.statusText}`
      );
      (err as unknown as { responseText?: string; status?: number }).responseText =
        errorDetails;
      (err as unknown as { responseText?: string; status?: number }).status =
        response.status;
      throw err;
    }

    // OpenRouter returns image generation responses through chat completions
    // with images in the message content (either as multipart content or embedded)
    let json: any;
    try {
      json = JSON.parse(responseText);
    } catch (e) {
      const err = new Error(
        `OpenRouter image generation returned invalid JSON. Response: ${responseText.substring(0, 500)}`
      );
      (err as unknown as { responseText?: string; status?: number }).responseText =
        responseText;
      (err as unknown as { responseText?: string; status?: number }).status =
        response.status;
      throw err;
    }

    // Check if response is in chat completion format with image content
    // According to OpenRouter docs: https://openrouter.ai/docs/guides/overview/multimodal/image-generation
    // Images are returned in message.images array with structure:
    // { type: "image_url", image_url: { url: "data:image/png;base64,..." } }
    const message = json?.choices?.[0]?.message;

    if (!message) {
      const err = new Error("OpenRouter image response missing message field");
      (err as unknown as { responseText?: string; status?: number }).responseText =
        JSON.stringify(
          {
            hasChoices: !!json?.choices,
            choicesLength: json?.choices?.length,
            topLevelKeys: Object.keys(json || {}),
          },
          null,
          2
        );
      (err as unknown as { responseText?: string; status?: number }).status =
        response.status;
      throw err;
    }

    // Check for images array in message (primary format for OpenRouter image generation)
    if (message?.images && Array.isArray(message.images)) {
      for (const image of message.images) {
        if (image.type === "image_url" && image.image_url?.url) {
          const imageUrl = image.image_url.url;
          const blob = await this.parseImageUrl(imageUrl);
          if (blob) {
            return { image: blob, model: json?.model || model };
          }
        }
      }
    }

    // Fallback: Check for image in message content parts (alternative format)
    const content = message?.content;
    if (content && Array.isArray(content)) {
      for (const part of content) {
        if (part.type === "image_url" && part.image_url?.url) {
          const imageUrl = part.image_url.url;
          const blob = await this.parseImageUrl(imageUrl);
          if (blob) {
            return { image: blob, model: json?.model || model };
          }
        }
        if (part.type === "image" && part.image) {
          // Handle base64 image in part
          if (typeof part.image === "string") {
            if (part.image.startsWith("data:image/")) {
              const base64Match = part.image.match(/data:image\/([^;]+);base64,(.+)/);
              if (base64Match && base64Match[2]) {
                const mimeType = base64Match[1]
                  ? `image/${base64Match[1]}`
                  : "image/png";
                const arr = decodeBase64ToArrayBuffer(base64Match[2]);
                return {
                  image: new Blob([arr], { type: mimeType }),
                  model: json?.model || model,
                };
              }
            }
          }
        }
      }
    }

    if (content && typeof content === "string") {
      // Check if content is a URL
      if (content.startsWith("http://") || content.startsWith("https://")) {
        const imgRes = await fetch(content);
        if (!imgRes.ok) {
          const text = await imgRes.text();
          const err = new Error(
            `Failed to download image from URL: ${imgRes.status}`
          );
          (err as unknown as { responseText?: string; status?: number }).responseText =
            text;
          (err as unknown as { responseText?: string; status?: number }).status =
            imgRes.status;
          throw err;
        }
        const arr = await imgRes.arrayBuffer();
        const contentType = imgRes.headers.get("content-type") ?? "image/png";
        return {
          image: new Blob([arr], { type: contentType }),
          model: json?.model || model,
        };
      }

      // Check if content is base64 encoded image data
      if (content.startsWith("data:image/")) {
        const base64Match = content.match(/data:image\/[^;]+;base64,(.+)/);
        if (base64Match && base64Match[1]) {
          const arr = decodeBase64ToArrayBuffer(base64Match[1]);
          const mimeMatch = content.match(/data:image\/([^;]+)/);
          const mimeType = mimeMatch ? `image/${mimeMatch[1]}` : "image/png";
          return {
            image: new Blob([arr], { type: mimeType }),
            model: json?.model || model,
          };
        }
      }

      // Check if content is a plain base64 string (without data URL prefix)
      if (content.length > 100 && /^[A-Za-z0-9+/=]+$/.test(content.replace(/\s/g, ""))) {
        try {
          const arr = decodeBase64ToArrayBuffer(content);
          // Verify it's actually image data by checking if it's a reasonable size
          if (arr.byteLength > 100 && arr.byteLength < 10 * 1024 * 1024) {
            return {
              image: new Blob([arr], { type: "image/png" }),
              model: json?.model || model,
            };
          }
        } catch {
          // Not valid base64, continue to other checks
        }
      }
    }

    // Check for image_url field directly in the message
    if (message?.image_url) {
      const imgUrl =
        typeof message.image_url === "string"
          ? message.image_url
          : message.image_url.url;
      if (imgUrl) {
        const imgRes = await fetch(imgUrl);
        if (!imgRes.ok) {
          const text = await imgRes.text();
          const err = new Error(
            `Failed to download image from URL: ${imgRes.status}`
          );
          (err as unknown as { responseText?: string; status?: number }).responseText =
            text;
          (err as unknown as { responseText?: string; status?: number }).status =
            imgRes.status;
          throw err;
        }
        const arr = await imgRes.arrayBuffer();
        const contentType = imgRes.headers.get("content-type") ?? "image/png";
        return {
          image: new Blob([arr], { type: contentType }),
          model: json?.model || model,
        };
      }
    }

    // Check for direct image data format (similar to OpenAI)
    const first = json?.data?.[0];
    if (first) {
      if (first.b64_json) {
        const arr = decodeBase64ToArrayBuffer(first.b64_json);
        return {
          image: new Blob([arr], { type: "image/png" }),
          model: json?.model || model,
        };
      }
      if (first.url) {
        const imgRes = await fetch(first.url);
        if (!imgRes.ok) {
          const text = await imgRes.text();
          const err = new Error(
            `Failed to download image from URL: ${imgRes.status}`
          );
          (err as unknown as { responseText?: string; status?: number }).responseText =
            text;
          (err as unknown as { responseText?: string; status?: number }).status =
            imgRes.status;
          throw err;
        }
        const arr = await imgRes.arrayBuffer();
        const contentType = imgRes.headers.get("content-type") ?? "image/png";
        return {
          image: new Blob([arr], { type: contentType }),
          model: json?.model || model,
        };
      }
    }

    // Include response structure in error (without full content to avoid size limits)
    const responseSummary = {
      model: json?.model || model,
      requestedModel: model,
      hasChoices: !!json?.choices,
      choicesLength: json?.choices?.length,
      hasData: !!json?.data,
      dataLength: json?.data?.length,
      topLevelKeys: Object.keys(json || {}),
      messageKeys: message ? Object.keys(message) : undefined,
      hasImages: !!message?.images,
      imagesLength: Array.isArray(message?.images) ? message.images.length : undefined,
      firstChoiceContentType: typeof message?.content,
      firstChoiceContentIsArray: Array.isArray(message?.content),
      firstChoiceContentLength:
        typeof message?.content === "string" ? message.content.length : undefined,
      firstChoiceContentPreview:
        typeof message?.content === "string"
          ? message.content.substring(0, 200)
          : undefined,
      note: !message?.images
        ? "Response does not contain message.images array. The selected model may not support image generation, or the request format may be incorrect. Ensure the model has 'image' in its output_modalities and that modalities: ['image', 'text'] is included in the request."
        : undefined,
    };

    const responseSummaryStr = JSON.stringify(responseSummary, null, 2);
    const err = new Error(
      `OpenRouter image response missing image data. Response structure: ${responseSummaryStr}`
    );
    (err as unknown as { responseText?: string; status?: number }).responseText =
      responseSummaryStr;
    (err as unknown as { responseText?: string; status?: number }).status =
      response.status;
    throw err;
  }

  /**
   * Parse an image URL (base64 data URL or HTTP(S) URL) into a Blob
   */
  private async parseImageUrl(imageUrl: string): Promise<Blob | null> {
    // Check if it's a base64 data URL (most common format)
    if (imageUrl.startsWith("data:image/")) {
      const base64Match = imageUrl.match(/data:image\/([^;]+);base64,(.+)/);
      if (base64Match && base64Match[2]) {
        const mimeType = base64Match[1] ? `image/${base64Match[1]}` : "image/png";
        const arr = decodeBase64ToArrayBuffer(base64Match[2]);
        return new Blob([arr], { type: mimeType });
      }
    }

    // Check if it's a regular HTTP(S) URL
    if (imageUrl.startsWith("http://") || imageUrl.startsWith("https://")) {
      const imgRes = await fetch(imageUrl);
      if (!imgRes.ok) {
        const text = await imgRes.text();
        const err = new Error(
          `Failed to download image from URL: ${imgRes.status}`
        );
        (err as unknown as { responseText?: string; status?: number }).responseText =
          text;
        (err as unknown as { responseText?: string; status?: number }).status =
          imgRes.status;
        throw err;
      }
      const arr = await imgRes.arrayBuffer();
      const contentType = imgRes.headers.get("content-type") ?? "image/png";
      return new Blob([arr], { type: contentType });
    }

    return null;
  }
}
