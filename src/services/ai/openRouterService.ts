import type { AIService } from "./aiServiceInterface";
import {
  createOpenRouterClient,
  DEFAULT_OPENROUTER_TEXT_MODEL,
  type IOpenRouterClient,
} from "../../../packages/openrouter-client/src/index";

/**
 * OpenRouter AI Service Implementation
 * 
 * Integrates with the OpenRouter client package to provide AI functionality.
 */
class OpenRouterService implements AIService {
  private client: IOpenRouterClient;

  constructor() {
    const apiKey = import.meta.env.VITE_OPENROUTER_API_KEY;
    
    if (!apiKey) {
      console.warn("VITE_OPENROUTER_API_KEY not set, AI features will use placeholders");
    }

    this.client = createOpenRouterClient({
      apiKey: apiKey || "placeholder",
      defaultTextModel: DEFAULT_OPENROUTER_TEXT_MODEL,
      defaultImageModel: "google/gemini-2.0-flash-001", // Not used for text
      httpReferer: window.location.origin,
      xTitle: "Resume Buddy",
    });
  }

  async extractKeywords(jobPosting: string): Promise<string[]> {
    const apiKey = import.meta.env.VITE_OPENROUTER_API_KEY;
    
    if (!apiKey) {
      // Fallback to simple extraction if API key not set
      console.warn("OpenRouter API key not set, using simple keyword extraction");
      return this.simpleKeywordExtraction(jobPosting);
    }

    try {
      const systemPrompt = `You are an expert at analyzing job postings and extracting relevant keywords.
Extract the most important keywords from the job posting, focusing on:
- Technical skills and technologies
- Required qualifications
- Key responsibilities and competencies
- Industry-specific terms

Return ONLY a JSON array of keyword strings, nothing else.`;

      const userPayload = {
        jobPosting,
      };

      const response = await this.client.completeText({
        systemPrompt,
        userPayload,
        temperature: 0.3,
      });

      // Parse JSON response
      try {
        const parsed = JSON.parse(response.text);
        
        if (Array.isArray(parsed)) {
          return parsed.filter((k) => typeof k === "string" && k.length > 0);
        }
        
        // If response is an object with a keywords array
        if (parsed.keywords && Array.isArray(parsed.keywords)) {
          return parsed.keywords.filter((k) => typeof k === "string" && k.length > 0);
        }
      } catch (parseError) {
        console.error("Failed to parse keywords JSON:", parseError);
      }

      // Fallback
      return this.simpleKeywordExtraction(jobPosting);
    } catch (error) {
      console.error("Error extracting keywords:", error);
      // Fallback to simple extraction on error
      return this.simpleKeywordExtraction(jobPosting);
    }
  }

  async suggestPhrasing(
    keyword: string,
    userExperience: string,
    jobContext: string
  ): Promise<string[]> {
    const apiKey = import.meta.env.VITE_OPENROUTER_API_KEY;
    
    if (!apiKey) {
      // Fallback to placeholder suggestions
      console.warn("OpenRouter API key not set, using placeholder suggestions");
      return [
        `Demonstrated expertise in ${keyword} through ${userExperience.substring(0, 50)}...`,
        `Successfully applied ${keyword} skills to deliver measurable results.`,
        `Proven track record in ${keyword} with hands-on experience in related technologies.`,
      ];
    }

    try {
      const systemPrompt = `You are an expert at crafting professional CV bullet points that match job requirements.
Generate 2-3 alternative phrasings for a CV bullet point that:
- Naturally incorporates the target keyword
- Highlights concrete achievements and impact
- Uses strong action verbs
- Is concise and professional (ideally one sentence)
- Matches the tone and style of the job posting

Return ONLY a JSON array of phrase strings, nothing else.`;

      const userPayload = {
        keyword,
        userExperience: userExperience || "Relevant professional experience",
        jobContext: jobContext.substring(0, 500), // Limit context length
      };

      const response = await this.client.completeText({
        systemPrompt,
        userPayload,
        temperature: 0.7,
      });

      // Parse JSON response
      try {
        const parsed = JSON.parse(response.text);
        
        if (Array.isArray(parsed)) {
          return parsed
            .filter((p) => typeof p === "string" && p.length > 0)
            .slice(0, 3); // Limit to 3 suggestions
        }
        
        // If response is an object with a phrases array
        if (parsed.phrases && Array.isArray(parsed.phrases)) {
          return parsed.phrases
            .filter((p) => typeof p === "string" && p.length > 0)
            .slice(0, 3);
        }
      } catch (parseError) {
        console.error("Failed to parse suggestions JSON:", parseError);
      }

      // Fallback
      return [
        `Demonstrated expertise in ${keyword} through ${userExperience.substring(0, 50)}...`,
        `Successfully applied ${keyword} skills to deliver measurable results.`,
      ];
    } catch (error) {
      console.error("Error generating suggestions:", error);
      // Fallback to placeholder suggestions
      return [
        `Demonstrated expertise in ${keyword} through ${userExperience.substring(0, 50)}...`,
        `Successfully applied ${keyword} skills to deliver measurable results.`,
      ];
    }
  }

