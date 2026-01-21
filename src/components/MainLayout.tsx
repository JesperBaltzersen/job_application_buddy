import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { Button } from "./ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { Card, CardContent } from "./ui/card";
import { Plus, FileText, ChevronDown } from "lucide-react";
import JobPostingInput from "./JobPostingInput";
import KeywordsPanel from "./KeywordsPanel";
import PhraseEditor from "./PhraseEditor";
import SavedPhrasesPanel from "./SavedPhrasesPanel";

export default function MainLayout() {
  const [currentJobId, setCurrentJobId] = useState<Id<"jobs"> | null>(null);
  const [selectedKeywordId, setSelectedKeywordId] = useState<Id<"keywords"> | null>(null);
  const [showJobInput, setShowJobInput] = useState(false);
  const [editingPhraseId, setEditingPhraseId] = useState<Id<"phrases"> | null>(null);
  const [editingPhraseContent, setEditingPhraseContent] = useState("");

  const jobs = useQuery(api.jobs.list);
  const currentJob = useQuery(
    api.jobs.get,
    currentJobId ? { id: currentJobId } : "skip"
  );

  const handleJobCreated = (jobId: Id<"jobs">) => {
    setCurrentJobId(jobId);
    setShowJobInput(false);
    setSelectedKeywordId(null);
  };

  const handleJobSelect = (jobId: Id<"jobs"> | null) => {
    setCurrentJobId(jobId);
    setSelectedKeywordId(null);
    setEditingPhraseId(null);
    setEditingPhraseContent("");
  };

  const phrases = useQuery(
    api.phrases.list,
    currentJobId ? { jobId: currentJobId } : "skip"
  );

  const handleEditPhrase = (phraseId: Id<"phrases">, content: string) => {
    setEditingPhraseId(phraseId);
    setEditingPhraseContent(content);
    // Find the keyword for this phrase to select it
    const phrase = phrases?.find((p) => p._id === phraseId);
    if (phrase) {
      setSelectedKeywordId(phrase.keywordId);
    }
  };

  const handleEditComplete = () => {
    setEditingPhraseId(null);
    setEditingPhraseContent("");
  };

  // If no jobs exist or user wants to add a new job, show job input
  if (showJobInput || (!currentJobId && (!jobs || jobs.length === 0))) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="w-full max-w-2xl">
          <div className="glass-strong rounded-2xl p-8 shadow-2xl">
            <JobPostingInput onJobCreated={handleJobCreated} />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="glass border-b border-white/10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold gradient-text">Resume Buddy</h1>
              {currentJob && (
                <p className="text-sm text-muted-foreground mt-1">
                  {currentJob.title}
                </p>
              )}
            </div>
            <div className="flex items-center gap-2">
              {jobs && jobs.length > 0 && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" className="glass">
                      {currentJob ? currentJob.title : "Select Job"}
                      <ChevronDown className="ml-2 h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="glass-strong border-white/10">
                    {jobs.map((job) => (
                      <DropdownMenuItem
                        key={job._id}
                        onClick={() => handleJobSelect(job._id)}
                        className="hover:bg-white/10"
                      >
                        {job.title}
                      </DropdownMenuItem>
                    ))}
                    <DropdownMenuItem onClick={() => handleJobSelect(null)} className="hover:bg-white/10">
                      <Plus className="mr-2 h-4 w-4" />
                      New Job Posting
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
              <Button onClick={() => setShowJobInput(true)} className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700">
                <Plus className="mr-2 h-4 w-4" />
                Add Job
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6">
        <Tabs defaultValue="cv" className="w-full">
          <TabsList className="glass border-white/10 bg-white/5 p-1">
            <TabsTrigger 
              value="cv"
              className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-600 data-[state=active]:to-pink-600 data-[state=active]:text-white"
            >
              <FileText className="mr-2 h-4 w-4" />
              CV
            </TabsTrigger>
            <TabsTrigger value="cover-letter" disabled>
              Cover Letter
            </TabsTrigger>
          </TabsList>

          <TabsContent value="cv" className="mt-6">
            <div className="grid grid-cols-12 gap-4 h-[calc(100vh-200px)]">
              {/* Left: Keywords Panel */}
              <div className="col-span-3">
                <KeywordsPanel
                  jobId={currentJobId}
                  selectedKeywordId={selectedKeywordId}
                  onKeywordSelect={setSelectedKeywordId}
                />
              </div>

              {/* Center: Phrase Editor */}
              <div className="col-span-5">
                <PhraseEditor
                  jobId={currentJobId}
                  selectedKeywordId={selectedKeywordId}
                  editingPhraseId={editingPhraseId}
                  editingPhraseContent={editingPhraseContent}
                  onEditComplete={handleEditComplete}
                />
              </div>

              {/* Right: Saved Phrases */}
              <div className="col-span-4">
                <SavedPhrasesPanel
                  jobId={currentJobId}
                  selectedKeywordId={selectedKeywordId}
                  onEditPhrase={handleEditPhrase}
                />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="cover-letter" className="mt-6">
            <Card>
              <CardContent className="p-6 text-center text-muted-foreground">
                Cover letter feature coming soon...
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}