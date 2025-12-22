/**
 * Themed Card Component
 * Consistent card styling across the entire application
 * Uses the StudySync design system
 */

import React from "react";
import { THEME } from "@/styles/theme";
import { cn } from "@/lib/utils";

export interface ThemedCardProps extends React.HTMLAttributes<HTMLDivElement> {
  interactive?: boolean;
  glass?: boolean;
  noBorder?: boolean;
  noShadow?: boolean;
}

export const ThemedCard = React.forwardRef<HTMLDivElement, ThemedCardProps>(
  (
    {
      className,
      interactive = false,
      glass = false,
      noBorder = false,
      noShadow = false,
      children,
      ...props
    },
    ref
  ) => {
    const baseClasses = glass
      ? THEME.components.card.glass
      : THEME.components.card.base;

    const interactiveClasses = interactive
      ? THEME.components.card.interactive
      : THEME.components.card.hover;

    return (
      <div
        ref={ref}
        className={cn(
          baseClasses,
          !glass && interactiveClasses,
          noBorder && "border-0",
          noShadow && "shadow-none",
          className
        )}
        {...props}
      >
        {children}
      </div>
    );
  }
);

ThemedCard.displayName = "ThemedCard";

export const ThemedCardHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex flex-col space-y-1.5 p-6", className)}
    {...props}
  />
));
ThemedCardHeader.displayName = "ThemedCardHeader";

export const ThemedCardTitle = React.forwardRef<
  HTMLHeadingElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h3
    ref={ref}
    className={cn(
      "text-2xl font-bold leading-none tracking-tight text-slate-900",
      className
    )}
    {...props}
  />
));
ThemedCardTitle.displayName = "ThemedCardTitle";

export const ThemedCardDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn("text-sm text-slate-500", className)}
    {...props}
  />
));
ThemedCardDescription.displayName = "ThemedCardDescription";

export const ThemedCardContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("p-6 pt-0", className)} {...props} />
));
ThemedCardContent.displayName = "ThemedCardContent";

export const ThemedCardFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex items-center p-6 pt-0", className)}
    {...props}
  />
));
ThemedCardFooter.displayName = "ThemedCardFooter";

// Usage Example:
// <ThemedCard interactive>
//   <ThemedCardHeader>
//     <ThemedCardTitle>Card Title</ThemedCardTitle>
//     <ThemedCardDescription>Card description</ThemedCardDescription>
//   </ThemedCardHeader>
//   <ThemedCardContent>Content here</ThemedCardContent>
// </ThemedCard>
