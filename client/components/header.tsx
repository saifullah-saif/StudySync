"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { User, LogOut, Settings, BookOpen, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { AuthModals } from "@/components/auth-modals";
import { useAuth } from "@/contexts/auth-context";
import { useRouter } from "next/navigation";
import { THEME } from "@/styles/theme";

const navigation = [
  { name: "Dashboard", href: "/dashboard" },
  { name: "Buddies", href: "/buddies" },
  { name: "Library", href: "/library" },
  { name: "Courses", href: "/course" },
  { name: "Notes", href: "/notes" },
  { name: "Assistant", href: "/assistant" },
];

export default function Header() {
  const router = useRouter();
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const [isSignInOpen, setIsSignInOpen] = useState(false);
  const [isSignUpOpen, setIsSignUpOpen] = useState(false);

  const handleSignOut = async () => {
    await logout();
  };

  return (
    <>
      <header
        className={`${THEME.components.navbar.base} sticky top-0 z-50 animate-slide-in-top transition-colors duration-300`}
      >
        <div className="pointer-events-none absolute inset-0 z-0 bg-gradient-to-b from-white/12 to-transparent" />
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Left side - Logo */}
            <div className="flex items-center space-x-4">
              <Link href="/" className="flex items-center space-x-2 group">
                <div className="w-10 h-10 bg-white/10 rounded-lg flex items-center justify-center group-hover:bg-white/20 transition-all duration-300">
                  <Zap className="w-6 h-6 text-white" />
                </div>
                <span className="text-xl font-bold text-white">
                  StudySync
                </span>
              </Link>
            </div>

            {/* Right side - Navigation and Profile */}
            <div className="flex items-center space-x-1">
              <nav className="flex space-x-1">
                {navigation.map((item) => (
                  <Button
                    key={item.name}
                    variant="ghost"
                    className={
                      pathname === item.href ||
                      (item.href === "/library" &&
                        pathname.startsWith("/library")) ||
                      (item.href === "/assistant" &&
                        pathname.startsWith("/assistant")) ||
                      (item.href === "/assistant" &&
                        pathname.startsWith("/flashcards"))
                        ? THEME.components.navbar.itemActive
                        : THEME.components.navbar.item
                    }
                    onClick={() => {
                      if (!user) {
                        setIsSignInOpen(true);
                      } else {
                        router.push(item.href);
                      }
                    }}
                  >
                    {item.name}
                  </Button>
                ))}
              </nav>
            </div>
            <div>
              {/* Profile Dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-white hover:bg-white/10 rounded-lg"
                  >
                    <User className="h-5 w-5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="end"
                  className="w-56 bg-white/90 backdrop-blur-xl border border-white/40 shadow-lg"
                >
                  {user ? (
                    <>
                      <div className="px-2 py-1.5">
                        <p className="text-sm font-medium">{user.name}</p>
                        <p className="text-xs text-slate-500">
                          {user.email}
                        </p>
                      </div>
                      <DropdownMenuSeparator className="bg-slate-200" />
                      <DropdownMenuItem
                        asChild
                        className="hover:bg-slate-100 cursor-pointer"
                      >
                        <Link href="/profile">
                          <User className="mr-2 h-4 w-4" />
                          <span>Profile</span>
                        </Link>
                      </DropdownMenuItem>

                      <DropdownMenuSeparator className="bg-slate-200" />
                      <DropdownMenuItem
                        onClick={handleSignOut}
                        className="hover:bg-slate-100 cursor-pointer text-red-600"
                      >
                        <LogOut className="mr-2 h-4 w-4" />
                        <span>Sign out</span>
                      </DropdownMenuItem>
                    </>
                  ) : (
                    <>
                      <DropdownMenuItem
                        onClick={() => setIsSignInOpen(true)}
                        className="hover:bg-slate-100 cursor-pointer"
                      >
                        <User className="mr-2 h-4 w-4" />
                        <span>Sign In</span>
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => setIsSignUpOpen(true)}
                        className="hover:bg-slate-100 cursor-pointer"
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
  );
}
