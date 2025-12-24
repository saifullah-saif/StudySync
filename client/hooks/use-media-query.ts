"use client";

import { useState, useEffect } from "react";

/**
 * Custom hook to detect if a media query matches
 * @param query - CSS media query string (e.g., "(max-width: 768px)")
 * @returns boolean indicating if the media query matches
 */
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState<boolean>(false);

  useEffect(() => {
    const media = window.matchMedia(query);

    // Update the state initially
    setMatches(media.matches);

    // Define a callback function to handle changes
    const listener = (event: MediaQueryListEvent): void => {
      setMatches(event.matches);
    };

    // Add the callback as a listener for changes to the media query
    media.addEventListener("change", listener);

    // Clean up
    return () => {
      media.removeEventListener("change", listener);
    };
  }, [query]);

  return matches;
}

/**
 * Convenience hook to check if viewport is mobile-sized
 * @returns boolean indicating if viewport width is less than 768px
 */
export function useIsMobileQuery(): boolean {
  return useMediaQuery("(max-width: 767px)");
}
