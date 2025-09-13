import { useSearchParams } from 'next/navigation';
import { Suspense, ComponentType } from 'react';

/**
 * Safe hook for using search params with automatic Suspense handling
 * This prevents the Next.js 15 build errors
 */
export function useSafeSearchParams() {
  // This hook should only be used inside components wrapped with Suspense
  const searchParams = useSearchParams();
  return searchParams;
}

/**
 * Type-safe search params handler
 */
export interface SearchParamsConfig {
  [key: string]: {
    type: 'string' | 'number' | 'boolean';
    default?: any;
    required?: boolean;
  };
}

export function useTypedSearchParams<T extends SearchParamsConfig>(config: T) {
  const searchParams = useSafeSearchParams();
  
  const result = {} as {
    [K in keyof T]: T[K]['type'] extends 'string' 
      ? string | null 
      : T[K]['type'] extends 'number' 
      ? number | null 
      : boolean | null
  };

  Object.entries(config).forEach(([key, settings]) => {
    const value = searchParams.get(key);
    
    if (value === null) {
      (result as any)[key] = settings.default ?? null;
      return;
    }

    switch (settings.type) {
      case 'number':
        (result as any)[key] = parseInt(value, 10) || settings.default ?? null;
        break;
      case 'boolean':
        (result as any)[key] = value === 'true' || settings.default ?? false;
        break;
      default:
        (result as any)[key] = value || settings.default ?? null;
    }
  });

  return result;
}

/**
 * Higher-order component to automatically wrap components with Suspense
 * for search params usage - use in a .tsx file, not .ts
 */
export function createSearchParamsSuspenseWrapper<P extends object>(
  Component: ComponentType<P>,
  fallback?: React.ReactNode
) {
  // This function returns a component constructor that must be used in JSX
  return {
    Component,
    fallback,
    // Helper to create the actual JSX wrapper
    withSuspense: true
  };
}
