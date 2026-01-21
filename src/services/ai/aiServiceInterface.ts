/**
 * AI Service Interface
 * 
 * This interface defines the contract for AI services used in the application.
 * Implementations can be swapped without changing the rest of the codebase.
 */

export interface AIService {
  /**
   * Extracts keywords from a job posting text.
   * @param jobPosting - The full text of the job posting
   * @returns Array of extracted keywords/phrases
   */
  extractKeywords(jobPosting: string): Promise<string[]>;

  /**
   * Suggests phrasing alternatives for a keyword based on user experience and job context.
   * @param keyword - The keyword to generate phrasing for
   * @param userExperience - User's relevant experience or CV context
   * @param jobContext - Additional context from the job posting
   * @returns Array of suggested phrasings (typically 2-3 alternatives)
   */
  suggestPhrasing(
    keyword: string,
    userExperience: string,
    jobContext: string
  ): Promise<string[]>;

  /**
   * Analyzes whether a phrase matches or addresses a keyword.
   * Uses semantic matching, not just text matching.
   * @param phrase - The phrase to analyze
   * @param keyword - The keyword to match against
   * @returns True if the phrase addresses the keyword
   */
  analyzeKeywordMatch(phrase: string, keyword: string): Promise<boolean>;

  /**
   * Processes a PDF file using LLM to extract text content.
   * Converts PDF pages to images and uses vision-capable models to extract text.
   * @param pdfFile - The PDF file to process
   * @returns Extracted text content from the PDF
   */
  processPDF(pdfFile: File): Promise<string>;
}