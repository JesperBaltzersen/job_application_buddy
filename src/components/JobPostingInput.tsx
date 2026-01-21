import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Button } from "./ui/button";
import { Textarea } from "./ui/textarea";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { openRouterService } from "@/services/ai/openRouterService";
import { Upload, Link as LinkIcon, FileText, Loader2 } from "lucide-react";

interface JobPostingInputProps {
  onJobCreated?: (jobId: string) => void;
}

export default function JobPostingInput({ onJobCreated }: JobPostingInputProps) {
  const [inputMethod, setInputMethod] = useState<"text" | "url" | "pdf">("text");
  const [textContent, setTextContent] = useState("");
  const [url, setUrl] = useState("");
  const [selectedPdfFile, setSelectedPdfFile] = useState<File | null>(null);
  const [title, setTitle] = useState("");
  const [companyInfo, setCompanyInfo] = useState("");
  const [hiringManager, setHiringManager] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createJob = useMutation(api.jobs.create);
  const createKeywords = useMutation(api.keywords.createMany);

  const extractTextFromUrl = async (url: string): Promise<string> => {
    try {
      const response = await fetch(url);
      const html = await response.text();
      // Simple HTML text extraction (could be improved with a proper HTML parser)
      const div = document.createElement("div");
      div.innerHTML = html;
      return div.textContent || div.innerText || "";
    } catch (err) {
      throw new Error(`Failed to fetch URL: ${err instanceof Error ? err.message : "Unknown error"}`);
    }
  };


  const handleSubmit = async () => {
    setIsProcessing(true);
    setError(null);

    try {
      let jobText = "";

      // Extract text based on input method
      if (inputMethod === "text") {
        jobText = textContent;
      } else if (inputMethod === "url") {
        jobText = await extractTextFromUrl(url);
      } else if (inputMethod === "pdf") {
        // PDF handling will be done in handleFileUpload
        setIsProcessing(false);
        return;
      }

      if (!jobText.trim()) {
        throw new Error("Job posting text cannot be empty");
      }

      // Create job
      const jobId = await createJob({
        title: title || "Untitled Job Posting",
        description: jobText,
        companyInfo: companyInfo || undefined,
        hiringManager: hiringManager || undefined,
        sourceUrl: inputMethod === "url" ? url : undefined,
      });

      // Extract keywords using AI service
      const keywords = await openRouterService.extractKeywords(jobText);

      // Create keywords in database
      if (keywords.length > 0) {
        await createKeywords({
          jobId,
          keywords,
          isManuallyAdded: false,
        });
      }

      // Reset form
      setTextContent("");
      setUrl("");
      setTitle("");
      setCompanyInfo("");
      setHiringManager("");

      if (onJobCreated) {
        onJobCreated(jobId);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to process job posting");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedPdfFile(file);
      setError(null);
    }
  };

  const handleProcessPDF = async () => {
    if (!selectedPdfFile) return;

    setIsProcessing(true);
    setError(null);

    try {
      // Process PDF via LLM
      const jobText = await openRouterService.processPDF(selectedPdfFile);

      if (!jobText.trim()) {
        throw new Error("Could not extract text from PDF");
      }

      // Create job
      const jobId = await createJob({
        title: title || selectedPdfFile.name.replace(/\.pdf$/i, "") || "Untitled Job Posting",
        description: jobText,
        companyInfo: companyInfo || undefined,
        hiringManager: hiringManager || undefined,
      });

      // Extract keywords using AI service
      const keywords = await openRouterService.extractKeywords(jobText);

      // Create keywords in database
      if (keywords.length > 0) {
        await createKeywords({
          jobId,
          keywords,
          isManuallyAdded: false,
        });
      }

      // Reset form
      setTitle("");
      setCompanyInfo("");
      setHiringManager("");
      setSelectedPdfFile(null);

      if (onJobCreated) {
        onJobCreated(jobId);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to process PDF");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-6">
        {/* Input method selector */}
        <div className="flex gap-3 justify-center">
          <Button
            type="button"
            variant={inputMethod === "text" ? "default" : "outline"}
            size="lg"
            onClick={() => setInputMethod("text")}
            className={inputMethod === "text" 
              ? "bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 border-0" 
              : "glass border-white/20 hover:bg-white/10"}
          >
            <FileText className="mr-2 h-5 w-5" />
            Paste Text
          </Button>
          <Button
            type="button"
            variant={inputMethod === "url" ? "default" : "outline"}
            size="lg"
            onClick={() => setInputMethod("url")}
            className={inputMethod === "url" 
              ? "bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 border-0" 
              : "glass border-white/20 hover:bg-white/10"}
          >
            <LinkIcon className="mr-2 h-5 w-5" />
            URL
          </Button>
          <Button
            type="button"
            variant={inputMethod === "pdf" ? "default" : "outline"}
            size="lg"
            onClick={() => setInputMethod("pdf")}
            className={inputMethod === "pdf" 
              ? "bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 border-0" 
              : "glass border-white/20 hover:bg-white/10"}
          >
            <Upload className="mr-2 h-5 w-5" />
            Upload PDF
          </Button>
        </div>

        {/* Job details */}
        <div className="space-y-2">
          <Label htmlFor="title" className="text-sm font-medium text-muted-foreground">Job Title (optional)</Label>
          <Input
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g., Senior Software Engineer"
            className="glass border-white/20 bg-white/5 focus:bg-white/10"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="company" className="text-sm font-medium text-muted-foreground">Company Info (optional)</Label>
            <Input
              id="company"
              value={companyInfo}
              onChange={(e) => setCompanyInfo(e.target.value)}
              placeholder="Company name, industry, etc."
              className="glass border-white/20 bg-white/5 focus:bg-white/10"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="hiring-manager" className="text-sm font-medium text-muted-foreground">Hiring Manager (optional)</Label>
            <Input
              id="hiring-manager"
              value={hiringManager}
              onChange={(e) => setHiringManager(e.target.value)}
              placeholder="Name or title"
              className="glass border-white/20 bg-white/5 focus:bg-white/10"
            />
          </div>
        </div>

        {/* Content input based on method */}
        {inputMethod === "text" && (
          <div className="space-y-2">
            <Label htmlFor="job-text" className="text-sm font-medium text-muted-foreground">Job Posting Text</Label>
            <Textarea
              id="job-text"
              value={textContent}
              onChange={(e) => setTextContent(e.target.value)}
              placeholder="Paste the job posting text here..."
              rows={12}
              className="font-mono text-sm glass border-white/20 bg-white/5 focus:bg-white/10 resize-none"
            />
          </div>
        )}

        {inputMethod === "url" && (
          <div className="space-y-2">
            <Label htmlFor="job-url" className="text-sm font-medium text-muted-foreground">Job Posting URL</Label>
            <Input
              id="job-url"
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://..."
              className="glass border-white/20 bg-white/5 focus:bg-white/10"
            />
          </div>
        )}

        {inputMethod === "pdf" && (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="pdf-file" className="text-sm font-medium text-muted-foreground">Upload PDF File</Label>
              <div className="glass border-white/20 bg-white/5 rounded-md p-4 border-2 border-dashed hover:border-purple-500/50 transition-colors cursor-pointer">
                <Input
                  id="pdf-file"
                  type="file"
                  accept=".pdf"
                  onChange={handleFileSelect}
                  className="cursor-pointer file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-gradient-to-r file:from-purple-600 file:to-pink-600 file:text-white hover:file:from-purple-700 hover:file:to-pink-700"
                />
              </div>
              {selectedPdfFile && (
                <p className="text-sm text-muted-foreground">
                  Selected: {selectedPdfFile.name}
                </p>
              )}
            </div>
            <Button
              onClick={handleProcessPDF}
              disabled={isProcessing || !selectedPdfFile}
              className="w-full h-12 text-lg bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-purple-500/25"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Processing PDF...
                </>
              ) : (
                "Process PDF"
              )}
            </Button>
          </div>
        )}

        {error && (
          <div className="rounded-lg bg-red-500/10 border border-red-500/20 p-4 text-sm text-red-400">
            {error}
          </div>
        )}

        {(inputMethod === "text" || inputMethod === "url") && (
          <Button
            onClick={handleSubmit}
            disabled={isProcessing || (inputMethod === "text" && !textContent.trim()) || (inputMethod === "url" && !url.trim())}
            className="w-full h-12 text-lg bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-purple-500/25"
          >
            {isProcessing ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Processing...
              </>
            ) : (
              "Process Job Posting"
            )}
          </Button>
        )}
    </div>
  );
}