import { Suspense, ComponentType } from "react";
import { PageLoadingFallback } from "./page-loading-fallback";

interface WithSuspenseOptions {
  fallback?: React.ReactNode;
  loadingMessage?: string;
}

export function withSuspense<P extends object>(
  Component: ComponentType<P>,
  options: WithSuspenseOptions = {}
) {
  const WrappedComponent = (props: P) => {
    const fallback = options.fallback || (
      <PageLoadingFallback message={options.loadingMessage} />
    );

    return (
      <Suspense fallback={fallback}>
        <Component {...props} />
      </Suspense>
    );
  };

  WrappedComponent.displayName = `withSuspense(${
    Component.displayName || Component.name
  })`;

  return WrappedComponent;
}
