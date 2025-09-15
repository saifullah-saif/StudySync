import Header from "@/components/header";
import EnhancedFooter from "@/components/enhanced-footer";
import {
  HeroSection,
  KeyBenefitsSection,
  SocialProofSection,
  ProductShowcaseSection,
  FeatureDeepDiveSection,
  PricingPreviewSection,
  FinalCTASection,
} from "@/components/landing-sections";

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col">
      {/* Keep the existing header completely intact */}
      <Header />

      <main className="flex-1">
        {/* 1. Hero Section - Value-driven headline, CTA, product screenshot */}
        <HeroSection />

        {/* 2. Key Benefits - 4 cards with icons + short copy */}
        <KeyBenefitsSection />

        {/* 3. Social Proof - Stats, logos, trust indicators */}
        <SocialProofSection />

        {/* 4. Product Showcase / How it Works - Screenshots, workflow steps */}
        <ProductShowcaseSection />

        {/* 5. Feature Deep Dive - Alternating text + visuals */}
        <FeatureDeepDiveSection />

        {/* 6. Pricing Preview - 3 clear plans with "Most Popular" highlight */}
        <PricingPreviewSection />

        {/* 7. Final Call to Action - Conversion booster before footer */}
        <FinalCTASection />
      </main>

      {/* 8. Enhanced Footer - Company links, product links, support links, legal, social */}
      <EnhancedFooter />
    </div>
  );
}
