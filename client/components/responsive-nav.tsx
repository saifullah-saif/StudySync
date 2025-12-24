"use client";

import { useIsMobile } from "@/hooks/use-mobile";
import Header from "@/components/header";
import MobileNav from "@/components/mobile-nav";

/**
 * ResponsiveNav component that conditionally renders the appropriate
 * navigation component based on screen size.
 *
 * - Desktop (≥768px): Renders the Header component (top navigation bar)
 * - Mobile (<768px): Renders the MobileNav component (bottom navigation bar)
 */
export default function ResponsiveNav() {
  const isMobile = useIsMobile();

  return (
    <>
      {/* Desktop Header - Hidden on mobile via CSS as well for SSR */}
      <div className="hidden md:block">
        <Header />
      </div>

      {/* Mobile Navigation - Hidden on desktop via CSS as well for SSR */}
      <div className="block md:hidden">
        <MobileNav />
      </div>
    </>
  );
}
