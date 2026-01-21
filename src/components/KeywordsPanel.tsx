import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { Checkbox } from "./ui/checkbox";
import { Check, Copy, Plus, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface KeywordsPanelProps {
  jobId: Id<"jobs"> | null;
  selectedKeywordId: Id<"keywords"> | null;
  onKeywordSelect: (keywordId: Id<"keywords"> | null) => void;
}

export default function KeywordsPanel({
  jobId,
  selectedKeywordId,
  onKeywordSelect,
}: KeywordsPanelProps) {
  const [newKeyword, setNewKeyword] = useState("");

  const keywords = useQuery(
    api.keywords.list,
    jobId ? { jobId } : "skip"
  );

  const createKeyword = useMutation(api.keywords.create);
  const removeKeyword = useMutation(api.keywords.remove);

  const handleAddKeyword = async () => {
    if (!jobId || !newKeyword.trim()) return;

    try {
      await createKeyword({
        jobId,
        text: newKeyword.trim(),
        isManuallyAdded: true,
      });
      setNewKeyword("");
    } catch (error) {
      console.error("Failed to add keyword:", error);
    }
  };

  const handleRemoveKeyword = async (keywordId: Id<"keywords">) => {
    try {
      await removeKeyword({ id: keywordId });
      if (selectedKeywordId === keywordId) {
        onKeywordSelect(null);
      }
    } catch (error) {
      console.error("Failed to remove keyword:", error);
    }
  };

  const handleCopyKeyword = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  if (!jobId) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Keywords</CardTitle>
          <CardDescription>Select or create a job posting to see keywords</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const matchedCount = keywords?.filter((k) => k.isMatched).length || 0;
  const totalCount = keywords?.length || 0;

  return (
    <Card className="h-full flex flex-col">
      <CardHeader>
        <CardTitle>Keywords</CardTitle>
        <CardDescription>
          {totalCount > 0
            ? `${matchedCount} of ${totalCount} matched`
            : "No keywords yet"}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col space-y-4">
        {/* Add keyword input */}
        <div className="flex gap-2">
          <Input
            value={newKeyword}
            onChange={(e) => setNewKeyword(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                handleAddKeyword();
              }
            }}
            placeholder="Add keyword..."
            className="flex-1"
          />
          <Button onClick={handleAddKeyword} size="icon" variant="outline">
            <Plus className="h-4 w-4" />
          </Button>
        </div>

        {/* Keywords list */}
        <div className="flex-1 overflow-y-auto space-y-2">
          {keywords && keywords.length > 0 ? (
            keywords.map((keyword) => {
              const isSelected = selectedKeywordId === keyword._id;
              return (
                <div
                  key={keyword._id}
                  className={cn(
                    "flex items-center gap-2 p-2 rounded-md border transition-colors",
                    isSelected
                      ? "bg-primary/10 border-primary"
                      : "bg-card hover:bg-accent/50 border-border",
                    keyword.isMatched && "opacity-75"
                  )}
                >
                  <Checkbox
                    checked={keyword.isMatched}
                    disabled
                    className="pointer-events-none"
                  />
                  <button
                    onClick={() =>
                      onKeywordSelect(isSelected ? null : keyword._id)
                    }
                    className={cn(
                      "flex-1 text-left text-sm",
                      isSelected && "font-semibold"
                    )}
                  >
                    {keyword.text}
                  </button>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      onClick={() => handleCopyKeyword(keyword.text)}
                      title="Copy keyword"
                    >
                      <Copy className="h-3 w-3" />
                    </Button>
                    {keyword.isManuallyAdded && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => handleRemoveKeyword(keyword._id)}
                        title="Remove keyword"
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                </div>
              );
            })
          ) : (
            <div className="text-center text-sm text-muted-foreground py-8">
              No keywords yet. Add some manually or process a job posting.
            </div>
          )}
        </div>

        {/* Progress indicator */}
        {totalCount > 0 && (
          <div className="pt-2 border-t">
            <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
              <span>Progress</span>
              <span>
                {Math.round((matchedCount / totalCount) * 100)}%
              </span>
            </div>
            <div className="w-full bg-secondary h-2 rounded-full overflow-hidden">
              <div
                className="bg-primary h-full transition-all duration-300"
                style={{ width: `${(matchedCount / totalCount) * 100}%` }}
              />
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}