import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Loader2,
  FileText,
  Sparkles,
  ChevronDown,
  ChevronUp,
  Copy,
  Check,
} from "lucide-react";
import { useSummary } from "@/hooks/use-summary";
import { toast } from "@/hooks/use-toast";

interface SummaryButtonProps {
  content?: string;
  documentId?: string;
  noteId?: string;
  className?: string;
}

export default function SummaryButton({
  content,
  documentId,
  noteId,
  className,
}: SummaryButtonProps) {
  const [showOptions, setShowOptions] = useState(false);
  const [summaryType, setSummaryType] = useState<string>("concise");
  const [customInstructions, setCustomInstructions] = useState("");
  const [maxLength, setMaxLength] = useState(500);
  const [summary, setSummary] = useState<any>(null);
  const [copied, setCopied] = useState(false);

  const {
    generateSummary,
    summarizeDocument,
    summarizeNote,
    isLoading,
    error,
  } = useSummary();

  const handleSummarize = async () => {
    const sourceType: "note" | "pdf" | "document" =
      documentId || noteId ? "pdf" : "note";

    const options = {
      summaryType: summaryType as
        | "concise"
        | "detailed"
        | "bullets"
        | "outline",
      customInstructions,
      maxLength,
      sourceType,
    };

    let result;
    if (noteId) {
      result = await summarizeNote(noteId, options);
    } else if (documentId) {
      result = await summarizeDocument(documentId, options);
    } else if (content) {
      result = await generateSummary(content, options);
    }

    if (result) {
      setSummary(result);
      setShowOptions(false); // Collapse options after generating
    }
  };

  const handleCopySummary = async () => {
    if (summary?.summary) {
      try {
        await navigator.clipboard.writeText(summary.summary);
        setCopied(true);
        toast({
          title: "Copied!",
          description: "Summary copied to clipboard",
        });
        setTimeout(() => setCopied(false), 2000);
      } catch (err) {
        toast({
          title: "Error",
          description: "Failed to copy summary",
          variant: "destructive",
        });
      }
    }
  };

  const isDisabled = (!content && !documentId && !noteId) || isLoading;

  return (
    <div className={className}>
      <div className="space-y-4">
        {/* Main Summary Button */}
        <div className="flex items-center gap-3">
          <Button
            onClick={showOptions ? handleSummarize : () => setShowOptions(true)}
            className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 flex-1"
            disabled={isDisabled}
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Sparkles className="w-4 h-4 mr-2" />
            )}
            {showOptions ? "Generate Summary" : "AI Summary"}
          </Button>

          {!isLoading && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowOptions(!showOptions)}
            >
              {showOptions ? (
                <ChevronUp className="w-4 h-4" />
              ) : (
                <ChevronDown className="w-4 h-4" />
              )}
            </Button>
          )}
        </div>

        {/* Options Panel */}
        {showOptions && (
          <Card className="border-purple-200">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center text-sm">
                <FileText className="w-4 h-4 mr-2" />
                Summary Options
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 ">
              <div className="grid grid-cols-2 gap-4 ">
                <div>
                  <Label htmlFor="summaryType">Summary Type</Label>
                  <Select value={summaryType} onValueChange={setSummaryType}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-white">
                      <SelectItem value="concise">Concise</SelectItem>
                      <SelectItem value="detailed">Detailed</SelectItem>
                      <SelectItem value="bullets">Bullet Points</SelectItem>
                      <SelectItem value="outline">Outline</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="maxLength">Max Length</Label>
                  <Select
                    value={maxLength.toString()}
                    onValueChange={(value) => setMaxLength(parseInt(value))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-white">
                      <SelectItem value="250">Short (250 words)</SelectItem>
                      <SelectItem value="500">Medium (500 words)</SelectItem>
                      <SelectItem value="1000">Long (1000 words)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* <div>
                <Label htmlFor="instructions">
                  Custom Instructions (Optional)
                </Label>
                <Textarea
                  id="instructions"
                  placeholder="e.g., Focus on key concepts, Include examples, Explain technical terms..."
                  value={customInstructions}
                  onChange={(e) => setCustomInstructions(e.target.value)}
                  className="min-h-[60px] resize-none"
                />
              </div> */}
            </CardContent>
          </Card>
        )}

        {/* Error Display */}
        {error && (
          <div className="text-red-600 text-sm bg-red-50 p-3 rounded-lg border border-red-200">
            <strong>Error:</strong> {error}
          </div>
        )}

        {/* Summary Result */}
        {summary && (
          <Card className="border-green-200 bg-green-50">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center text-green-800">
                  <Sparkles className="w-5 h-5 mr-2" />
                  AI Summary
                </CardTitle>
                <div className="flex items-center gap-2">
                  <div className="text-xs text-green-600 bg-green-100 px-2 py-1 rounded">
                    {summary.wordCount} words • {summary.provider}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleCopySummary}
                    className="h-7 w-7 p-0"
                  >
                    {copied ? (
                      <Check className="w-3 h-3 text-green-600" />
                    ) : (
                      <Copy className="w-3 h-3" />
                    )}
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="prose prose-sm max-w-none">
                <div className="whitespace-pre-wrap text-gray-700 leading-relaxed">
                  {summary.summary}
                </div>

                {summary.keyPoints?.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-green-200">
                    <h4 className="font-semibold text-green-800 mb-2">
                      Key Points:
                    </h4>
                    <ul className="list-disc pl-5 space-y-1">
                      {summary.keyPoints.map((point: string, index: number) => (
                        <li key={index} className="text-green-700">
                          {point}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
