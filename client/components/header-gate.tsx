"use client";

import type React from "react";
import { usePathname } from "next/navigation";
import Header from "@/components/header";
import MobileNav from "@/components/mobile-nav";

export function HeaderGate() {
  const pathname = usePathname();

  // if (pathname === "/") return null;

  return (
    <>
      {/* Desktop Header - Hidden on mobile */}
      <div className="hidden md:block">
        <Header />
      </div>

      {/* Mobile Navigation - Hidden on desktop */}
      <div className="block md:hidden">
        <MobileNav />
      </div>
    </>
  );
}
