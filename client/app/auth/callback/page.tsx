"use client";

import React, { useEffect, useState, Suspense } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, CheckCircle, XCircle } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/auth-context";
import { SafeSearchParamsHandler } from "@/components/safe-search-params-handler";
import { PageLoadingFallback } from "@/components/page-loading-fallback";

function AuthCallbackPageContent() {
  const router = useRouter();
  const { login } = useAuth();

  // State to hold search params received from SafeSearchParamsHandler
  const [searchParamsData, setSearchParamsData] = useState<{
    code: string | null;
    state: string | null;
    error: string | null;
    error_description: string | null;
  }>({
    code: null,
    state: null,
    error: null,
    error_description: null,
  });

  const [status, setStatus] = useState<"loading" | "success" | "error">(
    "loading"
  );
  const [message, setMessage] = useState("Processing authentication...");

  // Handle search params updates
  const handleSearchParamsChange = (params: URLSearchParams) => {
    setSearchParamsData({
      code: params.get("code"),
      state: params.get("state"),
      error: params.get("error"),
      error_description: params.get("error_description"),
    });
  };

  useEffect(() => {
    const processCallback = async () => {
      try {
        // Get the code and state from search params data
        const {
          code,
          state,
          error,
          error_description: errorDescription,
        } = searchParamsData;

        if (error) {
          setStatus("error");
          setMessage(errorDescription || "Authentication failed");
          toast.error("Authentication failed: " + (errorDescription || error));
          return;
        }

        if (!code) {
          setStatus("error");
          setMessage("No authorization code received");
          toast.error("Authentication failed: No authorization code");
          return;
        }

        // Process the OAuth callback - simplified version
        // In a real implementation, you would make an API call here
        // to exchange the authorization code for tokens
        setStatus("success");
        setMessage("Authentication successful! Redirecting...");
        toast.success("Successfully signed in!");

        // Redirect after a short delay
        setTimeout(() => {
          router.push("/assistant");
        }, 2000);
      } catch (error: any) {
        console.error("OAuth callback error:", error);
        setStatus("error");
        setMessage("An unexpected error occurred during authentication");
        toast.error("Authentication failed");
      }
    };

    // Only process callback when we have search params data
    if (searchParamsData.code || searchParamsData.error) {
      processCallback();
    }
  }, [searchParamsData, router]);

  const handleRetry = () => {
    router.push("/auth");
  };

  const handleGoHome = () => {
    router.push("/");
  };

  return (
    <>
      {/* Handle search params safely */}
      <SafeSearchParamsHandler onParamsChange={handleSearchParamsChange} />

      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            {status === "loading" && (
              <>
                <Loader2 className="w-12 h-12 animate-spin text-blue-600 mb-4" />
                <h2 className="text-xl font-semibold text-gray-900 mb-2">
                  Completing Sign In
                </h2>
                <p className="text-gray-600 mb-4">{message}</p>
              </>
            )}

            {status === "success" && (
              <>
                <CheckCircle className="w-12 h-12 text-green-600 mb-4" />
                <h2 className="text-xl font-semibold text-gray-900 mb-2">
                  Welcome to StudySync!
                </h2>
                <p className="text-gray-600 mb-4">{message}</p>
                <div className="flex items-center space-x-2 text-sm text-gray-500">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Redirecting to dashboard...</span>
                </div>
              </>
            )}

            {status === "error" && (
              <>
                <XCircle className="w-12 h-12 text-red-600 mb-4" />
                <h2 className="text-xl font-semibold text-gray-900 mb-2">
                  Authentication Failed
                </h2>
                <p className="text-gray-600 mb-6">{message}</p>
                <div className="flex space-x-3">
                  <Button
                    onClick={handleRetry}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    Try Again
                  </Button>
                  <Button onClick={handleGoHome} variant="outline">
                    Go Home
                  </Button>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}

// Main export with Suspense wrapper
export default function AuthCallbackPage() {
  return (
    <Suspense
      fallback={<PageLoadingFallback message="Processing authentication..." />}
    >
      <AuthCallbackPageContent />
    </Suspense>
  );
}
