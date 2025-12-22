# StudySync Design System Documentation

> **Complete visual identity guide for consistent, modern UI across all pages**

## 🎨 Overview

This design system ensures StudySync maintains a cohesive, professional, and modern visual identity across all pages and components. It provides a single source of truth for colors, typography, spacing, animations, and component behavior.

---

## 🎯 Core Brand Identity

### Primary Brand Color
- **Rich Blue**: `#191265`
- Usage: Navbar, primary buttons, accent elements, brand touchpoints
- This color represents trust, professionalism, and academic excellence

### Visual Philosophy
- **Modern & Sleek**: Clean lines, ample whitespace, smooth animations
- **Professional**: Appropriate for academic/educational context
- **Accessible**: High contrast ratios, readable typography
- **Consistent**: Same look and feel across all pages

---

## 📚 Installation & Setup

### 1. Import the Theme
```typescript
import { THEME } from "@/styles/theme";
```

### 2. Use Themed Components
```typescript
import { ThemedButton } from "@/components/ui/themed-button";
import { ThemedCard } from "@/components/ui/themed-card";
import { ThemedModal } from "@/components/ui/themed-modal";
```

---

## 🎨 Color System

### Primary Colors
```typescript
THEME.colors.primary.DEFAULT  // #191265 (Rich Blue)
THEME.colors.primary[900]     // #191265 (Same as default)
THEME.colors.primary[800]     // #4928b5
THEME.colors.primary[50]      // #f4f3ff (Very light)
```

### Semantic Colors
```typescript
THEME.colors.success  // #10b981 (Green)
THEME.colors.warning  // #f59e0b (Yellow)
THEME.colors.error    // #ef4444 (Red)
THEME.colors.info     // #3b82f6 (Blue)
```

### Usage Examples
```tsx
// In Tailwind classes
<div className="bg-[#191265] text-white">Primary background</div>

// Using theme directly
<div style={{ backgroundColor: THEME.colors.primary.DEFAULT }}>
  Brand color
</div>
```

---

## 🔤 Typography

### Font Stack
- **Sans-serif**: Geist Sans (Modern, clean)
- **Monospace**: Geist Mono (Code, technical content)

### Font Sizes
```typescript
THEME.typography.fontSize = {
  xs: "0.75rem",    // 12px - Small labels
  sm: "0.875rem",   // 14px - Body text (small)
  base: "1rem",     // 16px - Body text
  lg: "1.125rem",   // 18px - Subheadings
  xl: "1.25rem",    // 20px - Headings (small)
  "2xl": "1.5rem",  // 24px - Headings
  "3xl": "1.875rem",// 30px - Large headings
  "4xl": "2.25rem", // 36px - Hero headings
  "5xl": "3rem",    // 48px - Main headlines
  "6xl": "3.75rem", // 60px - Hero titles
}
```

### Font Weights
```typescript
normal: "400"     // Body text
medium: "500"     // Emphasized text
semibold: "600"   // Subheadings
bold: "700"       // Headings
extrabold: "800"  // Hero titles
```

---

## 🧱 Component Library

### Buttons

#### ThemedButton Component
```tsx
import { ThemedButton } from "@/components/ui/themed-button";

// Variants
<ThemedButton variant="primary">Primary Action</ThemedButton>
<ThemedButton variant="secondary">Secondary</ThemedButton>
<ThemedButton variant="outline">Outlined</ThemedButton>
<ThemedButton variant="ghost">Ghost</ThemedButton>
<ThemedButton variant="gradient">Gradient</ThemedButton>

// Sizes
<ThemedButton size="sm">Small</ThemedButton>
<ThemedButton size="md">Medium</ThemedButton>
<ThemedButton size="lg">Large</ThemedButton>
<ThemedButton size="xl">Extra Large</ThemedButton>

// With icons and loading
<ThemedButton leftIcon={<Icon />}>With Icon</ThemedButton>
<ThemedButton isLoading>Loading...</ThemedButton>
```

