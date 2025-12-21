"use client";

import { useSearchParams } from "next/navigation";
import { useEffect } from "react";

interface SafeSearchParamsHandlerProps {
  onParamsChange?: (params: URLSearchParams) => void;
  onParamChange?: (key: string, value: string | null) => void;
  watchParams?: string[];
}

export function SafeSearchParamsHandler({
  onParamsChange,
  onParamChange,
  watchParams = [],
}: SafeSearchParamsHandlerProps) {
  const searchParams = useSearchParams();

  useEffect(() => {
    if (onParamsChange) {
      onParamsChange(searchParams);
    }
  }, [searchParams, onParamsChange]);

  useEffect(() => {
    if (onParamChange && watchParams.length > 0) {
      watchParams.forEach((key) => {
        const value = searchParams.get(key);
        onParamChange(key, value);
      });
    }
  }, [searchParams, onParamChange, watchParams]);

  return null; // This component doesn't render anything
}
