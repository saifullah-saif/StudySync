"use client";

import { useSearchParams } from "next/navigation";
import { useEffect } from "react";

interface SearchParamsHandlerProps {
  onTabChange: (tab: string) => void;
}

export function SearchParamsHandler({ onTabChange }: SearchParamsHandlerProps) {
  const searchParams = useSearchParams();

  useEffect(() => {
    const tab = searchParams?.get("tab");
    if (tab && ["dashboard", "flashcards", "files", "podcasts"].includes(tab)) {
      onTabChange(tab);
    }
  }, [searchParams, onTabChange]);

  return null; // This component doesn't render anything
}
