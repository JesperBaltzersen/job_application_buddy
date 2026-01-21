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
}

// Export singleton instance
export const openRouterService: AIService = new OpenRouterService();