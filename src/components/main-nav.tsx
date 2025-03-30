"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel
} from "@/components/ui/dropdown-menu"
import { TreePine, Menu, X, ChevronDown, User, LogOut, Trophy, Home, Calendar, BookOpen, GraduationCap, Users, ShieldCheck, UsersRound, MessageSquare } from "lucide-react"
import { useEffect, useState } from "react"
import { NotificationDropdown } from "@/components/notifications/NotificationDropdown"
import { useAuth } from '@/contexts/auth-context'
import { cn } from "@/lib/utils"

interface UserData {
  id: number;
  username: string;
  email: string;
  roles: string[];
}

export function MainNav() {
  const [isOpen, setIsOpen] = React.useState(false)
  const pathname = usePathname()
  const router = useRouter()
  const { user, logout, isAuthenticated } = useAuth()

  const mainRoutes = [
    {
      href: "/",
      label: "Home",
      icon: <Home className="h-4 w-4 mr-2" />,
    },
    {
      href: "/about",
      label: "About Us",
      icon: <Users className="h-4 w-4 mr-2" />,
    },
    {
      href: "/events",
      label: "Events",
      icon: <Calendar className="h-4 w-4 mr-2" />,
    },
    {
      href: "/blog",
      label: "Blog",
      icon: <BookOpen className="h-4 w-4 mr-2" />,
    },
    {
      href: "/forum",
      label: "Forum",
      icon: <MessageSquare className="h-4 w-4 mr-2" />,
    },
    {
      href: "/challenges",
      label: "Challenges",
      icon: <Trophy className="h-4 w-4 mr-2" />,
    },
    {
      href: "/learning",
      label: "Learn",
      icon: <GraduationCap className="h-4 w-4 mr-2" />,
    },
    {
      href: "/groups",
      label: "Groups",
      icon: <UsersRound className="h-4 w-4 mr-2" />,
    },
  ]

  const userRoutes = [
    {
      href: "/profile",
      label: "Profile",
      icon: <User className="h-4 w-4 mr-2" />,
    },
    {
      href: "/achievements",
      label: "Achievements",
      icon: <Trophy className="h-4 w-4 mr-2" />,
    },
  ]

  const adminRoutes = user?.roles?.includes('admin') ? [
    {
      href: "/admin/challenges",
      label: "Review Challenges",
      icon: <ShieldCheck className="h-4 w-4 mr-2" />,
    }
  ] : []

  return (
    <header className="sticky top-0 z-50 w-full border-b border-[#d1e0d3] bg-[#f8f9f3]/80 backdrop-blur-sm">
      <div className="container flex h-16 items-center px-4">
        <Link href="/" className="flex items-center space-x-2">
          <TreePine className="h-6 w-6 text-[#2c5530]" />
          <span className="text-xl font-bold text-[#2c5530]">Green Buddy</span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="ml-auto flex items-center space-x-4">
          {/* Navigation Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="flex items-center space-x-1 text-[#3a6b3e] hover:text-[#2c5530] hover:bg-[#f0f4e9] border border-transparent hover:border-[#d1e0d3]">
                <span>Navigation</span>
                <ChevronDown className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48 border-[#d1e0d3] bg-[#f8f9f3]">
              <DropdownMenuLabel className="text-[#2c5530]">Main Navigation</DropdownMenuLabel>
              {mainRoutes.map((route) => (
                <DropdownMenuItem key={route.href} asChild>
                  <Link
                    href={route.href}
                    className={`flex items-center w-full ${
                      pathname === route.href ? 'text-[#2c5530] font-medium' : 'text-[#5a7d61] hover:text-[#3a6b3e]'
                    }`}
                  >
                    {route.icon}
                    {route.label}
                  </Link>
                </DropdownMenuItem>
              ))}
              {user && (
                <>
                  <DropdownMenuSeparator className="bg-[#d1e0d3]" />
                  <DropdownMenuLabel className="text-[#2c5530]">User Menu</DropdownMenuLabel>
                  {userRoutes.map((route) => (
                    <DropdownMenuItem key={route.href} asChild>
                      <Link
                        href={route.href}
                        className={`flex items-center w-full ${
                          pathname === route.href ? 'text-[#2c5530] font-medium' : 'text-[#5a7d61] hover:text-[#3a6b3e]'
                        }`}
                      >
                        {route.icon}
                        {route.label}
                      </Link>
                    </DropdownMenuItem>
                  ))}
                  {adminRoutes.length > 0 && (
                    <>
                      <DropdownMenuSeparator className="bg-[#d1e0d3]" />
                      <DropdownMenuLabel className="text-[#2c5530]">Admin Menu</DropdownMenuLabel>
                      {adminRoutes.map((route) => (
                        <DropdownMenuItem key={route.href} asChild>
                          <Link
                            href={route.href}
                            className={`flex items-center w-full ${
                              pathname === route.href ? 'text-[#2c5530] font-medium' : 'text-[#5a7d61] hover:text-[#3a6b3e]'
                            }`}
                          >
                            {route.icon}
                            {route.label}
                          </Link>
                        </DropdownMenuItem>
                      ))}
                    </>
                  )}
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* User Menu */}
          {user ? (
            <div className="flex items-center space-x-4">
              <NotificationDropdown />
              <Link
                href="/profile"
                className={`text-sm font-medium transition-colors hover:text-[#2c5530] ${
                  pathname === '/profile' ? 'text-[#2c5530]' : 'text-[#5a7d61]'
                }`}
              >
                {user.username}
              </Link>
              <Button variant="ghost" size="icon" className="text-[#5a7d61] hover:text-[#2c5530] hover:bg-[#f0f4e9] border border-transparent hover:border-[#d1e0d3]" onClick={logout}>
                <LogOut className="h-5 w-5" />
              </Button>
            </div>
          ) : (
            <div className="flex items-center space-x-4">
              <Link href="/auth/login">
                <Button variant="ghost" className="text-[#3a6b3e] hover:text-[#2c5530] hover:bg-[#f0f4e9] border border-transparent hover:border-[#d1e0d3]">Sign In</Button>
              </Link>
              <Link href="/auth/register">
                <Button className="bg-[#e76f51] hover:bg-[#e25b3a] text-white border-none">Sign Up</Button>
              </Link>
            </div>
          )}
        </nav>

        {/* Mobile Navigation */}
        <div className="flex md:hidden ml-auto">
          <Button
            variant="ghost"
            className="h-10 w-10 p-0 text-[#3a6b3e] hover:bg-[#f0f4e9] border border-transparent hover:border-[#d1e0d3]"
            onClick={() => setIsOpen(!isOpen)}
          >
            {isOpen ? (
              <X className="h-6 w-6" />
            ) : (
              <Menu className="h-6 w-6" />
            )}
          </Button>
        </div>
      </div>

      {/* Mobile Menu */}
      {isOpen && (
        <div className="md:hidden bg-[#f8f9f3]">
          <div className="space-y-4 px-4 pb-4">
            {mainRoutes.map((route) => (
              <Link
                key={route.href}
                href={route.href}
                className={`flex items-center py-2 ${
                  pathname === route.href ? 'text-[#2c5530] font-medium' : 'text-[#5a7d61] hover:text-[#3a6b3e]'
                }`}
                onClick={() => setIsOpen(false)}
              >
                {route.icon}
                {route.label}
              </Link>
            ))}
            {user && (
              <>
                <div className="h-px bg-[#d1e0d3]" />
                {userRoutes.map((route) => (
                  <Link
                    key={route.href}
                    href={route.href}
                    className={`flex items-center py-2 ${
                      pathname === route.href ? 'text-[#2c5530] font-medium' : 'text-[#5a7d61] hover:text-[#3a6b3e]'
                    }`}
                    onClick={() => setIsOpen(false)}
                  >
                    {route.icon}
                    {route.label}
                  </Link>
                ))}
                {adminRoutes.map((route) => (
                  <Link
                    key={route.href}
                    href={route.href}
                    className={`flex items-center py-2 ${
                      pathname === route.href ? 'text-[#2c5530] font-medium' : 'text-[#5a7d61] hover:text-[#3a6b3e]'
                    }`}
                    onClick={() => setIsOpen(false)}
                  >
                    {route.icon}
                    {route.label}
                  </Link>
                ))}
              </>
            )}
          </div>
        </div>
      )}
    </header>
  )
}

