/**
 * Themed Modal Component
 * Animated modal/dialog with consistent styling
 * Uses Radix UI Dialog with StudySync design system
 */

"use client";

import React from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import { THEME } from "@/styles/theme";
import { cn } from "@/lib/utils";

const ThemedModal = DialogPrimitive.Root;
const ThemedModalTrigger = DialogPrimitive.Trigger;
const ThemedModalClose = DialogPrimitive.Close;

const ThemedModalPortal = DialogPrimitive.Portal;

const ThemedModalOverlay = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Overlay>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Overlay>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Overlay
    ref={ref}
    className={cn(THEME.components.modal.overlay, className)}
    {...props}
  />
));
ThemedModalOverlay.displayName = DialogPrimitive.Overlay.displayName;

const ThemedModalContent = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content> & {
    showCloseButton?: boolean;
  }
>(({ className, children, showCloseButton = true, ...props }, ref) => (
  <ThemedModalPortal>
    <ThemedModalOverlay />
    <DialogPrimitive.Content
      ref={ref}
      className={cn(THEME.components.modal.content, "p-0", className)}
      {...props}
    >
      {children}
      {showCloseButton && (
        <DialogPrimitive.Close className="absolute right-4 top-4 rounded-lg opacity-70 ring-offset-white transition-all hover:opacity-100 hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-[#191265] focus:ring-offset-2 disabled:pointer-events-none p-2">
          <X className="h-5 w-5 text-slate-500" />
          <span className="sr-only">Close</span>
        </DialogPrimitive.Close>
      )}
    </DialogPrimitive.Content>
  </ThemedModalPortal>
));
ThemedModalContent.displayName = DialogPrimitive.Content.displayName;

const ThemedModalHeader = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      "flex flex-col space-y-2 text-center sm:text-left p-6 pb-4",
      className
    )}
    {...props}
  />
);
ThemedModalHeader.displayName = "ThemedModalHeader";

const ThemedModalFooter = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      "flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2 p-6 pt-4 border-t border-slate-200",
      className
    )}
    {...props}
  />
);
ThemedModalFooter.displayName = "ThemedModalFooter";

const ThemedModalTitle = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Title>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Title>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Title
    ref={ref}
    className={cn(
      "text-2xl font-bold leading-none tracking-tight text-slate-900",
      className
    )}
    {...props}
  />
));
ThemedModalTitle.displayName = DialogPrimitive.Title.displayName;

const ThemedModalDescription = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Description>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Description>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Description
    ref={ref}
    className={cn("text-sm text-slate-500", className)}
    {...props}
  />
));
ThemedModalDescription.displayName = DialogPrimitive.Description.displayName;

const ThemedModalBody = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn("p-6 py-4", className)} {...props} />
);
ThemedModalBody.displayName = "ThemedModalBody";

export {
  ThemedModal,
  ThemedModalTrigger,
  ThemedModalClose,
  ThemedModalContent,
  ThemedModalHeader,
  ThemedModalFooter,
  ThemedModalTitle,
  ThemedModalDescription,
  ThemedModalBody,
};

// Usage Example:
// <ThemedModal>
//   <ThemedModalTrigger asChild>
//     <ThemedButton>Open Modal</ThemedButton>
//   </ThemedModalTrigger>
//   <ThemedModalContent>
//     <ThemedModalHeader>
//       <ThemedModalTitle>Modal Title</ThemedModalTitle>
//       <ThemedModalDescription>Modal description</ThemedModalDescription>
//     </ThemedModalHeader>
//     <ThemedModalBody>
//       Your content here
//     </ThemedModalBody>
//     <ThemedModalFooter>
//       <ThemedButton variant="outline">Cancel</ThemedButton>
//       <ThemedButton>Confirm</ThemedButton>
//     </ThemedModalFooter>
//   </ThemedModalContent>
// </ThemedModal>
