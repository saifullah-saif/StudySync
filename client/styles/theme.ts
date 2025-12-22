/**
 * StudySync Design System
 * Comprehensive theme configuration for consistent visual identity
 * Primary Brand Color: #191265 (Rich Blue)
 */

// ============================================
// COLOR TOKENS - Single Source of Truth
// ============================================
export const COLORS = {
  // Primary Brand Colors
  primary: {
    DEFAULT: "#191265", // Rich Blue - Main brand color
    50: "#f4f3ff",
    100: "#ebe9fe",
    200: "#d9d6fe",
    300: "#bfb8fd",
    400: "#9e8dfa",
    500: "#7c5bf5",
    600: "#6840ed",
    700: "#5930d8",
    800: "#4928b5",
    900: "#191265", // Primary brand
    950: "#1a0f4d",
  },
  
  // Secondary Colors
  secondary: {
    DEFAULT: "#7c3aed", // Purple accent
    50: "#faf5ff",
    100: "#f3e8ff",
    200: "#e9d5ff",
    300: "#d8b4fe",
    400: "#c084fc",
    500: "#a855f7",
    600: "#9333ea",
    700: "#7c3aed",
    800: "#6b21a8",
    900: "#581c87",
  },
  
  // Accent Colors
  accent: {
    blue: "#3b82f6",
    cyan: "#06b6d4",
    teal: "#14b8a6",
    green: "#10b981",
    yellow: "#f59e0b",
    orange: "#f97316",
    red: "#ef4444",
    pink: "#ec4899",
  },
  
  // Neutral Colors
  neutral: {
    50: "#f8fafc",
    100: "#f1f5f9",
    200: "#e2e8f0",
    300: "#cbd5e1",
    400: "#94a3b8",
    500: "#64748b",
    600: "#475569",
    700: "#334155",
    800: "#1e293b",
    900: "#0f172a",
    950: "#020617",
  },
  
  // Semantic Colors
  success: "#10b981",
  warning: "#f59e0b",
  error: "#ef4444",
  info: "#3b82f6",
};

// ============================================
// GRADIENTS
// ============================================
export const GRADIENTS = {
  primary: "bg-gradient-to-r from-[#191265] via-[#2d1b8f] to-[#4928b5]",
  primarySubtle: "bg-gradient-to-br from-[#191265]/10 via-[#2d1b8f]/5 to-transparent",
  secondary: "bg-gradient-to-r from-purple-600 via-violet-600 to-indigo-600",
  accent: "bg-gradient-to-r from-blue-500 via-cyan-500 to-teal-500",
  glass: "bg-gradient-to-br from-white/80 to-white/40 backdrop-blur-xl",
  dark: "bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900",
  
  // Feature-specific gradients
  hero: "bg-gradient-to-br from-slate-50 via-blue-50/30 to-purple-50/20",
  card: "bg-gradient-to-br from-white to-slate-50/50",
  hover: "hover:bg-gradient-to-r hover:from-[#191265] hover:to-[#2d1b8f]",
};

// ============================================
// TYPOGRAPHY
// ============================================
export const TYPOGRAPHY = {
  fontFamily: {
    sans: "var(--font-geist-sans), system-ui, -apple-system, sans-serif",
    mono: "var(--font-geist-mono), monospace",
  },
  
  fontSize: {
    xs: "0.75rem",     // 12px
    sm: "0.875rem",    // 14px
    base: "1rem",      // 16px
    lg: "1.125rem",    // 18px
    xl: "1.25rem",     // 20px
    "2xl": "1.5rem",   // 24px
    "3xl": "1.875rem", // 30px
    "4xl": "2.25rem",  // 36px
    "5xl": "3rem",     // 48px
    "6xl": "3.75rem",  // 60px
    "7xl": "4.5rem",   // 72px
  },
  
  fontWeight: {
    normal: "400",
    medium: "500",
    semibold: "600",
    bold: "700",
    extrabold: "800",
  },
  
  lineHeight: {
    tight: "1.2",
    normal: "1.5",
    relaxed: "1.75",
  },
};

// ============================================
// SPACING & SIZING
// ============================================
export const SPACING = {
  xs: "0.5rem",   // 8px
  sm: "0.75rem",  // 12px
  md: "1rem",     // 16px
  lg: "1.5rem",   // 24px
  xl: "2rem",     // 32px
  "2xl": "3rem",  // 48px
  "3xl": "4rem",  // 64px
  "4xl": "6rem",  // 96px
};

export const BORDER_RADIUS = {
  none: "0",
  sm: "0.375rem",  // 6px
  md: "0.5rem",    // 8px
  lg: "0.75rem",   // 12px
  xl: "1rem",      // 16px
  "2xl": "1.5rem", // 24px
  full: "9999px",
};

// ============================================
// SHADOWS & EFFECTS
// ============================================
export const SHADOWS = {
  sm: "0 1px 2px 0 rgb(0 0 0 / 0.05)",
  md: "0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)",
  lg: "0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)",
  xl: "0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)",
  "2xl": "0 25px 50px -12px rgb(0 0 0 / 0.25)",
  inner: "inset 0 2px 4px 0 rgb(0 0 0 / 0.05)",
  
  // Colored shadows for brand elements
  primaryGlow: "0 10px 40px -10px rgba(25, 18, 101, 0.4)",
  secondaryGlow: "0 10px 40px -10px rgba(124, 58, 237, 0.4)",
};

