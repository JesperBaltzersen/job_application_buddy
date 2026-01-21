import { useState, useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Textarea } from "./ui/textarea";
import { Button } from "./ui/button";
import { Label } from "./ui/label";
import { Sparkles, Save, Loader2 } from "lucide-react";
import { openRouterService } from "@/services/ai/openRouterService";
import AISuggestions from "./AISuggestions";

interface PhraseEditorProps {
  jobId: Id<"jobs"> | null;
  selectedKeywordId: Id<"keywords"> | null;
  editingPhraseId?: Id<"phrases"> | null;
  editingPhraseContent?: string;
  onEditComplete?: () => void;
}

export default function PhraseEditor({
  jobId,
  selectedKeywordId,
  editingPhraseId,
  editingPhraseContent,
  onEditComplete,
}: PhraseEditorProps) {
  const [phraseText, setPhraseText] = useState("");
  const [isGeneratingSuggestions, setIsGeneratingSuggestions] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [userExperience, setUserExperience] = useState("");

  const keyword = useQuery(
    api.keywords.list,
    jobId ? { jobId } : "skip"
  )?.find((k) => k._id === selectedKeywordId);

  const job = useQuery(
    api.jobs.get,
    jobId ? { id: jobId } : "skip"
  );

  const existingPhrases = useQuery(
    api.phrases.listByKeyword,
    selectedKeywordId ? { keywordId: selectedKeywordId } : "skip"
  );

  const createPhrase = useMutation(api.phrases.create);
  const updatePhrase = useMutation(api.phrases.update);

  // Load editing phrase content if provided
  useEffect(() => {
    if (editingPhraseId && editingPhraseContent) {
      setPhraseText(editingPhraseContent);
    } else if (existingPhrases) {
      const draftPhrase = existingPhrases.find((p) => p.status === "draft");
      if (draftPhrase) {
        setPhraseText(draftPhrase.content);
      } else {
        setPhraseText("");
      }
    }
  }, [editingPhraseId, editingPhraseContent, existingPhrases]);

  // Reset when keyword changes (unless editing)
  useEffect(() => {
    if (!editingPhraseId) {
      setPhraseText("");
      setShowSuggestions(false);
    }
  }, [selectedKeywordId, editingPhraseId]);

  const handleGetSuggestions = async () => {
    if (!keyword || !job) return;

    setIsGeneratingSuggestions(true);
    setShowSuggestions(true);
    setIsGeneratingSuggestions(false);
  };

  const handleSuggestionSelect = (suggestion: string) => {
    setPhraseText(suggestion);
    setShowSuggestions(false);
  };

  const handleSave = async () => {
    if (!jobId || !selectedKeywordId || !phraseText.trim()) return;

    try {
      if (editingPhraseId) {
        // Update existing phrase
        await updatePhrase({
          id: editingPhraseId,
          content: phraseText.trim(),
          status: "saved",
        });
        if (onEditComplete) {
          onEditComplete();
        }
      } else {
        // Create new phrase
        await createPhrase({
          jobId,
          keywordId: selectedKeywordId,
          content: phraseText.trim(),
          status: "saved",
        });
      }
      
      // Reset editor
      setPhraseText("");
      setShowSuggestions(false);
    } catch (error) {
      console.error("Failed to save phrase:", error);
    }
  };

  if (!jobId) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Phrase Editor</CardTitle>
          <CardDescription>
            Select a job posting and keyword to start editing
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  if (!selectedKeywordId) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Phrase Editor</CardTitle>
          <CardDescription>
            Select a keyword from the left panel to start working on phrasing
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card className="h-full flex flex-col">
      <CardHeader>
        <CardTitle>Phrase Editor</CardTitle>
        <CardDescription>
          {keyword ? (
            <>
              Working on: <span className="font-semibold">{keyword.text}</span>
            </>
          ) : (
            "Select a keyword to get started"
          )}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col space-y-4">
        {/* User experience context (optional) */}
        <div className="space-y-2">
          <Label htmlFor="user-experience">
            Your Experience Context (optional)
          </Label>
          <Textarea
            id="user-experience"
            value={userExperience}
            onChange={(e) => setUserExperience(e.target.value)}
            placeholder="Describe your relevant experience or skills related to this keyword..."
            rows={3}
            className="text-sm"
          />
        </div>

        {/* Main editor */}
        <div className="flex-1 flex flex-col space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="phrase-text">Your Phrase</Label>
            <Button
              variant="outline"
              size="sm"
              onClick={handleGetSuggestions}
              disabled={isGeneratingSuggestions || !keyword || !job}
            >
              {isGeneratingSuggestions ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Sparkles className="mr-2 h-4 w-4" />
                  Get AI Suggestions
                </>
              )}
            </Button>
          </div>
          <Textarea
            id="phrase-text"
            value={phraseText}
            onChange={(e) => setPhraseText(e.target.value)}
            placeholder="Start typing or click 'Get AI Suggestions' to generate phrasing options..."
            className="flex-1 font-mono text-sm"
            rows={8}
          />
        </div>

        {/* AI Suggestions */}
        {showSuggestions && keyword && job && (
          <AISuggestions
            keyword={keyword.text}
            userExperience={userExperience}
            jobContext={job.description}
            onSelect={handleSuggestionSelect}
            onClose={() => setShowSuggestions(false)}
          />
        )}

        {/* Save button */}
        <div className="pt-2 border-t">
          <Button
            onClick={handleSave}
            disabled={!phraseText.trim()}
            className="w-full"
          >
            <Save className="mr-2 h-4 w-4" />
            {editingPhraseId ? "Update Phrase" : "Save Phrase"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}