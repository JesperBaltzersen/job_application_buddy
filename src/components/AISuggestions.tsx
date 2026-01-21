import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Loader2, Copy, X } from "lucide-react";
import { openRouterService } from "@/services/ai/openRouterService";

interface AISuggestionsProps {
  keyword: string;
  userExperience: string;
  jobContext: string;
  onSelect: (suggestion: string) => void;
  onClose: () => void;
}

export default function AISuggestions({
  keyword,
  userExperience,
  jobContext,
  onSelect,
  onClose,
}: AISuggestionsProps) {
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const generateSuggestions = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const generated = await openRouterService.suggestPhrasing(
          keyword,
          userExperience || "Relevant professional experience",
          jobContext
        );
        setSuggestions(generated);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to generate suggestions");
      } finally {
        setIsLoading(false);
      }
    };

    generateSuggestions();
  }, [keyword, userExperience, jobContext]);

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg">AI Suggestions</CardTitle>
            <CardDescription>
              Suggestions for phrasing related to "{keyword}"
            </CardDescription>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {isLoading && (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            <span className="ml-2 text-sm text-muted-foreground">
              Generating suggestions...
            </span>
          </div>
        )}

        {error && (
          <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
            {error}
          </div>
        )}

        {!isLoading && !error && suggestions.length > 0 && (
          <div className="space-y-2">
            {suggestions.map((suggestion, index) => (
              <div
                key={index}
                className="group relative rounded-md border bg-card p-3 hover:bg-accent/50 transition-colors"
              >
                <p className="text-sm pr-8">{suggestion}</p>
                <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    onClick={() => handleCopy(suggestion)}
                    title="Copy"
                  >
                    <Copy className="h-3 w-3" />
                  </Button>
                  <Button
                    variant="default"
                    size="sm"
                    onClick={() => onSelect(suggestion)}
                  >
                    Use
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}

        {!isLoading && !error && suggestions.length === 0 && (
          <div className="text-center text-sm text-muted-foreground py-4">
            No suggestions generated
          </div>
        )}
      </CardContent>
    </Card>
  );
}