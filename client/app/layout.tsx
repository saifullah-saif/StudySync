import type React from "react";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/contexts/auth-context";
import { HeaderGate } from "@/components/header-gate";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { FloatingChat } from "@/components/floating-chat";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "StudySync - Your Academic Study Companion",
  description:
    "Connect with study partners, book library spaces, share notes, and enhance your learning with AI-powered study tools.",
  generator: "v0.dev",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <AuthProvider>
          <HeaderGate />
          {children}
          <FloatingChat />
          <Toaster />
          <Sonner
            position="bottom-center"
            closeButton
            richColors
            duration={5000}
          />
        </AuthProvider>
      </body>
    </html>
  );
}
