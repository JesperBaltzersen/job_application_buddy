import type { AIService } from "./ai/aiServiceInterface";

/**
 * Keyword Matcher Service
 * 
 * Handles matching keywords to phrases, both via text matching and AI semantic matching.
 */
export class KeywordMatcher {
  constructor(private aiService: AIService) {}

  /**
   * Checks if a phrase matches a keyword using both text and semantic matching.
   */
  async matchesKeyword(phrase: string, keyword: string): Promise<boolean> {
    // First try simple text matching for performance
    if (this.textMatches(phrase, keyword)) {
      return true;
    }
    
    // Fall back to AI semantic matching
    return await this.aiService.analyzeKeywordMatch(phrase, keyword);
  }

  /**
   * Simple text-based keyword matching.
   * Checks for exact matches and word-level matches.
   */
  private textMatches(phrase: string, keyword: string): boolean {
    const phraseLower = phrase.toLowerCase();
    const keywordLower = keyword.toLowerCase();
    
    // Exact match
    if (phraseLower.includes(keywordLower)) {
      return true;
    }
    
    // Word-level matching (for multi-word keywords)
    const keywordWords = keywordLower.split(/\s+/).filter(word => word.length > 3);
    if (keywordWords.length > 0) {
      const matchesAll = keywordWords.every(word => phraseLower.includes(word));
      if (matchesAll) {
        return true;
      }
    }
    
    return false;
  }

  /**
   * Finds all keywords that are matched by a given phrase.
   */
  async findMatchingKeywords(
    phrase: string,
    keywords: Array<{ text: string }>
  ): Promise<Array<{ text: string }>> {
    const matching: Array<{ text: string }> = [];
    
    for (const keyword of keywords) {
      if (await this.matchesKeyword(phrase, keyword.text)) {
        matching.push(keyword);
      }
    }
    
    return matching;
  }
}