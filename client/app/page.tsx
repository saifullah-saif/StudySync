"use client";

import { useState } from "react";
import EnhancedFooter from "@/components/enhanced-footer";
import {
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
        {/* Hero Section - Full width, left-aligned */}
        <section className="relative bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 min-h-screen flex items-center overflow-hidden">
          {/* Background decoration */}
          <div className="absolute inset-0 bg-grid-slate-100 [mask-image:linear-gradient(0deg,white,rgba(255,255,255,0.6))]" />
          <div className="absolute top-0 right-0 -translate-y-12 translate-x-12">
            <div className="w-96 h-96 bg-blue-200 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-blob" />
          </div>
          <div className="absolute bottom-0 left-0 translate-y-12 -translate-x-12">
            <div className="w-96 h-96 bg-purple-200 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-blob animation-delay-2000" />
          </div>

          <div className="relative w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
            <div className="max-w-3xl">
              {/* Logo */}
              <div className="flex items-center space-x-3 mb-8">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 rounded-xl flex items-center justify-center shadow-lg">
                  <Zap className="w-7 h-7 text-white" />
                </div>
                <span className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">
                  StudySync
                </span>
              </div>

              {/* Main headline */}
              <h1 className="text-5xl md:text-7xl font-bold text-slate-900 mb-6 leading-tight">
                The Complete
                <span className="block text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">
                  Study Platform
                </span>
                for Students
              </h1>

              {/* Supporting text */}
              <p className="text-xl md:text-2xl text-slate-600 mb-10 leading-relaxed">
                Transform your academic journey with AI-powered flashcards,
                collaborative note sharing, study buddy matching, and seamless
                library booking. Everything you need to excel.
              </p>

              {/* CTA buttons */}
              <div className="flex flex-col sm:flex-row gap-4 mb-8">
                <Button
                  size="lg"
                  onClick={() => setIsSignUpOpen(true)}
                  className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-8 py-6 text-lg font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 group"
                >
                  <UserPlus className="h-5 w-5 mr-2" />
                  Become a Member
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  onClick={() => setIsSignInOpen(true)}
                  className="border-2 border-slate-300 text-slate-700 hover:bg-slate-50 px-8 py-6 text-lg font-semibold rounded-xl"
                >
                  <LogIn className="h-5 w-5 mr-2" />
                  Already a Member? Sign In
                </Button>
              </div>

              {/* Trust indicators */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 text-sm text-slate-500">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full" />
                  <span>Free forever plan</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full" />
                  <span>No credit card required</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full" />
                  <span>10,000+ students trust us</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Other sections */}
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
