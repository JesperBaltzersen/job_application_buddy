# Resume Buddy

A collaborative web application for iteratively refining CV phrasing to match job posting keywords. Built with Vite + React, Convex backend, and ShadCN UI.

## Features

- **Job Posting Input**: Upload PDF, paste URL, or paste text directly
- **Keyword Extraction**: AI-powered extraction of keywords from job postings
- **Interactive Phrasing Editor**: Iterate on wording with AI suggestions
- **Keyword Tracking**: Visual tracking of which keywords have been addressed
- **Saved Phrases**: Collect and organize phrases matched to keywords
- **Human-Machine Collaboration**: AI assists while you maintain full control

## Tech Stack

- **Frontend**: Vite + React + TypeScript
- **Backend**: Convex
- **UI**: ShadCN UI components
- **Styling**: Tailwind CSS
- **AI**: OpenRouter (interface ready for implementation)

## Setup

1. Install dependencies:
```bash
npm install
```

2. Set up Convex:
```bash
npx convex dev
```

This will create a `.env.local` file with your Convex URL.

3. Start the development server:
```bash
npm run dev
```

## Environment Variables

Create a `.env.local` file with:
```
VITE_CONVEX_URL=your_convex_url_from_convex_dev
VITE_OPENROUTER_API_KEY=your_openrouter_api_key
```

**Note**: The `VITE_OPENROUTER_API_KEY` is optional. If not provided, the app will use simple fallback methods for keyword extraction and phrase suggestions. For full AI-powered functionality, set your OpenRouter API key.

## Project Structure

```
src/
  components/
    ui/              # ShadCN UI components
    JobPostingInput.tsx
    KeywordsPanel.tsx
    PhraseEditor.tsx
    AISuggestions.tsx
    SavedPhrasesPanel.tsx
    MainLayout.tsx
  services/
    ai/              # AI service interface and implementations
    keywordMatcher.ts
  lib/
    utils.ts

convex/
  schema.ts          # Database schema
  jobs.ts            # Job posting mutations/queries
  keywords.ts        # Keyword mutations/queries
  phrases.ts         # Phrase mutations/queries
```

## AI Service Integration

The app uses an AI service interface (`src/services/ai/aiServiceInterface.ts`) and integrates with the OpenRouter client package (`packages/openrouter-client/`). The OpenRouter service implementation provides:

- **Keyword Extraction**: AI-powered extraction of relevant keywords from job postings
- **Phrase Suggestions**: Generate professional CV phrases that match job requirements
- **Semantic Matching**: Determine if phrases effectively address keywords

The implementation includes fallback methods that work without an API key for basic functionality. Set `VITE_OPENROUTER_API_KEY` to enable full AI-powered features.
