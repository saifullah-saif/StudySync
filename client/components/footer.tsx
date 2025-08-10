import { MapPin, Globe } from "lucide-react"
import Link from "next/link"

export default function Footer() {
  return (
    <footer className="bg-blue-100 border-t border-blue-200 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex justify-between items-center">
          <div className="flex space-x-6">
            <Link href="/privacy" className="text-sm text-gray-600 hover:text-blue-600 transition-colors">
              Privacy Policy
            </Link>
            <Link href="/terms" className="text-sm text-gray-600 hover:text-blue-600 transition-colors">
              Terms and Conditions
            </Link>
            <Link href="/contact" className="text-sm text-gray-600 hover:text-blue-600 transition-colors">
              Contact Us
            </Link>
          </div>

          <div className="flex items-center space-x-3">
            <MapPin className="h-5 w-5 text-gray-500" />
            <Globe className="h-5 w-5 text-gray-500" />
          </div>
        </div>
      </div>
    </footer>
  )
}
