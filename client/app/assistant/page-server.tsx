import { Suspense } from "react";
import AssistantClientPage from "./components/assistant-client";
import { AssistantPageLoading } from "./components/assistant-loading";

interface AssistantPageProps {
  searchParams: { [key: string]: string | string[] | undefined };
}

// Server Component - handles search params
export default function AssistantPage({ searchParams }: AssistantPageProps) {
  const activeTab =
    typeof searchParams.tab === "string" &&
    ["dashboard", "flashcards", "files", "podcasts"].includes(searchParams.tab)
      ? searchParams.tab
      : "dashboard";

  return (
    <Suspense fallback={<AssistantPageLoading />}>
      <AssistantClientPage initialTab={activeTab} />
    </Suspense>
  );
}
