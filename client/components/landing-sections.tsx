import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Check,
  Star,
  ArrowRight,
  Users,
  Trophy,
  Clock,
  BookOpen,
  Brain,
  Calendar,
  Zap,
  Shield,
  BarChart3,
} from "lucide-react";
import Link from "next/link";


// Hero Section Component
export function HeroSection() {
  return (
    <section className="relative bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 pt-20 pb-24 overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 bg-grid-slate-100 [mask-image:linear-gradient(0deg,white,rgba(255,255,255,0.6))]" />
      <div className="absolute top-0 right-0 -translate-y-12 translate-x-12">
        <div className="w-72 h-72 bg-blue-200 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-blob" />
      </div>
      <div className="absolute bottom-0 left-0 translate-y-12 -translate-x-12">
        <div className="w-72 h-72 bg-purple-200 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-blob animation-delay-2000" />
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-4xl mx-auto">
          {/* Social proof badge */}
          <div className="inline-flex items-center gap-2 bg-white/80 backdrop-blur-sm border border-blue-200 rounded-full px-4 py-2 mb-8">
            <div className="flex items-center">
              <Star className="h-4 w-4 text-yellow-400 fill-current" />
              <Star className="h-4 w-4 text-yellow-400 fill-current" />
              <Star className="h-4 w-4 text-yellow-400 fill-current" />
              <Star className="h-4 w-4 text-yellow-400 fill-current" />
              <Star className="h-4 w-4 text-yellow-400 fill-current" />
            </div>
            <span className="text-sm font-medium text-slate-600">
              Trusted by 10,000+ students
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
          <p className="text-xl md:text-2xl text-slate-600 mb-10 leading-relaxed max-w-3xl mx-auto">
            Transform your academic journey with AI-powered flashcards,
            collaborative note sharing, study buddy matching, and seamless
            library booking. Everything you need to excel.
          </p>

          {/* CTA buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12">
            <Button
              asChild
              size="lg"
              className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 text-lg font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 group"
            >
              <Link href="/auth" className="flex items-center gap-2">
                Start Free Today
                <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
              </Link>
            </Button>
            <Button
              asChild
              variant="outline"
              size="lg"
              className="border-2 border-slate-300 text-slate-700 hover:bg-slate-50 px-8 py-3 text-lg font-semibold rounded-xl"
            >
              <Link href="#demo" className="flex items-center gap-2">
                Watch Demo
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              </Link>
            </Button>
          </div>

          {/* Trust indicators */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-6 text-sm text-slate-500">
            <div className="flex items-center gap-2">
              <Check className="h-4 w-4 text-green-500" />
              <span>Free forever plan</span>
            </div>
            <div className="flex items-center gap-2">
              <Check className="h-4 w-4 text-green-500" />
              <span>No credit card required</span>
            </div>
            <div className="flex items-center gap-2">
              <Check className="h-4 w-4 text-green-500" />
              <span>Setup in 2 minutes</span>
            </div>
          </div>
        </div>

        {/* Product screenshot placeholder */}
        <div className="mt-16 relative max-w-5xl mx-auto">
          <div className="relative bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
            <div className="bg-slate-100 px-4 py-3 flex items-center gap-2">
              <div className="w-3 h-3 bg-red-400 rounded-full" />
              <div className="w-3 h-3 bg-yellow-400 rounded-full" />
              <div className="w-3 h-3 bg-green-400 rounded-full" />
            </div>
            <div className="aspect-video bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
              <div className="text-center">
                <BookOpen className="h-16 w-16 text-blue-400 mx-auto mb-4" />
                <p className="text-slate-500 font-medium">
                  Product Demo Screenshot
                </p>
                <p className="text-sm text-slate-400">Dashboard Preview</p>
              </div>
            </div>
          </div>
          {/* Floating elements */}
          <div className="absolute -top-6 -right-6 bg-white rounded-xl shadow-lg p-4 hidden lg:block">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                <Trophy className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <div className="font-semibold text-slate-900">Level Up!</div>
                <div className="text-sm text-slate-500">+50 XP earned</div>
              </div>
            </div>
          </div>
          <div className="absolute -bottom-6 -left-6 bg-white rounded-xl shadow-lg p-4 hidden lg:block">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                <Users className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <div className="font-semibold text-slate-900">Study Match!</div>
                <div className="text-sm text-slate-500">Found 3 buddies</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// Key Benefits Section
export function KeyBenefitsSection() {
  const benefits = [
    {
      icon: Brain,
      title: "Smart Learning",
      description:
        "AI-powered spaced repetition adapts to your learning style for maximum retention",
      color: "from-purple-500 to-pink-500",
    },
    {
      icon: Users,
      title: "Study Together",
      description:
        "Find compatible study partners and collaborate on challenging subjects",
      color: "from-blue-500 to-cyan-500",
    },
    {
      icon: Clock,
      title: "Save Time",
      description:
        "Streamline your study process and focus on what matters most",
      color: "from-green-500 to-emerald-500",
    },
    {
      icon: BarChart3,
      title: "Track Progress",
      description:
        "Detailed analytics and gamification keep you motivated and on track",
      color: "from-orange-500 to-red-500",
    },
  ];

  return (
    <section className="py-24 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <Badge
            variant="outline"
            className="mb-4 text-blue-600 border-blue-200"
          >
            Why Choose StudySync
          </Badge>
          <h2 className="text-4xl md:text-5xl font-bold text-slate-900 mb-6">
            Everything you need to
            <span className="text-blue-600"> succeed academically</span>
          </h2>
          <p className="text-xl text-slate-600 max-w-3xl mx-auto">
            Join thousands of students who have transformed their study habits
            and achieved better grades with our comprehensive platform.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {benefits.map((benefit, index) => (
            <Card
              key={index}
              className="group bg-white border-0 shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-2"
            >
              <CardContent className="p-8 text-center">
                <div
                  className={`w-16 h-16 rounded-2xl bg-gradient-to-r ${benefit.color} flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300`}
                >
                  <benefit.icon className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-4">
                  {benefit.title}
                </h3>
                <p className="text-slate-600 leading-relaxed">
                  {benefit.description}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}

// Social Proof Section
export function SocialProofSection() {
  const stats = [
    { value: "10,000+", label: "Active Students", icon: Users },
    { value: "50,000+", label: "Study Sessions", icon: BookOpen },
    { value: "500+", label: "Universities", icon: Trophy },
    { value: "98%", label: "Success Rate", icon: BarChart3 },
  ];

  return (
    <section className="py-24 bg-slate-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">
            Trusted by students worldwide
          </h2>
          <p className="text-lg text-slate-600">
            Join the growing community of successful learners
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 mb-16">
          {stats.map((stat, index) => (
            <div key={index} className="text-center group">
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mx-auto mb-4 group-hover:bg-blue-200 transition-colors">
                <stat.icon className="h-6 w-6 text-blue-600" />
              </div>
              <div className="text-3xl md:text-4xl font-bold text-slate-900 mb-2">
                {stat.value}
              </div>
              <div className="text-slate-600">{stat.label}</div>
            </div>
          ))}
        </div>

        {/* University logos placeholder */}
        <div className="border-t border-slate-200 pt-16">
          <p className="text-center text-slate-500 mb-8">
            Used by students at top universities
          </p>
          <div className="flex justify-center items-center gap-8 opacity-60">
            {/* Placeholder for university logos */}
            <div className="w-24 h-12 bg-slate-200 rounded flex items-center justify-center">
              <span className="text-xs text-slate-500">BRACU</span>
            </div>
            <div className="w-24 h-12 bg-slate-200 rounded flex items-center justify-center">
              <span className="text-xs text-slate-500">NSU</span>
            </div>
            <div className="w-24 h-12 bg-slate-200 rounded flex items-center justify-center">
              <span className="text-xs text-slate-500">IUB</span>
            </div>
            <div className="w-24 h-12 bg-slate-200 rounded flex items-center justify-center">
              <span className="text-xs text-slate-500">BUET</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// Product Showcase Section
export function ProductShowcaseSection() {
  const features = [
    {
      title: "Smart Flashcards",
      description:
        "AI-powered spaced repetition system that adapts to your learning pace",
      image: "/placeholder.svg",
      stats: ["85% better retention", "50% faster learning"],
    },
    {
      title: "Study Buddy Matching",
      description:
        "Connect with compatible study partners based on your courses and goals",
      image: "/placeholder.svg",
      stats: ["10,000+ connections", "4.9/5 satisfaction"],
    },
    {
      title: "Library Booking",
      description:
        "Reserve study spaces with real-time availability and seat selection",
      image: "/placeholder.svg",
      stats: ["500+ rooms available", "Instant booking"],
    },
  ];

  return (
    <section className="py-24 bg-white" id="demo">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <Badge
            variant="outline"
            className="mb-4 text-purple-600 border-purple-200"
          >
            See It In Action
          </Badge>
          <h2 className="text-4xl md:text-5xl font-bold text-slate-900 mb-6">
            Powerful features that
            <span className="text-purple-600"> work seamlessly</span>
          </h2>
          <p className="text-xl text-slate-600 max-w-3xl mx-auto">
            Discover how StudySync transforms your study experience with
            innovative tools designed for modern learners.
          </p>
        </div>

        <div className="space-y-24">
          {features.map((feature, index) => (
            <div
              key={index}
              className={`flex flex-col ${
                index % 2 === 1 ? "lg:flex-row-reverse" : "lg:flex-row"
              } items-center gap-12`}
            >
              <div className="flex-1">
                <h3 className="text-3xl font-bold text-slate-900 mb-6">
                  {feature.title}
                </h3>
                <p className="text-lg text-slate-600 mb-8 leading-relaxed">
                  {feature.description}
                </p>
                <div className="flex flex-wrap gap-4 mb-8">
                  {feature.stats.map((stat, statIndex) => (
                    <Badge
                      key={statIndex}
                      variant="secondary"
                      className="bg-blue-50 text-blue-700 px-4 py-2"
                    >
                      {stat}
                    </Badge>
                  ))}
                </div>
                <Button
                  asChild
                  className="bg-slate-900 hover:bg-slate-800 text-white"
                >
                  <Link href="/auth">Try This Feature</Link>
                </Button>
              </div>
              <div className="flex-1">
                <div className="relative bg-gradient-to-br from-slate-50 to-slate-100 rounded-2xl p-8 shadow-xl">
                  <div className="aspect-video bg-white rounded-xl shadow-inner flex items-center justify-center">
                    <div className="text-center">
                      <div className="w-16 h-16 bg-slate-200 rounded-full mx-auto mb-4 flex items-center justify-center">
                        <BookOpen className="h-8 w-8 text-slate-400" />
                      </div>
                      <p className="text-slate-500">Feature Screenshot</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// Feature Deep Dive Section
export function FeatureDeepDiveSection() {
  const features = [
    {
      icon: Brain,
      title: "AI-Powered Learning",
      description:
        "Advanced algorithms analyze your learning patterns and optimize study schedules",
      features: [
        "Spaced repetition optimization",
        "Difficulty adaptation",
        "Progress prediction",
        "Smart recommendations",
      ],
    },
    {
      icon: Users,
      title: "Collaborative Study",
      description:
        "Connect with peers and create powerful study networks for better outcomes",
      features: [
        "Smart buddy matching",
        "Group study sessions",
        "Real-time chat",
        "Progress sharing",
      ],
    },
    {
      icon: Calendar,
      title: "Study Management",
      description:
        "Organize your entire academic life in one comprehensive platform",
      features: [
        "Library booking",
        "Schedule management",
        "Task tracking",
        "Deadline reminders",
      ],
    },
    {
      icon: BookOpen,
      title: "Content Creation",
      description:
        "Transform your notes into interactive learning materials automatically",
      features: [
        "PDF to flashcards",
        "Audio generation",
        "Smart summaries",
        "Visual aids",
      ],
    },
  ];

  return (
    <section className="py-24 bg-slate-900 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <Badge
            variant="outline"
            className="mb-4 text-blue-400 border-blue-700 bg-blue-950"
          >
            Deep Dive
          </Badge>
          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            Features designed for
            <span className="text-blue-400"> serious learners</span>
          </h2>
          <p className="text-xl text-slate-300 max-w-3xl mx-auto">
            Every feature is carefully crafted to enhance your learning
            experience and boost academic performance.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-12">
          {features.map((feature, index) => (
            <Card
              key={index}
              className="bg-slate-800 border-slate-700 hover:bg-slate-750 transition-colors"
            >
              <CardContent className="p-8">
                <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center mb-6">
                  <feature.icon className="h-6 w-6 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-white mb-4">
                  {feature.title}
                </h3>
                <p className="text-slate-300 mb-6 leading-relaxed">
                  {feature.description}
                </p>
                <ul className="space-y-3">
                  {feature.features.map((item, itemIndex) => (
                    <li key={itemIndex} className="flex items-center gap-3">
                      <Check className="h-4 w-4 text-green-400 flex-shrink-0" />
                      <span className="text-slate-300">{item}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}

// Pricing Preview Section

// Final CTA Section
export function FinalCTASection() {
  return (
    <section className="py-24 bg-gradient-to-r from-blue-600 to-purple-600 text-white">
      <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            Ready to transform your
            <span className="block">study experience?</span>
          </h2>
          <p className="text-xl text-blue-100 mb-8 leading-relaxed">
            Join thousands of students who have already revolutionized their
            learning with StudySync. Start your journey to academic excellence
            today.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-8">
          <Button
            asChild
            size="lg"
            className="bg-white text-blue-600 hover:bg-slate-100 px-8 py-3 text-lg font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 group"
          >
            <Link href="/auth" className="flex items-center gap-2">
              Start Your Free Trial
              <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
            </Link>
          </Button>
          <Button
            asChild
            variant="outline"
            size="lg"
            className="border-2 border-white/30 text-white hover:bg-white/10 px-8 py-3 text-lg font-semibold rounded-xl"
          >
            <Link href="/contact">Talk to Sales</Link>
          </Button>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-6 text-sm text-blue-100">
          <div className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            <span>SOC 2 Compliant</span>
          </div>
          <div className="flex items-center gap-2">
            <Check className="h-4 w-4" />
            <span>99.9% Uptime SLA</span>
          </div>
          <div className="flex items-center gap-2">
            <Zap className="h-4 w-4" />
            <span>Setup in 2 minutes</span>
          </div>
        </div>
      </div>
    </section>
  );
}
