"use client";

import type React from "react";
import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Home,
  Users,
  BookOpen,
  GraduationCap,
  FileText,
  Bot,
  Menu,
  User,
  LogOut,
  Zap,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetClose,
} from "@/components/ui/sheet";
import { AuthModals } from "@/components/auth-modals";
import { useAuth } from "@/contexts/auth-context";
import { THEME } from "@/styles/theme";

interface NavigationItem {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
}

const navigation: NavigationItem[] = [
  { name: "Dashboard", href: "/dashboard", icon: Home },
  { name: "Buddies", href: "/buddies", icon: Users },
  { name: "Library", href: "/library", icon: BookOpen },
  { name: "Courses", href: "/course", icon: GraduationCap },
  { name: "Notes", href: "/notes", icon: FileText },
  { name: "Assistant", href: "/assistant", icon: Bot },
];

export default function MobileNav() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [isSignInOpen, setIsSignInOpen] = useState<boolean>(false);
  const [isSignUpOpen, setIsSignUpOpen] = useState<boolean>(false);

  const handleSignOut = async (): Promise<void> => {
    setIsOpen(false);
    await logout();
    router.push("/");
  };

  const handleNavClick = (href: string): void => {
    if (!user) {
      setIsSignInOpen(true);
      setIsOpen(false);
    } else {
      router.push(href);
      setIsOpen(false);
    }
  };

  const isActiveRoute = (href: string): boolean => {
    if (pathname === href) return true;
    if (href === "/library" && pathname.startsWith("/library")) return true;
    if (href === "/assistant" && pathname.startsWith("/assistant")) return true;
    if (href === "/assistant" && pathname.startsWith("/flashcards"))
      return true;
    return false;
  };

  return (
    <>
      {/* Fixed Bottom Navigation Bar */}
      <div className="fixed bottom-0 left-0 right-0 z-50 md:hidden">
        <div
          className={`${THEME.components.navbar.base} border-t border-white/10`}
        >
          <div className="flex items-center justify-around h-16 px-2">
            {/* Home Quick Access */}
            <Link
              href="/"
              className={`flex flex-col items-center justify-center flex-1 h-full ${
                pathname === "/"
                  ? "text-white"
                  : "text-white/60 hover:text-white/80"
              } transition-colors duration-200`}
            >
              <Zap className="h-5 w-5" />
              <span className="text-xs mt-1 font-medium">Home</span>
            </Link>

            {/* Dashboard Quick Access */}
            <button
              onClick={() => handleNavClick("/dashboard")}
              className={`flex flex-col items-center justify-center flex-1 h-full ${
                isActiveRoute("/dashboard")
                  ? "text-white"
                  : "text-white/60 hover:text-white/80"
              } transition-colors duration-200`}
            >
              <Home className="h-5 w-5" />
              <span className="text-xs mt-1 font-medium">Dashboard</span>
            </button>

            {/* Library Quick Access */}
            <button
              onClick={() => handleNavClick("/library")}
              className={`flex flex-col items-center justify-center flex-1 h-full ${
                isActiveRoute("/library")
                  ? "text-white"
                  : "text-white/60 hover:text-white/80"
              } transition-colors duration-200`}
            >
              <BookOpen className="h-5 w-5" />
              <span className="text-xs mt-1 font-medium">Library</span>
            </button>

            {/* Profile/Sign In Quick Access */}
            {user ? (
              <Link
                href="/profile"
                className={`flex flex-col items-center justify-center flex-1 h-full ${
                  pathname === "/profile"
                    ? "text-white"
                    : "text-white/60 hover:text-white/80"
                } transition-colors duration-200`}
              >
                <User className="h-5 w-5" />
                <span className="text-xs mt-1 font-medium">Profile</span>
              </Link>
            ) : (
              <button
                onClick={() => setIsSignInOpen(true)}
                className="flex flex-col items-center justify-center flex-1 h-full text-white/60 hover:text-white/80 transition-colors duration-200"
              >
                <User className="h-5 w-5" />
                <span className="text-xs mt-1 font-medium">Sign In</span>
              </button>
            )}

            {/* Menu Sheet Trigger */}
            <Sheet open={isOpen} onOpenChange={setIsOpen}>
              <SheetTrigger asChild>
                <button className="flex flex-col items-center justify-center flex-1 h-full text-white/60 hover:text-white/80 transition-colors duration-200">
                  <Menu className="h-5 w-5" />
                  <span className="text-xs mt-1 font-medium">Menu</span>
                </button>
              </SheetTrigger>
              <SheetContent
                side="right"
                className="bg-[#191265]/95 backdrop-blur-xl text-white border-l border-white/10 w-80"
              >
                <div className="flex flex-col h-full py-6">
                  {/* Header */}
                  <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center space-x-2">
                      <div className="w-10 h-10 bg-white/10 rounded-lg flex items-center justify-center">
                        <Zap className="w-6 h-6 text-white" />
                      </div>
                      <span className="text-xl font-bold text-white">
                        StudySync
                      </span>
                    </div>
                  </div>

                  {/* User Info */}
                  {user && (
                    <div className="mb-6 px-2 py-3 bg-white/10 rounded-lg">
                      <p className="text-sm font-medium text-white">
                        {user.name}
                      </p>
                      <p className="text-xs text-white/60">{user.email}</p>
                    </div>
                  )}

                  {/* Navigation Links */}
                  <nav className="flex-1 space-y-2">
                    {navigation.map((item) => {
                      const Icon = item.icon;
                      return (
                        <button
                          key={item.name}
                          onClick={() => handleNavClick(item.href)}
                          className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                            isActiveRoute(item.href)
                              ? "bg-white/20 text-white"
                              : "text-white/70 hover:bg-white/10 hover:text-white"
                          }`}
                        >
                          <Icon className="h-5 w-5" />
                          <span className="font-medium">{item.name}</span>
                        </button>
                      );
                    })}
                  </nav>

                  {/* Footer Actions */}
                  <div className="border-t border-white/10 pt-4 mt-4 space-y-2">
                    {user ? (
                      <>
                        <Link
                          href="/profile"
                          onClick={() => setIsOpen(false)}
                          className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                            pathname === "/profile"
                              ? "bg-white/20 text-white"
                              : "text-white/70 hover:bg-white/10 hover:text-white"
                          }`}
                        >
                          <User className="h-5 w-5" />
                          <span className="font-medium">Profile</span>
                        </Link>
                        <button
                          onClick={handleSignOut}
                          className="w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-all duration-200"
                        >
                          <LogOut className="h-5 w-5" />
                          <span className="font-medium">Sign Out</span>
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          onClick={() => {
                            setIsOpen(false);
                            setIsSignInOpen(true);
                          }}
                          className="w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-white/70 hover:bg-white/10 hover:text-white transition-all duration-200"
                        >
                          <User className="h-5 w-5" />
                          <span className="font-medium">Sign In</span>
                        </button>
                        <button
                          onClick={() => {
                            setIsOpen(false);
                            setIsSignUpOpen(true);
                          }}
                          className="w-full flex items-center space-x-3 px-4 py-3 rounded-lg bg-white/20 text-white hover:bg-white/30 transition-all duration-200"
                        >
                          <BookOpen className="h-5 w-5" />
                          <span className="font-medium">Sign Up</span>
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>

      {/* Auth Modals */}
      <AuthModals
        isSignInOpen={isSignInOpen}
        setIsSignInOpen={setIsSignInOpen}
        isSignUpOpen={isSignUpOpen}
        setIsSignUpOpen={setIsSignUpOpen}
      />
    </>
  );
}
