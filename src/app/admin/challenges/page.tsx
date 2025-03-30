"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import { ModerationDashboard } from "@/components/challenges/ModerationDashboard"

export default function AdminChallengesPage() {
  const { user } = useAuth()
  const router = useRouter()

  useEffect(() => {
    // Handle both old 'role' field and new 'roles' array for backward compatibility
    const hasModeratorAccess = user?.roles?.includes('admin') || 
                              user?.roles?.includes('moderator') || 
                              (user as any)?.role === 'admin' || 
                              (user as any)?.role === 'moderator'
    
    // Redirect if user is not admin or moderator
    if (!hasModeratorAccess) {
      router.push('/challenges')
    }
  }, [user, router])

  // Handle both old 'role' field and new 'roles' array for backward compatibility
  const hasModeratorAccess = user?.roles?.includes('admin') || 
                            user?.roles?.includes('moderator') || 
                            (user as any)?.role === 'admin' || 
                            (user as any)?.role === 'moderator'
  
  if (!hasModeratorAccess) {
    return null
  }

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-2xl font-bold mb-6">Review Challenge Submissions</h1>
      <ModerationDashboard />
    </div>
  )
} 