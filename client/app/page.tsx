import Header from "@/components/header"
import Footer from "@/components/footer"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Users, BookOpen, Brain, Calendar } from "lucide-react"
import Link from "next/link"

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Header />

      <main className="flex-1">
        {/* Hero Section */}
        <section className="bg-gradient-to-br from-blue-50 to-indigo-100 py-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center">
              <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
                Your Academic Study
                <span className="text-blue-600"> Companion</span>
              </h1>
              <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
                Connect with study partners, book library spaces, share notes, and enhance your learning with AI-powered
                study tools.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button asChild size="lg" className="bg-blue-600 hover:bg-blue-700">
                  <Link href="/login">Get Started</Link>
                </Button>
                <Button asChild variant="outline" size="lg">
                  <Link href="/library">Explore Library</Link>
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">Everything you need to succeed</h2>
              <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                StudySync brings together all the tools you need for academic success in one seamless platform.
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
              <Card className="bg-white/70 backdrop-blur-sm border-0 shadow-lg hover:shadow-xl transition-shadow">
                <CardHeader className="text-center">
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                    <Users className="h-6 w-6 text-blue-600" />
                  </div>
                  <CardTitle className="text-xl">Study Partners</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-center">
                    Find and connect with classmates for collaborative study sessions and peer tutoring.
                  </CardDescription>
                </CardContent>
              </Card>

              <Card className="bg-white/70 backdrop-blur-sm border-0 shadow-lg hover:shadow-xl transition-shadow">
                <CardHeader className="text-center">
                  <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                    <Calendar className="h-6 w-6 text-green-600" />
                  </div>
                  <CardTitle className="text-xl">Library Booking</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-center">
                    Reserve study rooms and seats with real-time availability and interactive floor plans.
                  </CardDescription>
                </CardContent>
              </Card>

              <Card className="bg-white/70 backdrop-blur-sm border-0 shadow-lg hover:shadow-xl transition-shadow">
                <CardHeader className="text-center">
                  <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                    <BookOpen className="h-6 w-6 text-purple-600" />
                  </div>
                  <CardTitle className="text-xl">Note Sharing</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-center">
                    Upload, share, and discover lecture notes with AI-powered summaries and search.
                  </CardDescription>
                </CardContent>
              </Card>

              <Card className="bg-white/70 backdrop-blur-sm border-0 shadow-lg hover:shadow-xl transition-shadow">
                <CardHeader className="text-center">
                  <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                    <Brain className="h-6 w-6 text-orange-600" />
                  </div>
                  <CardTitle className="text-xl">AI Assistant</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-center">
                    Transform your notes into flashcards, podcasts, and immersive study experiences.
                  </CardDescription>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Stats Section */}
        <section className="bg-blue-600 py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid md:grid-cols-3 gap-8 text-center">
              <div>
                <div className="text-4xl font-bold text-white mb-2">10,000+</div>
                <div className="text-blue-100">Active Students</div>
              </div>
              <div>
                <div className="text-4xl font-bold text-white mb-2">500+</div>
                <div className="text-blue-100">Study Sessions Daily</div>
              </div>
              <div>
                <div className="text-4xl font-bold text-white mb-2">50,000+</div>
                <div className="text-blue-100">Notes Shared</div>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20">
          <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Ready to transform your study experience?</h2>
            <p className="text-lg text-gray-600 mb-8">
              Join thousands of students who are already using StudySync to achieve academic success.
            </p>
            <Button asChild size="lg" className="bg-blue-600 hover:bg-blue-700">
              <Link href="/signup">Sign Up Free</Link>
            </Button>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  )
}
