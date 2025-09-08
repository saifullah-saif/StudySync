import { useState } from 'react';

interface SummaryOptions {
  summaryType?: 'concise' | 'detailed' | 'bullets' | 'outline';
  customInstructions?: string;
  maxLength?: number;
  sourceType?: 'note' | 'pdf' | 'document';
}

interface SummaryResult {
  summary: string;
  keyPoints: string[];
  wordCount: number;
  provider: string;
}

export function useSummary() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generateSummary = async (
    content: string,
    options: SummaryOptions = {}
  ): Promise<SummaryResult | null> => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'}/summary/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include', // Use cookies for authentication
        body: JSON.stringify({ content, options })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to generate summary');
      }

      const data = await response.json();
      return data.summary;

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const summarizeDocument = async (
    documentId: string,
    options: SummaryOptions = {}
  ): Promise<SummaryResult | null> => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'}/summary/document/${documentId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include', // Use cookies for authentication
        body: JSON.stringify({ options })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to summarize document');
      }

      const data = await response.json();
      return data.summary;

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const summarizeNote = async (
    noteId: string,
    options: SummaryOptions = {}
  ): Promise<SummaryResult | null> => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'}/summary/note/${noteId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include', // Use cookies for authentication
        body: JSON.stringify({ options })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to summarize note');
      }

      const data = await response.json();
      return data.summary;

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    generateSummary,
    summarizeDocument,
    summarizeNote,
    isLoading,
    error
  };
}
