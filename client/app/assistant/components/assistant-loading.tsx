import { Loader2 } from "lucide-react";

export function AssistantPageLoading() {
  return (
    <div className="flex items-center justify-center min-h-[200px]">
      <div className="flex items-center space-x-2 text-slate-600">
        <Loader2 className="w-5 h-5 animate-spin" />
        <span>Loading assistant...</span>
      </div>
    </div>
  );
}
