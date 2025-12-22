"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Eye, EyeOff, Upload } from "lucide-react"
import { useAuth, type User } from "@/contexts/auth-context"

interface AuthModalsProps {
  isSignInOpen: boolean
  setIsSignInOpen: (open: boolean) => void
  isSignUpOpen: boolean
  setIsSignUpOpen: (open: boolean) => void
}

export function AuthModals({
  isSignInOpen,
  setIsSignInOpen,
  isSignUpOpen,
  setIsSignUpOpen,
}: AuthModalsProps) {
  const router = useRouter()
  const { login, register, loading: authLoading } = useAuth()
  const [showPassword, setShowPassword] = useState(false)
  const [signUpStep, setSignUpStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  
  // Sign in form data
  const [signInData, setSignInData] = useState({
    email: "",
    password: "",
  })
  
  // Sign up form data - aligned with users table schema
  const [signUpData, setSignUpData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    department: "",
    semester: "",
    bio: "",
    profilePicture: null as File | null,
  })

  const handleSignUpNext = () => {
    if (signUpStep < 5) {
      setSignUpStep(signUpStep + 1)
    }
  }

  const handleSignUpBack = () => {
    if (signUpStep > 1) {
      setSignUpStep(signUpStep - 1)
    }
  }

  const handleSignUpComplete = async () => {
    try {
      setLoading(true)
      setError("")
      
      const userData = {
        name: `${signUpData.firstName} ${signUpData.lastName}`.trim(),
        email: signUpData.email,
        password: signUpData.password,
        department: signUpData.department,
        semester: signUpData.semester ? parseInt(signUpData.semester) : null,
        bio: signUpData.bio || null,
      }

      const result = await register(userData)
      
      if (result.success && result.user) {
        setSignUpStep(1)
        setSignUpData({
          firstName: "",
          lastName: "",
          email: "",
          password: "",
          department: "",
          semester: "",
          bio: "",
          profilePicture: null,
        })
        setIsSignUpOpen(false)
        // Redirect to dashboard after successful registration
        router.push("/dashboard")
      } else {
        setError(result.message || "Registration failed")
      }
    } catch (error: any) {
      setError("Registration failed")
    } finally {
      setLoading(false)
    }
  }

  const handleSignInSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      setLoading(true)
      setError("")
      
      const result = await login(signInData)
      
      if (result.success && result.user) {
        setSignInData({ email: "", password: "" })
        setIsSignInOpen(false)
        // Redirect to dashboard after successful sign-in
        router.push("/dashboard")
      } else {
        setError(result.message || "Login failed")
      }
    } catch (error: any) {
      setError("Login failed")
    } finally {
      setLoading(false)
    }
  }

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      setSignUpData({ ...signUpData, profilePicture: file })
    }
  }

  // Reset form states when modals close
  const handleSignInClose = (open: boolean) => {
    setIsSignInOpen(open)
    if (!open) {
      setLoading(false)
      setError("")
    }
  }

  const handleSignUpClose = (open: boolean) => {
    setIsSignUpOpen(open)
    if (!open) {
      setLoading(false)
      setError("")
      setSignUpStep(1)
    }
  }

  return (
    <>
      {/* Sign In Modal */}
      <Dialog open={isSignInOpen} onOpenChange={handleSignInClose}>
        <DialogContent className="sm:max-w-md bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-center text-gray-900 dark:text-white">
              Welcome back
            </DialogTitle>
            <DialogDescription className="text-center text-gray-600 dark:text-gray-400">
              Sign in to your StudySync account to continue your learning journey
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSignInSubmit} className="space-y-4">
            {error && (
              <div className="p-3 text-sm text-red-600 bg-red-100 rounded-md">
                {error}
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="signin-email" className="text-gray-700 dark:text-gray-300">
                Email
              </Label>
              <Input
                id="signin-email"
                type="email"
                value={signInData.email}
                onChange={(e) => setSignInData({ ...signInData, email: e.target.value })}
                placeholder="Enter your email"
                className="bg-gray-50 dark:bg-gray-700 border-gray-300 dark:border-gray-600"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="signin-password" className="text-gray-700 dark:text-gray-300">
                Password
              </Label>
              <div className="relative">
                <Input
                  id="signin-password"
                  type={showPassword ? "text" : "password"}
                  value={signInData.password}
                  onChange={(e) => setSignInData({ ...signInData, password: e.target.value })}
                  placeholder="Enter your password"
                  className="pr-10 bg-gray-50 dark:bg-gray-700 border-gray-300 dark:border-gray-600"
                  required
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
            </div>
            <Button 
              type="submit" 
              className="w-full bg-blue-600 hover:bg-blue-700"
              disabled={loading}
            >
              {loading ? "Signing In..." : "Sign In"}
            </Button>
            <div className="text-center">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Don't have an account?{" "}
                <button
                  type="button"
                  onClick={() => {
                    setIsSignInOpen(false)
                    setIsSignUpOpen(true)
                    setError("")
                  }}
                  className="text-blue-600 hover:underline font-medium"
                >
                  Sign up
                </button>
              </p>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Sign Up Modal */}
      <Dialog open={isSignUpOpen} onOpenChange={handleSignUpClose}>
        <DialogContent className="sm:max-w-md bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-center text-gray-900 dark:text-white">
              Create Account - Step {signUpStep} of 5
            </DialogTitle>
            <DialogDescription className="text-center text-gray-600 dark:text-gray-400">
              {signUpStep === 1 && "Let's start with your basic information"}
              {signUpStep === 2 && "Tell us about your academic details"}
              {signUpStep === 3 && "Set up your account credentials"}
              {signUpStep === 4 && "Add a personal touch to your profile"}
              {signUpStep === 5 && "Upload your profile picture"}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {error && (
              <div className="p-3 text-sm text-red-600 bg-red-100 rounded-md">
                {error}
              </div>
            )}
            
            {/* Step 1: Name */}
            {signUpStep === 1 && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="firstName" className="text-gray-700 dark:text-gray-300">
                    First Name
                  </Label>
                  <Input
                    id="firstName"
                    value={signUpData.firstName}
                    onChange={(e) => setSignUpData({ ...signUpData, firstName: e.target.value })}
                    placeholder="Enter your first name"
                    className="bg-gray-50 dark:bg-gray-700 border-gray-300 dark:border-gray-600"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName" className="text-gray-700 dark:text-gray-300">
                    Last Name
                  </Label>
                  <Input
                    id="lastName"
                    value={signUpData.lastName}
                    onChange={(e) => setSignUpData({ ...signUpData, lastName: e.target.value })}
                    placeholder="Enter your last name"
                    className="bg-gray-50 dark:bg-gray-700 border-gray-300 dark:border-gray-600"
                    required
                  />
                </div>
              </>
            )}

            {/* Step 2: Department & Semester */}
            {signUpStep === 2 && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="department" className="text-gray-700 dark:text-gray-300">
                    Department
                  </Label>
                  <Select
                    value={signUpData.department}
                    onValueChange={(value) => setSignUpData({ ...signUpData, department: value })}
                  >
                    <SelectTrigger className="bg-gray-50 dark:bg-gray-700 border-gray-300 dark:border-gray-600">
                      <SelectValue placeholder="Select your department" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Computer Science">Computer Science</SelectItem>
                      <SelectItem value="Electrical Engineering">Electrical Engineering</SelectItem>
                      <SelectItem value="Mechanical Engineering">Mechanical Engineering</SelectItem>
                      <SelectItem value="Civil Engineering">Civil Engineering</SelectItem>
                      <SelectItem value="Mathematics">Mathematics</SelectItem>
                      <SelectItem value="Physics">Physics</SelectItem>
                      <SelectItem value="Chemistry">Chemistry</SelectItem>
                      <SelectItem value="Biology">Biology</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="semester" className="text-gray-700 dark:text-gray-300">
                    Current Semester
                  </Label>
                  <Select
                    value={signUpData.semester}
                    onValueChange={(value) => setSignUpData({ ...signUpData, semester: value })}
                  >
                    <SelectTrigger className="bg-gray-50 dark:bg-gray-700 border-gray-300 dark:border-gray-600">
                      <SelectValue placeholder="Select your semester" />
                    </SelectTrigger>
                    <SelectContent>
                      {[1, 2, 3, 4, 5, 6, 7, 8].map((sem) => (
                        <SelectItem key={sem} value={sem.toString()}>
                          {sem}
                          {sem === 1 ? "st" : sem === 2 ? "nd" : sem === 3 ? "rd" : "th"} Semester
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </>
            )}

            {/* Step 3: Email & Password */}
            {signUpStep === 3 && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="signup-email" className="text-gray-700 dark:text-gray-300">
                    Email
                  </Label>
                  <Input
                    id="signup-email"
                    type="email"
                    value={signUpData.email}
                    onChange={(e) => setSignUpData({ ...signUpData, email: e.target.value })}
                    placeholder="Enter your email"
                    className="bg-gray-50 dark:bg-gray-700 border-gray-300 dark:border-gray-600"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-password" className="text-gray-700 dark:text-gray-300">
                    Password
                  </Label>
                  <div className="relative">
                    <Input
                      id="signup-password"
                      type={showPassword ? "text" : "password"}
                      value={signUpData.password}
                      onChange={(e) => setSignUpData({ ...signUpData, password: e.target.value })}
                      placeholder="Create a password"
                      className="pr-10 bg-gray-50 dark:bg-gray-700 border-gray-300 dark:border-gray-600"
                      required
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>
              </>
            )}

            {/* Step 4: Bio */}
            {signUpStep === 4 && (
              <div className="space-y-2">
                <Label htmlFor="bio" className="text-gray-700 dark:text-gray-300">
                  Bio
                </Label>
                <Textarea
                  id="bio"
                  value={signUpData.bio}
                  onChange={(e) => setSignUpData({ ...signUpData, bio: e.target.value })}
                  placeholder="Tell others about yourself, your interests, and study goals..."
                  className="min-h-[120px] bg-gray-50 dark:bg-gray-700 border-gray-300 dark:border-gray-600"
                />
                <p className="text-xs text-gray-500 dark:text-gray-400">Optional - you can skip this step</p>
              </div>
            )}

            {/* Step 5: Profile Picture */}
            {signUpStep === 5 && (
              <div className="space-y-4">
                <div className="flex flex-col items-center space-y-4">
                  <Avatar className="w-24 h-24">
                    <AvatarImage
                      src={signUpData.profilePicture ? URL.createObjectURL(signUpData.profilePicture) : undefined}
                    />
                    <AvatarFallback className="text-2xl">
                      {signUpData.firstName[0]}
                      {signUpData.lastName[0]}
                    </AvatarFallback>
                  </Avatar>
                  <div className="text-center">
                    <Label htmlFor="profile-picture" className="cursor-pointer">
                      <Button variant="outline" className="w-full bg-transparent">
                        <Upload className="w-4 h-4 mr-2" />
                        Upload Profile Picture
                      </Button>
                      <input
                        id="profile-picture"
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleFileUpload}
                      />
                    </Label>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">Optional - you can skip this step</p>
                  </div>
                </div>
              </div>
            )}

            {/* Navigation Buttons */}
            <div className="flex justify-between pt-4">
              {signUpStep > 1 && (
                <Button variant="outline" onClick={handleSignUpBack} disabled={loading || authLoading}>
                  Back
                </Button>
              )}
              <div className="ml-auto">
                {signUpStep < 5 ? (
                  <Button 
                    onClick={handleSignUpNext} 
                    className="bg-blue-600 hover:bg-blue-700"
                    disabled={loading || authLoading}
                  >
                    Next
                  </Button>
                ) : (
                  <Button 
                    onClick={handleSignUpComplete} 
                    className="bg-blue-600 hover:bg-blue-700"
                    disabled={loading || authLoading}
                  >
                    {loading || authLoading ? "Creating Account..." : "Complete Sign Up"}
                  </Button>
                )}
              </div>
            </div>

            {signUpStep === 1 && (
              <div className="text-center">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Already have an account?{" "}
                  <button
                    type="button"
                    onClick={() => {
                      setIsSignUpOpen(false)
                      setIsSignInOpen(true)
                      setError("")
                    }}
                    className="text-blue-600 hover:underline font-medium"
                  >
                    Sign in
                  </button>
                </p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
