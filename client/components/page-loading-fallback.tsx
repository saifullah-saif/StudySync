import { Loader2 } from "lucide-react";

export function PageLoadingFallback({
  message = "Loading page...",
}: {
  message?: string;
}) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
      <div className="text-center space-y-4">
        <Loader2 className="w-8 h-8 animate-spin mx-auto text-blue-600" />
        <p className="text-gray-600 font-medium">{message}</p>
      </div>
    </div>
  );
}