// ============================================
// ANIMATIONS & TRANSITIONS
// ============================================
export const ANIMATIONS = {
  // Transition Durations
  duration: {
    fast: "150ms",
    normal: "300ms",
    slow: "500ms",
  },
  
  // Timing Functions
  easing: {
    default: "cubic-bezier(0.4, 0, 0.2, 1)",
    in: "cubic-bezier(0.4, 0, 1, 1)",
    out: "cubic-bezier(0, 0, 0.2, 1)",
    inOut: "cubic-bezier(0.4, 0, 0.2, 1)",
    spring: "cubic-bezier(0.34, 1.56, 0.64, 1)",
  },
  
  // CSS Classes for animations
  fadeIn: "animate-in fade-in duration-300",
  fadeOut: "animate-out fade-out duration-200",
  slideIn: "animate-in slide-in-from-bottom-4 duration-300",
  slideOut: "animate-out slide-out-to-bottom-4 duration-200",
  scaleIn: "animate-in zoom-in-95 duration-300",
  scaleOut: "animate-out zoom-out-95 duration-200",
};

// ============================================
// COMPONENT TOKENS
// ============================================
export const COMPONENTS = {
  // Button Styles
  button: {
    base: "inline-flex items-center justify-center rounded-lg font-medium transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none",
    
    variants: {
      primary: `bg-[#191265] text-white hover:bg-[#2d1b8f] active:bg-[#1a0f4d] shadow-lg hover:shadow-xl ${SHADOWS.primaryGlow}`,
      secondary: "bg-white text-[#191265] border-2 border-[#191265] hover:bg-[#191265] hover:text-white",
      outline: "border-2 border-slate-300 text-slate-700 hover:bg-slate-50 hover:border-[#191265] hover:text-[#191265]",
      ghost: "text-slate-700 hover:bg-slate-100 hover:text-[#191265]",
      gradient: `${GRADIENTS.primary} text-white hover:shadow-xl`,
    },
    
    sizes: {
      sm: "h-9 px-4 text-sm",
      md: "h-11 px-6 text-base",
      lg: "h-14 px-8 text-lg",
      xl: "h-16 px-10 text-xl",
    },
  },
  
  // Card Styles
  card: {
    base: "rounded-2xl border border-slate-200 bg-white shadow-md transition-all duration-300",
    hover: "hover:shadow-xl hover:border-[#191265]/20 hover:-translate-y-1",
    interactive: "cursor-pointer hover:shadow-xl hover:border-[#191265]/30 hover:-translate-y-1",
    glass: "rounded-2xl border border-white/20 bg-white/80 backdrop-blur-xl shadow-lg",
  },
  
  // Input Styles
  input: {
    base: "flex h-11 w-full rounded-lg border border-slate-300 bg-white px-4 py-2 text-base transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#191265] focus-visible:border-[#191265] disabled:opacity-50",
    error: "border-red-500 focus-visible:ring-red-500",
  },
  
  // Modal/Dialog Styles
  modal: {
    overlay: "fixed inset-0 z-50 bg-black/60 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
    content: "fixed left-[50%] top-[50%] z-50 w-full max-w-lg translate-x-[-50%] translate-y-[-50%] rounded-2xl border border-slate-200 bg-white shadow-2xl data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%]",
  },
  
  // Navbar Styles
  navbar: {
    base: "bg-[#191265]/75 supports-[backdrop-filter]:bg-[#191265]/60 backdrop-blur-xl border-b border-white/10 shadow-lg",
    item: "text-white/80 hover:text-white hover:bg-white/10 transition-all duration-200 rounded-lg px-4 py-2 font-medium",
    itemActive: "text-white bg-white/20 rounded-lg px-4 py-2 font-medium",
  },
};

// ============================================
// Z-INDEX LAYERS
// ============================================
export const Z_INDEX = {
  base: 0,
  dropdown: 1000,
  sticky: 1100,
  fixed: 1200,
  overlay: 1300,
  modal: 1400,
  popover: 1500,
  tooltip: 1600,
};

// ============================================
// BREAKPOINTS
// ============================================
export const BREAKPOINTS = {
  xs: "475px",
  sm: "640px",
  md: "768px",
  lg: "1024px",
  xl: "1280px",
  "2xl": "1536px",
};

// ============================================
// HELPER FUNCTIONS
// ============================================
export const getButtonClasses = (variant: keyof typeof COMPONENTS.button.variants = "primary", size: keyof typeof COMPONENTS.button.sizes = "md") => {
  return `${COMPONENTS.button.base} ${COMPONENTS.button.variants[variant]} ${COMPONENTS.button.sizes[size]}`;
};

export const getCardClasses = (interactive = false, glass = false) => {
  if (glass) return COMPONENTS.card.glass;
  return `${COMPONENTS.card.base} ${interactive ? COMPONENTS.card.interactive : COMPONENTS.card.hover}`;
};

// ============================================
// EXPORT UNIFIED THEME OBJECT
// ============================================
export const THEME = {
  colors: COLORS,
  gradients: GRADIENTS,
  typography: TYPOGRAPHY,
  spacing: SPACING,
  borderRadius: BORDER_RADIUS,
  shadows: SHADOWS,
  animations: ANIMATIONS,
  components: COMPONENTS,
  zIndex: Z_INDEX,
  breakpoints: BREAKPOINTS,
  
  // Helper functions
  getButtonClasses,
  getCardClasses,
} as const;

export default THEME;
