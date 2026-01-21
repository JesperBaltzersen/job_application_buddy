import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Copy, Edit, Trash2, CheckCircle2 } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";

interface SavedPhrasesPanelProps {
  jobId: Id<"jobs"> | null;
  selectedKeywordId: Id<"keywords"> | null;
  onEditPhrase?: (phraseId: Id<"phrases">, content: string) => void;
}

export default function SavedPhrasesPanel({
  jobId,
  selectedKeywordId,
  onEditPhrase,
}: SavedPhrasesPanelProps) {
  const phrases = useQuery(
    api.phrases.list,
    jobId ? { jobId } : "skip"
  );

  const keywords = useQuery(
    api.keywords.list,
    jobId ? { jobId } : "skip"
  );

  const removePhrase = useMutation(api.phrases.remove);

  const savedPhrases = phrases?.filter((p) => p.status === "saved") || [];

  // Group phrases by keyword
  const phrasesByKeyword = savedPhrases.reduce((acc, phrase) => {
    const keyword = keywords?.find((k) => k._id === phrase.keywordId);
    if (!keyword) return acc;

    if (!acc[keyword._id]) {
      acc[keyword._id] = {
        keyword,
        phrases: [],
      };
    }
    acc[keyword._id].phrases.push(phrase);
    return acc;
  }, {} as Record<string, { keyword: NonNullable<typeof keywords>[0]; phrases: typeof savedPhrases }>);

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const handleDelete = async (phraseId: Id<"phrases">) => {
    if (confirm("Are you sure you want to delete this phrase?")) {
      try {
        await removePhrase({ id: phraseId });
      } catch (error) {
        console.error("Failed to delete phrase:", error);
      }
    }
  };

  const handleEdit = (phraseId: Id<"phrases">, content: string) => {
    if (onEditPhrase) {
      onEditPhrase(phraseId, content);
    }
  };

  if (!jobId) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Saved Phrases</CardTitle>
          <CardDescription>
            Save phrases to see them here, grouped by keyword
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const groupedEntries = Object.values(phrasesByKeyword);

  return (
    <Card className="h-full flex flex-col">
      <CardHeader>
        <CardTitle>Saved Phrases</CardTitle>
        <CardDescription>
          {savedPhrases.length > 0
            ? `${savedPhrases.length} saved phrase${savedPhrases.length !== 1 ? "s" : ""}`
            : "No saved phrases yet"}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex-1 overflow-y-auto space-y-4">
        {groupedEntries.length > 0 ? (
          groupedEntries.map(({ keyword, phrases: keywordPhrases }) => {
            const isSelected = selectedKeywordId === keyword._id;
            return (
              <div
                key={keyword._id}
                className={`space-y-2 rounded-md border p-3 ${
                  isSelected ? "bg-primary/5 border-primary" : "bg-card"
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {keyword.isMatched && (
                      <CheckCircle2 className="h-4 w-4 text-primary" />
                    )}
                    <h4 className="font-semibold text-sm">{keyword.text}</h4>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {keywordPhrases.length} phrase{keywordPhrases.length !== 1 ? "s" : ""}
                  </span>
                </div>
                <div className="space-y-2">
                  {keywordPhrases.map((phrase) => (
                    <div
                      key={phrase._id}
                      className="group relative rounded-md border bg-background p-2 text-sm hover:bg-accent/50 transition-colors"
                    >
                      <p className="pr-16">{phrase.content}</p>
                      <div className="absolute top-1 right-1 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          onClick={() => handleCopy(phrase.content)}
                          title="Copy phrase"
                        >
                          <Copy className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          onClick={() => handleEdit(phrase._id, phrase.content)}
                          title="Edit phrase"
                        >
                          <Edit className="h-3 w-3" />
                        </Button>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7"
                              title="More options"
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onClick={() => handleDelete(phrase._id)}
                              className="text-destructive"
                            >
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })
        ) : (
          <div className="text-center text-sm text-muted-foreground py-8">
            No saved phrases yet. Create and save phrases in the editor to see them here.
          </div>
        )}
      </CardContent>
    </Card>
  );
}