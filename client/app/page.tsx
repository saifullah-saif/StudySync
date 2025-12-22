"use client";

import { useState } from "react";
import EnhancedFooter from "@/components/enhanced-footer";
import {
  HeroSection,
  KeyBenefitsSection,
  SocialProofSection,
  ProductShowcaseSection,
  FeatureDeepDiveSection,
  FinalCTASection,
} from "@/components/landing-sections";
import { AuthModals } from "@/components/auth-modals";
import { Button } from "@/components/ui/button";
import { UserPlus, LogIn, Zap } from "lucide-react";

export default function HomePage() {
  const [isSignInOpen, setIsSignInOpen] = useState(false);
  const [isSignUpOpen, setIsSignUpOpen] = useState(false);

  return (
    <div className="min-h-screen flex flex-col">
      <main className="flex-1">
        {/* 1. Hero Section - Value-driven headline, CTA, product screenshot */}
        <HeroSection />

        {/* 2. Key Benefits - 4 cards with icons + short copy */}
        <KeyBenefitsSection />
        <SocialProofSection />
        <ProductShowcaseSection />
        <FeatureDeepDiveSection />
        <FinalCTASection />
      </main>

      <EnhancedFooter />

      {/* Auth Modals */}
      <AuthModals
        isSignInOpen={isSignInOpen}
        setIsSignInOpen={setIsSignInOpen}
        isSignUpOpen={isSignUpOpen}
        setIsSignUpOpen={setIsSignUpOpen}
      />
    </div>
  );
}
