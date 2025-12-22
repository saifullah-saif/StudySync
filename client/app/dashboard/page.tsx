"use client";

import { useAuth } from "@/contexts/auth-context";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import Link from "next/link";
import { 
  BookOpen, 
  Users, 
  Library, 
  GraduationCap, 
  FileText, 
  Sparkles,
  TrendingUp,
  Calendar,
  Target
} from "lucide-react";
import { ThemedCard, ThemedCardContent, ThemedCardDescription, ThemedCardHeader, ThemedCardTitle } from "@/components/ui/themed-card";
import { ThemedButton } from "@/components/ui/themed-button";
import { THEME } from "@/styles/theme";

const features = [
  {
    name: "Study Buddies",
    description: "Find and connect with peers who share your academic interests and study goals.",
    href: "/buddies",
    icon: Users,
    gradient: "from-blue-500 to-cyan-500",
  },
  {
    name: "Library Rooms",
    description: "Browse and book library study rooms for focused learning sessions.",
    href: "/library",
    icon: Library,
    gradient: "from-purple-500 to-pink-500",
  },
  {
    name: "Courses",
    description: "Manage your enrolled courses and access all course materials in one place.",
    href: "/course",
    icon: GraduationCap,
    gradient: "from-green-500 to-emerald-500",
  },
  {
    name: "Notes",
    description: "Share and discover study notes from students across your university.",
    href: "/notes",
    icon: FileText,
    gradient: "from-orange-500 to-red-500",
  },
  {
    name: "AI Assistant",
    description: "Get personalized help with AI-powered flashcards, summaries, and study tools.",
    href: "/assistant",
    icon: Sparkles,
    gradient: "from-indigo-500 to-purple-500",
  },
];

const quickStats = [
  { label: "Study Streak", value: "0 days", icon: TrendingUp, gradient: "from-emerald-500 to-teal-500" },
  { label: "Upcoming Sessions", value: "0", icon: Calendar, gradient: "from-blue-500 to-indigo-500" },
  { label: "Study Goals", value: "Set Goals", icon: Target, gradient: "from-purple-500 to-pink-500" },
];

export default function DashboardPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push("/");
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${THEME.gradients.hero}`}>
        <div className="text-center animate-fade-in">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#191265] mx-auto mb-4"></div>
          <p className="text-slate-600">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const firstName = user.name.split(" ")[0];

  return (
    <div className={`min-h-screen ${THEME.gradients.hero}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Welcome Section */}
        <div className="mb-12 animate-slide-in-bottom">
          <h1 className="text-4xl md:text-5xl font-bold text-slate-900 mb-3">
            Welcome back, {firstName}! 👋
          </h1>
          <p className="text-xl text-slate-600">
            Ready to make today productive? Here's your study hub.
          </p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12 stagger-fade-in">
          {quickStats.map((stat) => (
            <ThemedCard key={stat.label} className="border-none shadow-lg">
              <ThemedCardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-500 mb-1">{stat.label}</p>
                    <p className="text-2xl font-bold text-slate-900">{stat.value}</p>
                  </div>
                  <div className={`w-12 h-12 bg-gradient-to-br ${stat.gradient} rounded-xl flex items-center justify-center shadow-lg`}>
                    <stat.icon className="h-6 w-6 text-white" />
                  </div>
                </div>
              </ThemedCardContent>
            </ThemedCard>
          ))}
        </div>

        {/* Features Grid */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-slate-900 mb-6">Your Study Tools</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 stagger-fade-in">
            {features.map((feature) => (
              <Link key={feature.name} href={feature.href}>
                <ThemedCard interactive className="h-full transition-smooth">
                  <ThemedCardHeader>
                    <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${feature.gradient} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300`}>
                      <feature.icon className="h-6 w-6 text-white" />
                    </div>
                    <ThemedCardTitle className="group-hover:text-[#191265] transition-colors">
                      {feature.name}
                    </ThemedCardTitle>
                    <ThemedCardDescription>
                      {feature.description}
                    </ThemedCardDescription>
                  </ThemedCardHeader>
                  <ThemedCardContent>
                    <ThemedButton 
                      variant="ghost" 
                      className="w-full justify-start text-[#191265] hover:text-[#2d1b8f] hover:bg-[#191265]/5 group-hover:translate-x-1 transition-transform"
                    >
                      Get started →
                    </ThemedButton>
                  </ThemedCardContent>
                </ThemedCard>
              </Link>
            ))}
          </div>
        </div>

        {/* Getting Started Tips */}
        <ThemedCard className={`border-none ${THEME.gradients.primary} text-white animate-slide-in-bottom`}>
          <ThemedCardHeader>
            <ThemedCardTitle className="text-2xl font-bold flex items-center gap-2 text-white">
              <BookOpen className="h-6 w-6" />
              Getting Started with StudySync
            </ThemedCardTitle>
          </ThemedCardHeader>
          <ThemedCardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <h3 className="font-semibold text-lg">Quick Tips:</h3>
                <ul className="space-y-2 text-white/90">
                  <li className="flex items-start gap-2">
                    <span className="text-yellow-300 mt-1">✓</span>
                    <span>Upload your course notes to get AI-generated flashcards</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-yellow-300 mt-1">✓</span>
                    <span>Find study buddies in your department and courses</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-yellow-300 mt-1">✓</span>
                    <span>Book library rooms for group study sessions</span>
                  </li>
                </ul>
              </div>
              <div className="space-y-2">
                <h3 className="font-semibold text-lg">Need Help?</h3>
                <p className="text-white/90">
                  Visit our AI Assistant to get personalized study recommendations, 
                  generate summaries, or create custom flashcards from your materials.
                </p>
                <Link href="/assistant">
                  <ThemedButton variant="secondary" className="mt-4 bg-white text-[#191265] hover:bg-white/90">
                    Try AI Assistant
                  </ThemedButton>
                </Link>
              </div>
            </div>
          </ThemedCardContent>
        </ThemedCard>
      </div>
    </div>
  );
}
