"use client";

import Header from "@/components/header";
import UploadNotes from "@/components/upload-notes";
import BrowseNotes from "@/components/browse-notes";
import AISummarizer from "@/components/ai-summarizer";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function NotesPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      <Header />

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <Tabs defaultValue="browse" className="space-y-8">
          <TabsList className="grid w-full grid-cols-2 lg:w-[600px] mx-auto bg-white shadow-lg border-0">
            <TabsTrigger
              value="browse"
              className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-purple-600 data-[state=active]:text-white"
            >
              Browse Notes
            </TabsTrigger>
            <TabsTrigger
              value="upload"
              className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-purple-600 data-[state=active]:text-white"
            >
              Upload Your Notes
            </TabsTrigger>
            {/* <TabsTrigger value="ai-summarizer">AI Summarizer</TabsTrigger> */}
          </TabsList>

          {/* Browse Notes Tab */}
          <TabsContent value="browse" className="space-y-8">
            <BrowseNotes />
          </TabsContent>

          {/* Upload Your Notes Tab */}
          <TabsContent value="upload" className="space-y-8">
            <UploadNotes />
          </TabsContent>

          {/* AI Summarizer Tab */}
          {/* <TabsContent value="ai-summarizer" className="space-y-8">
            <AISummarizer />
          </TabsContent> */}
        </Tabs>
      </main>
    </div>
  );
}
