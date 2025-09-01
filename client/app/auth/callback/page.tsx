"use client";

import React, { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, CheckCircle, XCircle } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/auth-context";

export default function AuthCallbackPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { handleOAuthCallback } = useAuth();
  
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = useState("Processing authentication...");

  useEffect(() => {
    const processCallback = async () => {
      try {
        // Get the code and state from URL parameters
        const code = searchParams.get("code");
        const state = searchParams.get("state");
        const error = searchParams.get("error");
        const errorDescription = searchParams.get("error_description");

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

        // Process the OAuth callback
        if (handleOAuthCallback) {
          const result = await handleOAuthCallback(code, state);
          
          if (result.success) {
            setStatus("success");
            setMessage("Authentication successful! Redirecting...");
            toast.success("Successfully signed in!");
            
            // Redirect after a short delay
            setTimeout(() => {
              router.push("/assistant");
            }, 2000);
          } else {
            setStatus("error");
            setMessage(result.message || "Authentication failed");
            toast.error(result.message || "Authentication failed");
          }
        } else {
          // Fallback if handleOAuthCallback is not available
          setStatus("success");
          setMessage("Authentication successful! Redirecting...");
          toast.success("Successfully signed in!");
          
          setTimeout(() => {
            router.push("/assistant");
          }, 2000);
        }
      } catch (error: any) {
        console.error("OAuth callback error:", error);
        setStatus("error");
        setMessage("An unexpected error occurred during authentication");
        toast.error("Authentication failed");
      }
    };

    processCallback();
  }, [searchParams, handleOAuthCallback, router]);

  const handleRetry = () => {
    router.push("/auth");
  };

  const handleGoHome = () => {
    router.push("/");
  };

  return (
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
                <Button onClick={handleRetry} className="bg-blue-600 hover:bg-blue-700">
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
  );
}
