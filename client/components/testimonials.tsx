import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Star, Quote } from "lucide-react";
import Image from "next/image";

// Testimonials Component (can be added to social proof section)
export function TestimonialsSection() {
  const testimonials = [
    {
      name: "Sarah Ahmed",
      role: "Computer Science Student",
      university: "BRACU",
      image: "/placeholder-user.jpg",
      rating: 5,
      text: "StudySync transformed how I study. The spaced repetition feature helped me retain 90% more information, and I found amazing study partners through the platform.",
    },
    {
      name: "Rahul Khan",
      role: "Medical Student",
      university: "NSU",
      image: "/placeholder-user.jpg",
      rating: 5,
      text: "The AI-powered flashcards are incredible. They adapt to my learning pace perfectly. I've improved my grades by 25% since using StudySync.",
    },
    {
      name: "Fatima Hassan",
      role: "Business Student",
      university: "IUB",
      image: "/placeholder-user.jpg",
      rating: 5,
      text: "Library booking made so easy! No more fighting for study spaces. The note sharing feature helped me discover resources I never knew existed.",
    },
  ];

  return (
    <section className="py-24 bg-slate-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <Badge
            variant="outline"
            className="mb-4 text-purple-600 border-purple-200"
          >
            Student Stories
          </Badge>
          <h2 className="text-4xl md:text-5xl font-bold text-slate-900 mb-6">
            Loved by students
            <span className="text-purple-600"> everywhere</span>
          </h2>
          <p className="text-xl text-slate-600 max-w-3xl mx-auto">
            Don't just take our word for it. Here's what students say about
            their StudySync experience.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {testimonials.map((testimonial, index) => (
            <Card
              key={index}
              className="bg-white border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
            >
              <CardContent className="p-8">
                <div className="flex items-center mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star
                      key={i}
                      className="h-4 w-4 text-yellow-400 fill-current"
                    />
                  ))}
                </div>

                <Quote className="h-8 w-8 text-slate-300 mb-4" />

                <p className="text-slate-600 mb-6 leading-relaxed">
                  "{testimonial.text}"
                </p>

                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-slate-200 rounded-full flex items-center justify-center">
                    <Image
                      src={testimonial.image}
                      alt={testimonial.name}
                      width={48}
                      height={48}
                      className="rounded-full"
                    />
                  </div>
                  <div>
                    <div className="font-semibold text-slate-900">
                      {testimonial.name}
                    </div>
                    <div className="text-sm text-slate-500">
                      {testimonial.role}
                    </div>
                    <div className="text-sm text-slate-400">
                      {testimonial.university}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}

export default TestimonialsSection;
