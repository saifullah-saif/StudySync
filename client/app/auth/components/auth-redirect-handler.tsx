"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useEffect } from "react";
import { useAuth } from "@/contexts/auth-context";

export function AuthRedirectHandler() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      const redirect = searchParams.get("redirect") || "/assistant";
      router.push(redirect);
    }
  }, [user, router, searchParams]);

  return null; // This component doesn't render anything
}
