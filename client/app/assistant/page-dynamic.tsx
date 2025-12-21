import dynamic from "next/dynamic";
import { AssistantPageLoading } from "./components/assistant-loading";

// Dynamic import with no SSR to avoid useSearchParams issues
const DynamicAssistantPage = dynamic(() => import("./dynamic-page"), {
  ssr: false,
  loading: () => <AssistantPageLoading />,
});

export default function AssistantPageWrapper() {
  return <DynamicAssistantPage />;
}