  async analyzeKeywordMatch(phrase: string, keyword: string): Promise<boolean> {
    const apiKey = import.meta.env.VITE_OPENROUTER_API_KEY;
    
    if (!apiKey) {
      // Fallback to simple text matching
      return this.simpleTextMatch(phrase, keyword);
    }

    try {
      const systemPrompt = `You are an expert at analyzing whether a CV phrase addresses a specific keyword.
Determine if the given phrase effectively incorporates or demonstrates the keyword.
Consider semantic meaning, not just exact text matches.

Return ONLY a JSON object with a single boolean field "matches", nothing else.`;

      const userPayload = {
        phrase,
        keyword,
      };

      const response = await this.client.completeText({
        systemPrompt,
        userPayload,
        temperature: 0.2,
      });

      // Parse JSON response
      try {
        const parsed = JSON.parse(response.text);
        
        if (typeof parsed.matches === "boolean") {
          return parsed.matches;
        }
      } catch (parseError) {
        console.error("Failed to parse match analysis JSON:", parseError);
      }

      // Fallback to simple matching
      return this.simpleTextMatch(phrase, keyword);
    } catch (error) {
      console.error("Error analyzing keyword match:", error);
      // Fallback to simple matching on error
      return this.simpleTextMatch(phrase, keyword);
    }
  }

  private simpleKeywordExtraction(jobPosting: string): string[] {
    const words = jobPosting.toLowerCase().match(/\b\w{4,}\b/g) || [];
    const commonWords = new Set([
      "the", "that", "this", "with", "from", "have", "been", "will",
      "would", "could", "should", "your", "they", "their", "there",
      "what", "when", "where", "which", "about", "these", "those",
    ]);
    
    const keywords = [...new Set(words)]
      .filter(word => !commonWords.has(word))
      .slice(0, 20);
    
    return keywords;
  }

  private simpleTextMatch(phrase: string, keyword: string): boolean {
    const phraseLower = phrase.toLowerCase();
    const keywordLower = keyword.toLowerCase();
    
    // Check for exact match or partial match
    if (phraseLower.includes(keywordLower)) {
      return true;
    }
    
    // Word-level matching for multi-word keywords
    const keywordWords = keywordLower.split(/\s+/).filter(word => word.length > 3);
    if (keywordWords.length > 0) {
      return keywordWords.every(word => phraseLower.includes(word));
    }
    
    return false;
  }

  /**
   * Process PDF file using LLM to extract text content
   */
  async processPDF(pdfFile: File): Promise<string> {
    const apiKey = import.meta.env.VITE_OPENROUTER_API_KEY;
    
    if (!apiKey) {
      throw new Error("OpenRouter API key is required to process PDFs");
    }

    try {
      // Convert PDF to images (first page for now, can be extended)
      const imageBase64 = await this.pdfToImage(pdfFile);

      // Use a vision-capable model to extract text
      const systemPrompt = `You are an expert at extracting text from images. 
Extract ALL text content from the provided PDF page image. 
Return ONLY the extracted text, preserving the original formatting and structure as much as possible. 
Do not add any commentary or interpretation, just the raw text.`;

      // Send to vision-capable model (using GPT-4 Vision or similar)
      const baseUrl = "https://openrouter.ai/api/v1";
      const endpoint = `${baseUrl}/chat/completions`;
      
      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${apiKey}`,
          "HTTP-Referer": window.location.origin,
          "X-Title": "Resume Buddy",
        },
        body: JSON.stringify({
          model: "openai/gpt-4o", // Vision-capable model
          messages: [
            {
              role: "system",
              content: systemPrompt,
            },
            {
              role: "user",
              content: [
                {
                  type: "text",
                  text: "Extract all text from this PDF page image.",
                },
                {
                  type: "image_url",
                  image_url: {
                    url: `data:image/png;base64,${imageBase64}`,
                  },
                },
              ],
            },
          ],
          temperature: 0.1,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text().catch(() => "");
        throw new Error(`Failed to process PDF: ${response.status} ${errorText}`);
      }

      const json = (await response.json()) as any;
      const extractedText = json?.choices?.[0]?.message?.content;

      if (!extractedText || typeof extractedText !== "string") {
        throw new Error("Failed to extract text from PDF");
      }

      return extractedText;
    } catch (error) {
      console.error("Error processing PDF:", error);
      throw error;
    }
  }

  /**
   * Convert PDF file to base64 image (first page)
   */
  private async pdfToImage(pdfFile: File): Promise<string> {
    // Use pdf.js to render PDF page to canvas, then convert to base64
    const arrayBuffer = await pdfFile.arrayBuffer();
    
    // Dynamic import of pdfjs-dist
    const pdfjsLib = await import("pdfjs-dist");
    
    // Set worker (required for pdf.js) - use Vite's handling
    if (typeof window !== "undefined") {
      pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
        'pdfjs-dist/build/pdf.worker.min.mjs',
        import.meta.url
      ).toString();
    }

    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    const page = await pdf.getPage(1); // Get first page
    
    const viewport = page.getViewport({ scale: 2.0 });
    const canvas = document.createElement("canvas");
    const context = canvas.getContext("2d");
    
    if (!context) {
      throw new Error("Failed to get canvas context");
    }

    canvas.height = viewport.height;
    canvas.width = viewport.width;

    await page.render({
      canvasContext: context,
      viewport: viewport,
    }).promise;

    // Convert canvas to base64
    return canvas.toDataURL("image/png").split(",")[1];
  }
}

// Export singleton instance
export const openRouterService: AIService = new OpenRouterService();