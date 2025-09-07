"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useState } from "react"
import { User, LogOut, Settings, BookOpen } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { AuthModals } from "@/components/auth-modals"
import { useAuth } from "@/contexts/auth-context"

const navigation = [
  { name: "Home", href: "/" },
  { name: "Buddies", href: "/buddies" },
  { name: "Library", href: "/library" },
  { name: "Courses", href: "/course" },
  { name: "Notes", href: "/notes" },
  { name: "Assistant", href: "/assistant" },
]

export default function Header() {
  const pathname = usePathname()
  const { user, logout } = useAuth()
  const [isSignInOpen, setIsSignInOpen] = useState(false)
  const [isSignUpOpen, setIsSignUpOpen] = useState(false)

  const handleSignOut = async () => {
    await logout()
  }

  return (
    <>
      <header className="bg-slate-800 dark:bg-slate-900 border-b border-slate-700 dark:border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Left side - Logo */}
            <div className="flex items-center space-x-4">
              <Link href="/" className="flex items-center space-x-2">
                <span className="text-xl font-bold text-white italic">StudySync</span>
              </Link>
            </div>

            {/* Right side - Navigation and Profile */}
            <div className="flex items-center space-x-1">
              <nav className="flex space-x-1">
                {navigation.map((item) => (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      pathname === item.href || 
                      (item.href === "/library" && pathname.startsWith("/library")) ||
                      (item.href === "/course" && pathname.startsWith("/course"))
                        ? "bg-slate-600 text-white"
                        : "text-slate-300 hover:bg-slate-700 hover:text-white"
                    }`}
                  >
                    {item.name}
                  </Link>
                ))}
              </nav>

              {/* Profile Dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="text-white hover:bg-slate-700">
                    <User className="h-5 w-5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="end"
                  className="w-56 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700"
                >
                  {user ? (
                    <>
                      <div className="px-2 py-1.5">
                        <p className="text-sm font-medium">{user.name}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">{user.email}</p>
                      </div>
                      <DropdownMenuSeparator className="bg-gray-200 dark:bg-gray-700" />
                      <DropdownMenuItem asChild className="hover:bg-gray-100 dark:hover:bg-gray-700">
                        <Link href="/profile">
                          <User className="mr-2 h-4 w-4" />
                          <span>Profile</span>
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem className="hover:bg-gray-100 dark:hover:bg-gray-700">
                        <Settings className="mr-2 h-4 w-4" />
                        <span>Settings</span>
                      </DropdownMenuItem>
                      <DropdownMenuSeparator className="bg-gray-200 dark:bg-gray-700" />
                      <DropdownMenuItem onClick={handleSignOut} className="hover:bg-gray-100 dark:hover:bg-gray-700">
                        <LogOut className="mr-2 h-4 w-4" />
                        <span>Sign out</span>
                      </DropdownMenuItem>
                    </>
                  ) : (
                    <>
                      <DropdownMenuItem
                        onClick={() => setIsSignInOpen(true)}
                        className="hover:bg-gray-100 dark:hover:bg-gray-700"
                      >
                        <User className="mr-2 h-4 w-4" />
                        <span>Sign In</span>
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => setIsSignUpOpen(true)}
                        className="hover:bg-gray-100 dark:hover:bg-gray-700"
                      >
                        <BookOpen className="mr-2 h-4 w-4" />
                        <span>Sign Up</span>
                      </DropdownMenuItem>
                    </>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </header>

      <AuthModals
        isSignInOpen={isSignInOpen}
        setIsSignInOpen={setIsSignInOpen}
        isSignUpOpen={isSignUpOpen}
        setIsSignUpOpen={setIsSignUpOpen}
      />
    </>
  )
}