#### Visual Styles
- **Primary**: Rich blue background (#191265), white text, shadow glow
- **Secondary**: White background, blue border, hover fills blue
- **Outline**: Gray border, hover changes to blue border
- **Ghost**: Transparent, subtle hover background
- **Gradient**: Blue-to-purple gradient background

---

### Cards

#### ThemedCard Component
```tsx
import {
  ThemedCard,
  ThemedCardHeader,
  ThemedCardTitle,
  ThemedCardDescription,
  ThemedCardContent,
  ThemedCardFooter,
} from "@/components/ui/themed-card";

// Basic card
<ThemedCard>
  <ThemedCardHeader>
    <ThemedCardTitle>Card Title</ThemedCardTitle>
    <ThemedCardDescription>Description text</ThemedCardDescription>
  </ThemedCardHeader>
  <ThemedCardContent>
    Your content here
  </ThemedCardContent>
  <ThemedCardFooter>
    <ThemedButton>Action</ThemedButton>
  </ThemedCardFooter>
</ThemedCard>

// Interactive card (clickable)
<ThemedCard interactive>
  Content automatically gets hover lift effect
</ThemedCard>

// Glass morphism card
<ThemedCard glass>
  Translucent background with blur
</ThemedCard>
```

---

### Modals/Dialogs

#### ThemedModal Component
```tsx
import {
  ThemedModal,
  ThemedModalTrigger,
  ThemedModalContent,
  ThemedModalHeader,
  ThemedModalTitle,
  ThemedModalDescription,
  ThemedModalBody,
  ThemedModalFooter,
  ThemedModalClose,
} from "@/components/ui/themed-modal";

<ThemedModal>
  <ThemedModalTrigger asChild>
    <ThemedButton>Open Modal</ThemedButton>
  </ThemedModalTrigger>
  
  <ThemedModalContent>
    <ThemedModalHeader>
      <ThemedModalTitle>Modal Title</ThemedModalTitle>
      <ThemedModalDescription>
        Modal description text
      </ThemedModalDescription>
    </ThemedModalHeader>
    
    <ThemedModalBody>
      Your modal content here
    </ThemedModalBody>
    
    <ThemedModalFooter>
      <ThemedModalClose asChild>
        <ThemedButton variant="outline">Cancel</ThemedButton>
      </ThemedModalClose>
      <ThemedButton variant="primary">Confirm</ThemedButton>
    </ThemedModalFooter>
  </ThemedModalContent>
</ThemedModal>
```

#### Modal Animations
- **Entry**: Fade in + scale in (zoom-in-95)
- **Exit**: Fade out + scale out (zoom-out-95)
- **Overlay**: Backdrop blur with fade
- **Duration**: 300ms smooth cubic-bezier easing

---

### Navbar

The navbar uses the brand color (#191265) as its background with white text.

#### Customization
```tsx
// The navbar is automatically styled via THEME.components.navbar
import Header from "@/components/header";

<Header /> // Uses brand color automatically
```

#### Navbar Styles
```typescript
THEME.components.navbar = {
  base: "bg-[#191265] border-b border-[#2d1b8f] shadow-lg",
  item: "text-white/80 hover:text-white hover:bg-white/10",
  itemActive: "text-white bg-white/20",
}
```

---

## 🎬 Animation System

### Pre-built Animation Classes

#### Fade Animations
```tsx
<div className="animate-fade-in">Fades in smoothly</div>
<div className="animate-fade-out">Fades out smoothly</div>
```

#### Slide Animations
```tsx
<div className="animate-slide-in-bottom">Slides in from bottom</div>
<div className="animate-slide-in-top">Slides in from top</div>
<div className="animate-slide-in-left">Slides in from left</div>
<div className="animate-slide-in-right">Slides in from right</div>
```

#### Scale Animations
```tsx
<div className="animate-scale-in">Scales in (zoom effect)</div>
<div className="animate-scale-out">Scales out</div>
```

#### Continuous Animations
```tsx
<div className="animate-pulse">Pulsing effect</div>
<div className="animate-bounce">Bouncing effect</div>
<div className="animate-shimmer">Shimmer/loading effect</div>
<div className="animate-blob">Organic blob movement</div>
```

#### Staggered List Animations
```tsx
<ul className="stagger-fade-in">
  <li>Item 1 (fades in first)</li>
  <li>Item 2 (fades in second)</li>
  <li>Item 3 (fades in third)</li>
</ul>
```

### Custom Animation Delays
```tsx
<div className="animate-blob animation-delay-2000">
  Delayed 2 seconds
</div>
```

---

## 🌈 Gradients

### Pre-defined Gradients
```tsx
// Primary brand gradient
<div className={THEME.gradients.primary}>
  Rich blue gradient
</div>

// Subtle background gradient
<div className={THEME.gradients.primarySubtle}>
  Very subtle brand gradient
</div>

// Hero section gradient
<div className={THEME.gradients.hero}>
  Soft colorful background
</div>

// Glass effect
<div className={THEME.gradients.glass}>
  Glassmorphism effect
</div>
```

### Direct Usage
```typescript
THEME.gradients.primary       // Blue gradient
THEME.gradients.secondary     // Purple gradient
THEME.gradients.accent        // Cyan/teal gradient
THEME.gradients.glass         // Translucent blur
```

---

## 📐 Spacing & Layout

### Spacing Scale
```typescript
THEME.spacing = {
  xs: "0.5rem",   // 8px
  sm: "0.75rem",  // 12px
  md: "1rem",     // 16px
  lg: "1.5rem",   // 24px
  xl: "2rem",     // 32px
  "2xl": "3rem",  // 48px
  "3xl": "4rem",  // 64px
  "4xl": "6rem",  // 96px
}
```

### Border Radius
```typescript
THEME.borderRadius = {
  sm: "0.375rem",  // 6px
  md: "0.5rem",    // 8px
  lg: "0.75rem",   // 12px
  xl: "1rem",      // 16px
  "2xl": "1.5rem", // 24px
  full: "9999px",  // Circular
}
```

---

## 💎 Effects & Shadows

### Box Shadows
```typescript
// Standard shadows
THEME.shadows.sm    // Subtle shadow
THEME.shadows.md    // Default shadow
THEME.shadows.lg    // Prominent shadow
THEME.shadows.xl    // Large shadow
THEME.shadows["2xl"] // Extra large shadow

// Colored glows (brand colors)
THEME.shadows.primaryGlow    // Blue glow
THEME.shadows.secondaryGlow  // Purple glow
```

### Glass Morphism
```tsx
<div className="glass">
  Frosted glass effect with blur
</div>

<div className="glass-dark">
  Dark glass effect
</div>
```

---

## 🎯 Usage Examples

### Feature Card (Dashboard)
```tsx
import { ThemedCard, ThemedCardHeader, ThemedCardTitle, ThemedCardDescription, ThemedCardContent } from "@/components/ui/themed-card";
import { ThemedButton } from "@/components/ui/themed-button";
import { Users } from "lucide-react";

<ThemedCard interactive className="animate-slide-in-bottom">
  <ThemedCardHeader>
    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center mb-4">
      <Users className="h-6 w-6 text-white" />
    </div>
    <ThemedCardTitle>Study Buddies</ThemedCardTitle>
    <ThemedCardDescription>
      Find peers with shared interests
    </ThemedCardDescription>
  </ThemedCardHeader>
  <ThemedCardContent>
    <ThemedButton variant="ghost" className="w-full">
      Get started →
    </ThemedButton>
  </ThemedCardContent>
</ThemedCard>
```

### Hero Section
```tsx
<section className={`${THEME.gradients.hero} min-h-screen flex items-center`}>
  <div className="max-w-7xl mx-auto px-8 animate-fade-in">
    <h1 className="text-6xl font-bold text-slate-900 mb-6">
      Welcome to{" "}
      <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#191265] to-[#4928b5]">
        StudySync
      </span>
    </h1>
    <p className="text-xl text-slate-600 mb-8">
      Your complete study platform
    </p>
    <ThemedButton variant="gradient" size="lg">
      Get Started
    </ThemedButton>
  </div>
</section>
```

### Modal with Form
```tsx
<ThemedModal>
  <ThemedModalTrigger asChild>
    <ThemedButton variant="primary">Create Course</ThemedButton>
  </ThemedModalTrigger>
  
  <ThemedModalContent>
    <ThemedModalHeader>
      <ThemedModalTitle>New Course</ThemedModalTitle>
      <ThemedModalDescription>
        Add a new course to your schedule
      </ThemedModalDescription>
    </ThemedModalHeader>
    
    <ThemedModalBody>
      <form className="space-y-4">
        <input
          type="text"
          placeholder="Course name"
          className={THEME.components.input.base}
        />
        <textarea
          placeholder="Description"
          className={THEME.components.input.base}
        />
      </form>
    </ThemedModalBody>
    
    <ThemedModalFooter>
      <ThemedModalClose asChild>
        <ThemedButton variant="outline">Cancel</ThemedButton>
      </ThemedModalClose>
      <ThemedButton variant="primary">Create</ThemedButton>
    </ThemedModalFooter>
  </ThemedModalContent>
</ThemedModal>
```

---

## 📱 Responsive Design

### Breakpoints
```typescript
THEME.breakpoints = {
  xs: "475px",
  sm: "640px",
  md: "768px",
  lg: "1024px",
  xl: "1280px",
  "2xl": "1536px",
}
```

### Mobile-First Approach
```tsx
<div className="text-2xl md:text-4xl lg:text-6xl">
  Scales up on larger screens
</div>

<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
  Responsive grid
</div>
```

---

## ✅ Best Practices

### DO ✓
- Use `ThemedButton` for all button elements
- Use `ThemedCard` for content containers
- Use `ThemedModal` for dialogs and popups
- Apply animations to enhance user experience
- Use the brand color (#191265) for primary CTAs
- Maintain consistent spacing using THEME.spacing
- Use semantic color names (success, warning, error)

### DON'T ✗
- Don't create custom buttons with different styles
- Don't use arbitrary colors outside the design system
- Don't skip animations on interactive elements
- Don't use inconsistent border radius values
- Don't override theme colors without documentation
- Don't create custom modals that don't match the design system

---

## 🔧 Helper Functions

### Get Button Classes
```typescript
import { getButtonClasses } from "@/styles/theme";

const classes = getButtonClasses("primary", "lg");
// Returns complete button classes for primary large button
```

### Get Card Classes
```typescript
import { getCardClasses } from "@/styles/theme";

const classes = getCardClasses(true, false);
// Returns interactive card classes (not glass)
```

---

## 🎨 Color Palette Quick Reference

| Color | Hex | Usage |
|-------|-----|-------|
| Primary Brand | `#191265` | Navbar, buttons, accents |
| Primary Light | `#f4f3ff` | Backgrounds, subtle highlights |
| Primary Dark | `#1a0f4d` | Hover states, shadows |
| Success | `#10b981` | Success messages, confirmations |
| Warning | `#f59e0b` | Warnings, alerts |
| Error | `#ef4444` | Errors, destructive actions |
| Info | `#3b82f6` | Informational messages |

---

## 📦 Component Export Index

```typescript
// All themed components
export { ThemedButton } from "@/components/ui/themed-button";
export { ThemedCard, ThemedCardHeader, ThemedCardTitle, ThemedCardDescription, ThemedCardContent, ThemedCardFooter } from "@/components/ui/themed-card";
export { ThemedModal, ThemedModalTrigger, ThemedModalContent, ThemedModalHeader, ThemedModalTitle, ThemedModalDescription, ThemedModalBody, ThemedModalFooter, ThemedModalClose } from "@/components/ui/themed-modal";

// Theme configuration
export { THEME } from "@/styles/theme";
```

---

## 🚀 Getting Started Checklist

- [ ] Import THEME from `@/styles/theme`
- [ ] Replace standard buttons with `<ThemedButton>`
- [ ] Replace card components with `<ThemedCard>`
- [ ] Replace modals with `<ThemedModal>`
- [ ] Use brand color (#191265) for primary elements
- [ ] Add animations to interactive elements
- [ ] Test responsive behavior on mobile/tablet
- [ ] Verify accessibility (contrast ratios, keyboard navigation)
- [ ] Ensure consistent spacing throughout page

---

## 📞 Support

For questions or issues with the design system, refer to:
- Theme configuration: `/client/styles/theme.ts`
- Component library: `/client/components/ui/themed-*.tsx`
- Global styles: `/client/app/globals.css`

---

**Last Updated**: December 2025  
**Version**: 1.0.0  
**Maintained by**: StudySync Development Team
