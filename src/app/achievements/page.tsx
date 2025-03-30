'use client';

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Input } from "@/components/ui/input"
import {
  TreePine,
  Award,
  Target,
  Medal,
  Star,
  Trophy,
  Heart,
  Search,
  Users,
  Leaf,
  Globe,
  type LucideIcon,
  Flower,
  Droplets,
  BookOpen,
  Lightbulb,
  Share2,
  Sparkles,
  CheckCircle2,
  MessageSquare,
  Calendar,
  Clock,
  FileText,
  RefreshCw,
} from "lucide-react"
import { motion } from "framer-motion"
import { useAuth } from "@/contexts/auth-context"
import { Progress } from "@/components/ui/progress"

export default function AchievementsPage() {
  const { user, isAuthenticated } = useAuth()
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("all")
  const [activeTab, setActiveTab] = useState("all")
  const [achievements, setAchievements] = useState<any[]>([])
  const [earnedAchievements, setEarnedAchievements] = useState<any[]>([])
  const [progressAchievements, setProgressAchievements] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [refreshing, setRefreshing] = useState(false)

  const refreshStats = async () => {
    if (!user) return
    
    try {
      setRefreshing(true)
      
      // Get token from localStorage
      const token = localStorage.getItem('token')
      
      // Call the refresh stats endpoint
      const refreshResponse = await fetch(`/api/achievements/refresh-stats`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      
      if (!refreshResponse.ok) {
        const errorText = await refreshResponse.text()
        console.error(`Failed to refresh stats: ${refreshResponse.status} - ${errorText}`)
        throw new Error(`Failed to refresh stats: ${refreshResponse.status} - ${errorText}`)
      }
      
      
      // Refetch achievements to get updated progress
      const userResponse = await fetch(`/api/users/${user.id}/achievements`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (!userResponse.ok) {
        const errorText = await userResponse.text()
        console.error(`Failed to fetch user achievements: ${userResponse.status} - ${errorText}`)
        throw new Error(`Failed to fetch user achievements: ${userResponse.status} - ${errorText}`)
      }

      const userData = await userResponse.json()
      
      // Fetch all achievements (including unearned ones)
      const allResponse = await fetch(`/api/achievements`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      
      let allAchievements: any[] = []
      if (allResponse.ok) {
        const allData = await allResponse.json()
        if (allData.success) {
          allAchievements = allData.achievements || []
        }
      } else {
        console.error(`Failed to fetch all achievements: ${allResponse.status}`)
      }
      
      if (userData.success) {
                
        // Check if descriptions exist
        const hasDescriptions = userData.earned_achievements.some((a: any) => a.description) || 
                               userData.progress.some((a: any) => a.description)

                                        
        // Store original earned achievements for the Recently Earned section
        const validEarnedAchievements = (userData.earned_achievements || []).filter(
          (achievement: any) => achievement && achievement.id && achievement.achievement_id
        );
        const validProgressAchievements = (userData.progress || []).filter(
          (progress: any) => progress && progress.id
        );
        
        setEarnedAchievements(validEarnedAchievements);
        setProgressAchievements(validProgressAchievements);
        
        // Normalize earned achievements to match the structure of allAchievements
        const normalizedEarnedAchievements = validEarnedAchievements.map((achievement: any, index: number) => ({
          id: achievement.achievement_id || achievement.id || `earned-${index}`, // Use achievement_id as the id with fallbacks
          name: achievement.name,
          description: achievement.description,
          criteria: achievement.criteria,
          exp_reward: achievement.exp_reward,
          category: achievement.category,
          icon_name: achievement.icon_name,
          // Preserve earned-specific data
          earned: true,
          earned_at: achievement.earned_at,
          // Store the original user_achievement id if needed for reference
          user_achievement_id: achievement.id
        }));
        
        // Create maps for quick lookups
        const earnedMap = new Map(normalizedEarnedAchievements.map((a: any) => [a.id, a]))
        const progressMap = new Map(userData.progress.map((a: any) => [a.id, a]))
        
        // Create a set of all achievement IDs to avoid duplicates
        const processedIds = new Set<number>()
        const mergedAchievements: any[] = []
        
        // First, add all normalized earned achievements
        normalizedEarnedAchievements.forEach((achievement: any) => {
          if (!processedIds.has(achievement.id)) {
            processedIds.add(achievement.id)
            mergedAchievements.push(achievement)
          }
        })
        
        // Then add all achievements from the all achievements endpoint that aren't already processed
        allAchievements.forEach((achievement: any) => {
          if (!processedIds.has(achievement.id)) {
            processedIds.add(achievement.id)
            // Check if it's in progress
            if (progressMap.has(achievement.id)) {
              // This is an in-progress achievement
              const progressData = progressMap.get(achievement.id) || {};
              mergedAchievements.push({
                ...achievement,
                ...(progressData as object),
                earned: false
              })
            } else {
              // This is an unearned achievement with no progress
              mergedAchievements.push({
                ...achievement,
                earned: false
              })
            }
          }
        })
        
        // Count achievements by category
        const categoryCounts = mergedAchievements.reduce((counts: {[key: string]: number}, achievement) => {
          const category = getAchievementCategory(achievement)
          counts[category] = (counts[category] || 0) + 1
          return counts
        }, {})
                
        // If we couldn't fetch all achievements, fall back to just user achievements
        const finalAchievements = mergedAchievements.length > 0 ? 
          mergedAchievements : 
          [...normalizedEarnedAchievements, ...(userData.progress || [])]
        
        setAchievements(finalAchievements)
      } else {
        throw new Error(userData.error || "Failed to fetch achievements")
      }
    } catch (err) {
      console.error("Error refreshing stats:", err)
      setError(err instanceof Error ? err.message : "An unknown error occurred")
    } finally {
      setRefreshing(false)
    }
  }

  useEffect(() => {
    if (!user) return

    const fetchAchievements = async () => {
      try {
        setLoading(true)
        setError(null)
        
        // Get token from localStorage instead of context
        const token = localStorage.getItem('token')
        
        // Refresh user stats first
        try {
          const refreshResponse = await fetch(`/api/achievements/refresh-stats`, {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${token}`,
            },
          })
          
          if (refreshResponse.ok) {
                      } else {
            console.error('Failed to refresh user stats:', refreshResponse.status)
          }
        } catch (refreshErr) {
          console.error('Error refreshing user stats:', refreshErr)
          // Continue even if refresh fails
        }
        
        // Fetch user's earned achievements and progress
        const userResponse = await fetch(`/api/users/${user.id}/achievements`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })

        if (!userResponse.ok) {
          throw new Error(`Failed to fetch user achievements: ${userResponse.status}`)
        }

        const userData = await userResponse.json()
        
        // Fetch all achievements (including unearned ones)
        const allResponse = await fetch(`/api/achievements`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })
        
        if (!allResponse.ok) {
          console.error(`Failed to fetch all achievements: ${allResponse.status}`)
          // Continue with user achievements even if all achievements fetch fails
        }
        
        let allAchievements: any[] = []
        try {
          const allData = await allResponse.json()
          if (allData.success) {
            allAchievements = allData.achievements || []
                      }
        } catch (allErr) {
          console.error("Error processing all achievements:", allErr)
          // Continue with user achievements even if all achievements processing fails
        }
        
        if (userData.success) {
                    
          // Check if descriptions exist
          const hasDescriptions = userData.earned_achievements.some((a: any) => a.description) || 
                                 userData.progress.some((a: any) => a.description)
                    
                                        
          // Store original earned achievements for the Recently Earned section
          const validEarnedAchievements = (userData.earned_achievements || []).filter(
            (achievement: any) => achievement && achievement.id && achievement.achievement_id
          );
          const validProgressAchievements = (userData.progress || []).filter(
            (progress: any) => progress && progress.id
          );
          
          setEarnedAchievements(validEarnedAchievements);
          setProgressAchievements(validProgressAchievements);
          
          // Normalize earned achievements to match the structure of allAchievements
          const normalizedEarnedAchievements = validEarnedAchievements.map((achievement: any, index: number) => ({
            id: achievement.achievement_id || achievement.id || `earned-${index}`, // Use achievement_id as the id with fallbacks
            name: achievement.name,
            description: achievement.description,
            criteria: achievement.criteria,
            exp_reward: achievement.exp_reward,
            category: achievement.category,
            icon_name: achievement.icon_name,
            // Preserve earned-specific data
            earned: true,
            earned_at: achievement.earned_at,
            // Store the original user_achievement id if needed for reference
            user_achievement_id: achievement.id
          }));
          
          // Create maps for quick lookups
          const earnedMap = new Map(normalizedEarnedAchievements.map((a: any) => [a.id, a]))
          const progressMap = new Map(userData.progress.map((a: any) => [a.id, a]))
          
          // Create a set of all achievement IDs to avoid duplicates
          const processedIds = new Set<number>()
          const mergedAchievements: any[] = []
          
          // First, add all normalized earned achievements
          normalizedEarnedAchievements.forEach((achievement: any) => {
            if (!processedIds.has(achievement.id)) {
              processedIds.add(achievement.id)
              mergedAchievements.push(achievement)
            }
          })
          
          // Then add all achievements from the all achievements endpoint that aren't already processed
          allAchievements.forEach((achievement: any) => {
            if (!processedIds.has(achievement.id)) {
              processedIds.add(achievement.id)
              // Check if it's in progress
              if (progressMap.has(achievement.id)) {
                // This is an in-progress achievement
                const progressData = progressMap.get(achievement.id) || {};
                mergedAchievements.push({
                  ...achievement,
                  ...(progressData as object),
                  earned: false
                })
              } else {
                // This is an unearned achievement with no progress
                mergedAchievements.push({
                  ...achievement,
                  earned: false
                })
              }
            }
          })
          
          
          // Count achievements by category
          const categoryCounts = mergedAchievements.reduce((counts: {[key: string]: number}, achievement) => {
            const category = getAchievementCategory(achievement)
            counts[category] = (counts[category] || 0) + 1
            return counts
          }, {})
                    
          // If we couldn't fetch all achievements, fall back to just user achievements
          const finalAchievements = mergedAchievements.length > 0 ? 
            mergedAchievements : 
            [...normalizedEarnedAchievements, ...(userData.progress || [])]
          
          setAchievements(finalAchievements)
        } else {
          throw new Error(userData.error || "Failed to fetch achievements")
        }
      } catch (err) {
        console.error("Error fetching achievements:", err)
        setError(err instanceof Error ? err.message : "An unknown error occurred")
      } finally {
        setLoading(false)
      }
    }

    fetchAchievements()
  }, [user])

  // Filter achievements based on search, category and tab
  const filteredAchievements = achievements.filter((achievement) => {
    const matchesSearch =
      achievement.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      achievement.description?.toLowerCase().includes(searchQuery.toLowerCase())

    // For category filtering, use the getAchievementCategory function
    const achievementCategory = getAchievementCategory(achievement)
    const matchesCategory = selectedCategory === "all" || achievementCategory === selectedCategory

    // For tab filtering - ensure we're correctly identifying completed vs in-progress
    const isEarned = achievement.earned === true
    
    // Calculate progress to check if it's at 100%
    const progressData = progressAchievements.find(prog => prog.id === achievement.id)
    const progress = isEarned ? 100 : calculateProgress(achievement, progressData)
    const effectivelyEarned = isEarned || progress === 100
    
    const matchesTab = 
      activeTab === "all" || 
      (activeTab === "completed" && effectivelyEarned) || 
      (activeTab === "in-progress" && !effectivelyEarned)

    return matchesSearch && matchesCategory && matchesTab
  })

  // Calculate total stats
  const totalAchievements = achievements.length
  const totalEarned = earnedAchievements.length
  const totalPoints = earnedAchievements.reduce((sum, achievement) => sum + (achievement.exp_reward || 0), 0)

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="mb-4 h-12 w-12 animate-spin rounded-full border-4 border-green-200 border-t-green-700 mx-auto"></div>
          <p className="text-lg text-gray-600">Loading your achievements...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="max-w-md text-center">
          <div className="mb-4 rounded-full bg-red-100 p-3 text-red-600 mx-auto w-fit">
            <Award className="h-8 w-8" />
          </div>
          <h2 className="mb-2 text-2xl font-bold text-gray-900">Failed to load achievements</h2>
          <p className="mb-4 text-gray-600">{error}</p>
          <Button onClick={() => window.location.reload()}>Try Again</Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50/50 via-green-50/20 to-white">
      {/* Hero Section */}
      <section className="relative overflow-hidden py-24">
        {/* Background elements */}
        <div className="absolute inset-0 bg-gradient-to-r from-green-800 to-green-700"></div>
        <div className="absolute inset-0 bg-[url('/images/achievements-bg.jpg')] bg-cover bg-center opacity-10 mix-blend-overlay"></div>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-amber-500/10 via-transparent to-transparent"></div>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_left,_var(--tw-gradient-stops))] from-orange-500/10 via-transparent to-transparent"></div>

        {/* Decorative elements */}
        <div className="absolute -left-20 top-20 h-64 w-64 rounded-full bg-orange-600/20 blur-3xl"></div>
        <div className="absolute -right-20 bottom-20 h-64 w-64 rounded-full bg-amber-600/20 blur-3xl"></div>

        <div className="container relative z-10 px-4">
          <div className="mx-auto max-w-4xl text-center">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
              <Badge className="mb-4 bg-gradient-to-r from-orange-500/30 to-amber-500/30 px-4 py-1.5 text-white backdrop-blur-sm">
                <Sparkles className="mr-2 h-3.5 w-3.5" />
                Achievement Center
              </Badge>
              <h1 className="mb-6 bg-gradient-to-r from-white via-amber-100 to-white bg-clip-text text-4xl font-bold tracking-tight text-transparent sm:text-5xl md:text-6xl">
                Your Green Journey Achievements
              </h1>
              <p className="mx-auto mb-10 max-w-2xl text-lg text-white/80">
                Track your environmental impact, earn badges, and showcase your commitment to making our planet greener.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="flex flex-wrap justify-center gap-4"
            >
              <div className="group flex items-center gap-3 rounded-xl bg-white/10 px-6 py-3 backdrop-blur-sm transition-all hover:bg-white/15">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-orange-500/40 to-orange-600/40 shadow-lg shadow-orange-600/10 transition-transform group-hover:scale-110">
                  <Trophy className="h-6 w-6 text-white" />
                </div>
                <div className="text-left">
                  <div className="text-sm font-medium text-white/70">Total Achievements</div>
                  <div className="text-2xl font-bold text-white">{totalEarned} / {totalAchievements}</div>
                </div>
              </div>

              <div className="group flex items-center gap-3 rounded-xl bg-white/10 px-6 py-3 backdrop-blur-sm transition-all hover:bg-white/15">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-amber-500/40 to-amber-600/40 shadow-lg shadow-amber-600/10 transition-transform group-hover:scale-110">
                  <Star className="h-6 w-6 text-white" />
                </div>
                <div className="text-left">
                  <div className="text-sm font-medium text-white/70">Achievement Points</div>
                  <div className="text-2xl font-bold text-white">{totalPoints} XP</div>
                </div>
              </div>

              <div className="group flex items-center gap-3 rounded-xl bg-white/10 px-6 py-3 backdrop-blur-sm transition-all hover:bg-white/15">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-green-500/40 to-green-600/40 shadow-lg shadow-green-600/10 transition-transform group-hover:scale-110">
                  <Leaf className="h-6 w-6 text-white" />
                </div>
                <div className="text-left">
                  <div className="text-sm font-medium text-white/70">Completion Rate</div>
                  <div className="text-2xl font-bold text-white">
                    {totalAchievements > 0 ? Math.round((totalEarned / totalAchievements) * 100) : 0}%
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>

        {/* Bottom fade */}
        <div className="absolute -bottom-1 left-0 right-0 h-16 bg-gradient-to-b from-transparent to-amber-50/50"></div>
      </section>

      {/* Search and Filter */}
      <section className="sticky top-16 z-10 border-b bg-white/90 py-4 backdrop-blur-md">
        <div className="container px-4">
          <div className="flex flex-wrap items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <Input
                placeholder="Search achievements..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="border-amber-200 pl-10 focus-visible:ring-amber-500"
              />
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                variant={selectedCategory === "all" ? "default" : "outline"}
                onClick={() => setSelectedCategory("all")}
                className={
                  selectedCategory === "all"
                    ? "bg-gradient-to-r from-green-700 to-green-800 text-white hover:from-green-800 hover:to-green-900"
                    : "border-green-200 text-green-700 hover:bg-green-50 hover:text-green-800"
                }
              >
                All
              </Button>
              <Button
                variant={selectedCategory === "environmental" ? "default" : "outline"}
                onClick={() => setSelectedCategory("environmental")}
                className={
                  selectedCategory === "environmental"
                    ? "bg-gradient-to-r from-green-700 to-green-800 text-white hover:from-green-800 hover:to-green-900"
                    : "border-green-200 text-green-700 hover:bg-green-50 hover:text-green-800"
                }
              >
                <TreePine className="mr-2 h-4 w-4" />
                Environmental
              </Button>
              <Button
                variant={selectedCategory === "community" ? "default" : "outline"}
                onClick={() => setSelectedCategory("community")}
                className={
                  selectedCategory === "community"
                    ? "bg-gradient-to-r from-orange-600 to-orange-700 text-white hover:from-orange-700 hover:to-orange-800"
                    : "border-orange-200 text-orange-700 hover:bg-orange-50 hover:text-orange-800"
                }
              >
                <Users className="mr-2 h-4 w-4" />
                Community
              </Button>
              <Button
                variant={selectedCategory === "learning" ? "default" : "outline"}
                onClick={() => setSelectedCategory("learning")}
                className={
                  selectedCategory === "learning"
                    ? "bg-gradient-to-r from-amber-600 to-amber-700 text-white hover:from-amber-700 hover:to-amber-800"
                    : "border-amber-200 text-amber-700 hover:bg-amber-50 hover:text-amber-800"
                }
              >
                <BookOpen className="mr-2 h-4 w-4" />
                Learning
              </Button>
              <Button
                variant={selectedCategory === "engagement" ? "default" : "outline"}
                onClick={() => setSelectedCategory("engagement")}
                className={
                  selectedCategory === "engagement"
                    ? "bg-gradient-to-r from-blue-600 to-blue-700 text-white hover:from-blue-700 hover:to-blue-800"
                    : "border-blue-200 text-blue-700 hover:bg-blue-50 hover:text-blue-800"
                }
              >
                <Clock className="mr-2 h-4 w-4" />
                Engagement
              </Button>
              <Button
                variant="outline"
                onClick={refreshStats}
                disabled={refreshing}
                className="border-green-200 text-green-700 hover:bg-green-50 hover:text-green-800"
              >
                {refreshing ? (
                  <>
                    <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-green-700 border-t-transparent"></div>
                    Refreshing...
                  </>
                ) : (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Refresh Stats
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <section className="container px-4 py-12">
        <div className="mb-8 flex flex-col items-center justify-between gap-4 sm:flex-row">
          <h2 className="text-2xl font-bold text-gray-900">
            {selectedCategory === "all"
              ? "All Achievements"
              : `${selectedCategory.charAt(0).toUpperCase() + selectedCategory.slice(1)} Achievements`}
          </h2>
          <Tabs defaultValue="all" className="w-full max-w-md" onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-3 bg-amber-100/50 p-1">
              <TabsTrigger
                value="all"
                className="data-[state=active]:bg-white data-[state=active]:text-green-700 data-[state=active]:shadow-sm"
              >
                All
              </TabsTrigger>
              <TabsTrigger
                value="completed"
                className="data-[state=active]:bg-white data-[state=active]:text-green-700 data-[state=active]:shadow-sm"
              >
                Earned
              </TabsTrigger>
              <TabsTrigger
                value="in-progress"
                className="data-[state=active]:bg-white data-[state=active]:text-green-700 data-[state=active]:shadow-sm"
              >
                In Progress
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {/* Achievement Grid */}

        {filteredAchievements.length > 0 ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {filteredAchievements.map((achievement) => (
              <AchievementCard 
                key={achievement.id} 
                achievement={achievement} 
                isEarned={achievement.earned === true}
                progressData={progressAchievements.find(prog => prog.id === achievement.id)}
              />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-12">
            <div className="mb-4 rounded-full bg-amber-100 p-4 text-amber-600">
              <Award className="h-10 w-10" />
            </div>
            <h3 className="mb-2 text-xl font-semibold text-gray-900">No achievements found</h3>
            <p className="text-gray-600">
              {searchQuery
                ? "Try adjusting your search or filters"
                : activeTab === "completed"
                ? "You haven't earned any achievements yet. Keep going!"
                : "No achievements available in this category"}
            </p>
          </div>
        )}

        {/* Recently Earned */}
        {earnedAchievements.length > 0 && (
          <div className="mt-20">
            <div className="mb-8 flex items-center">
              <div className="mr-4 h-px flex-1 bg-gradient-to-r from-transparent to-amber-200"></div>
              <h2 className="text-2xl font-bold text-gray-900">Recently Earned</h2>
              <div className="ml-4 h-px flex-1 bg-gradient-to-l from-transparent to-amber-200"></div>
            </div>

            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {earnedAchievements
                .slice(0, 4)
                .map((achievement, index) => (
                <Card
                  key={`recent-${achievement.user_achievement_id || achievement.id || index}`}
                  className="group overflow-hidden border-0 bg-white shadow-md transition-all hover:shadow-lg"
                >
                  <div className="h-1.5 w-full bg-gradient-to-r from-amber-400 to-amber-500"></div>
                  <CardContent className="p-6">
                    <div className="mb-4 flex items-center gap-3">
                      <div
                        className={`flex h-12 w-12 items-center justify-center rounded-full ${getCategoryGradient(getAchievementCategory(achievement))} text-white shadow-lg ${getCategoryShadow(getAchievementCategory(achievement))}`}
                      >
                        {getAchievementIcon(achievement)}
                      </div>
                      <h3 className="font-semibold text-gray-900">{achievement.name}</h3>
                    </div>
                    
                    {/* Try different ways to access description */}
                    {achievement.description && (
                      <p className="mb-4 text-sm text-gray-600">
                        {achievement.description}
                      </p>
                    )}
                    
                    {/* Fallback if description is missing */}
                    {!achievement.description && (
                      <p className="mb-4 text-sm text-gray-600">
                        {achievement.name ? `You earned the "${achievement.name}" achievement!` : "You earned this achievement!"}
                      </p>
                    )}
                    
                    <div className="flex items-center justify-between">
                      <Badge className="bg-gradient-to-r from-orange-500 to-orange-600 text-white">
                        <Award className="mr-1 h-3 w-3" />
                        {achievement.exp_reward} XP
                      </Badge>
                      <span className="text-xs text-gray-500">
                        {formatDate(achievement.earned_at)}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}
      </section>
    </div>
  )
}

// Helper function to get category based on achievement data
function getAchievementCategory(achievement: any): string {
  // First, check if the achievement has a category field from the database
  if (achievement.category) {
    // Map database categories to frontend categories
    const categoryMap: {[key: string]: string} = {
      'environmental_action': 'environmental',
      'community_engagement': 'community',
      'knowledge_learning': 'learning',
      'platform_engagement': 'engagement'
    };
    
    // If the category is in our map, return the mapped frontend category
    if (achievement.category in categoryMap) {
      return categoryMap[achievement.category];
    }
  }
  
  // If no category, fall back to criteria type
  try {
    const criteria = typeof achievement.criteria === 'string' 
      ? JSON.parse(achievement.criteria) 
      : achievement.criteria || {};
    
    if (criteria.type) {
      // Engagement related criteria types
      if (['login_count', 'login_streak', 'account_age'].includes(criteria.type)) {
        return "engagement";
      }
      
      // Learning related criteria types
      if (['blog_reads', 'blog_comments', 'blog_posts', 'learning_completed', 'materials_read'].includes(criteria.type)) {
        return "learning";
      }
      
      // Community related criteria types
      if (['forum_discussions', 'forum_replies', 'forum_posts', 'events_created', 'events_joined', 
           'groups_created', 'group_members', 'challenges_completed'].includes(criteria.type)) {
        return "community";
      }
      
      // Environmental related criteria types
      if (['trees_planted', 'volunteer_hours', 'co2_offset'].includes(criteria.type)) {
        return "environmental";
      }
    }
  } catch (error) {
    console.error("Error parsing achievement criteria:", error);
  }
  
  return "environmental";
}

// Helper function to get category gradient
function getCategoryGradient(category: string) {
  switch (category) {
    case "environmental":
      return "bg-gradient-to-br from-green-600 to-green-800"
    case "community":
      return "bg-gradient-to-br from-orange-500 to-orange-700"
    case "learning":
      return "bg-gradient-to-br from-amber-500 to-amber-700"
    case "engagement":
      return "bg-gradient-to-br from-blue-500 to-blue-700"
    default:
      return "bg-gradient-to-br from-green-600 to-green-800"
  }
}

// Helper function to get category shadow
function getCategoryShadow(category: string) {
  switch (category) {
    case "environmental":
      return "shadow-green-700/20"
    case "community":
      return "shadow-orange-600/20"
    case "learning":
      return "shadow-amber-600/20"
    case "engagement":
      return "shadow-blue-600/20"
    default:
      return "shadow-green-700/20"
  }
}

// Helper function to get icon based on achievement
function getAchievementIcon(achievement: any) {
  const category = getAchievementCategory(achievement)
  const name = achievement.name?.toLowerCase() || ""
  
  if (category === "environmental") {
    if (name.includes("tree") || name.includes("plant")) {
      return <TreePine className="h-6 w-6" />
    } else {
      return <Leaf className="h-6 w-6" />
    }
  } else if (category === "community") {
    if (name.includes("forum")) {
      return <MessageSquare className="h-6 w-6" />
    } else {
      return <Users className="h-6 w-6" />
    }
  } else if (category === "learning") {
    if (name.includes("blog")) {
      return <FileText className="h-6 w-6" />
    } else {
      return <BookOpen className="h-6 w-6" />
    }
  } else if (category === "engagement") {
    if (name.includes("login") || name.includes("streak")) {
      return <Clock className="h-6 w-6" />
    } else if (name.includes("veteran")) {
      return <Award className="h-6 w-6" />
    } else {
      return <Calendar className="h-6 w-6" />
    }
  }
  
  // Default icon based on category
  switch (category) {
    case "environmental":
      return <TreePine className="h-6 w-6" />
    case "community":
      return <Users className="h-6 w-6" />
    case "learning":
      return <BookOpen className="h-6 w-6" />
    case "engagement":
      return <Clock className="h-6 w-6" />
    default:
      return <Award className="h-6 w-6" />
  }
}

// Format date helper
function formatDate(dateString: string) {
  if (!dateString) return "Recently"
  
  const date = new Date(dateString)
  const now = new Date()
  const diffTime = Math.abs(now.getTime() - date.getTime())
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24))
  
  if (diffDays === 0) {
    return "Today"
  } else if (diffDays === 1) {
    return "Yesterday"
  } else if (diffDays < 7) {
    return `${diffDays} days ago`
  } else if (diffDays < 30) {
    const weeks = Math.floor(diffDays / 7)
    return `${weeks} ${weeks === 1 ? 'week' : 'weeks'} ago`
  } else {
    return date.toLocaleDateString()
  }
}

// Calculate progress percentage for an achievement
function calculateProgress(achievement: any, progressData: any) {
  if (!progressData) return 0
  
  try {
    // Handle achievements without criteria (like "Community Starter")
    if (!achievement.criteria) {
      // For achievements like "Community Starter" that require creating a group
      if (achievement.name === "Community Starter" && progressData.groups_created !== undefined) {
        return progressData.groups_created > 0 ? 100 : 0
      }
      // Default to 0 progress for other achievements without criteria
      return 0
    }
    
    const criteria = typeof achievement.criteria === 'string' 
      ? JSON.parse(achievement.criteria) 
      : achievement.criteria || {}
    
    // Only handle standardized format with 'type' and 'count' fields
    if (criteria.type) {
      const type = criteria.type
      let requiredCount = criteria.count
      
      // Handle different field names for required count
      if (type === 'account_age' && criteria.months) {
        requiredCount = criteria.months
      } else if (type === 'login_streak' && criteria.days) {
        requiredCount = criteria.days
      }
      
      // Get the current value directly from the progress data using the type as the property name
      const currentValue = progressData[type]
      
      // If the value is undefined, return 0 progress
      if (currentValue === undefined) {
        console.warn(`Property ${type} not found in progress data for achievement ${achievement.name}`)
        return 0
      }
      
      // Calculate the progress percentage
      return Math.min(100, Math.round((currentValue / requiredCount) * 100))
    } else {
      console.warn('Achievement criteria does not use standardized format with type and count:', achievement.name)
      return 0
    }
  } catch (error) {
    console.error("Error calculating progress:", error, achievement)
    return 0
  }
}

function AchievementCard({ achievement, isEarned, progressData }: { 
  achievement: any, 
  isEarned: boolean,
  progressData: any
}) {
  const category = getAchievementCategory(achievement)
  
  // Calculate progress using the updated calculateProgress function
  const progress = isEarned ? 100 : calculateProgress(achievement, progressData)
  
  // Consider an achievement earned if it has 100% progress, even if the earned flag isn't set
  const effectivelyEarned = isEarned || progress === 100

  return (
    <Card className="group overflow-hidden border-0 bg-white shadow-md transition-all hover:shadow-lg">
      <div className={`h-1.5 w-full ${getCategoryGradient(category)}`} />
      <CardContent className="p-6">
        <div className="mb-6 flex items-center gap-4">
          <div
            className={`flex h-14 w-14 items-center justify-center rounded-full ${getCategoryGradient(category)} text-white shadow-lg ${getCategoryShadow(category)} transition-transform group-hover:scale-110`}
          >
            {getAchievementIcon(achievement)}
          </div>
          <h3 className="text-lg font-semibold text-gray-900">{achievement.name}</h3>
        </div>
        
        {/* Try different ways to access description */}
        {achievement.description && (
          <p className="mb-6 text-sm text-gray-600">
            {achievement.description}
          </p>
        )}
        
        {/* Fallback if description is missing */}
        {!achievement.description && (
          <p className="mb-6 text-sm text-gray-600">
            {achievement.name ? `Complete the "${achievement.name}" achievement to earn XP.` : "Complete this achievement to earn XP."}
          </p>
        )}

        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="font-medium text-gray-700">Progress</span>
            <span className={`font-medium ${effectivelyEarned ? "text-green-700" : "text-amber-600"}`}>
              {progress}%
            </span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-gray-100">
            <div
              className={`h-full ${
                effectivelyEarned
                  ? getCategoryGradient(category)
                  : category === "environmental"
                    ? "bg-gradient-to-r from-green-500/60 to-green-600/60"
                    : category === "community"
                      ? "bg-gradient-to-r from-orange-400/60 to-orange-500/60"
                      : "bg-gradient-to-r from-amber-400/60 to-amber-500/60"
              }`}
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        <div className="mt-4 flex items-center justify-between">
          <Badge variant="outline" className="border-amber-200 text-amber-700">
            <span className="font-medium">XP</span> {achievement.exp_reward}
          </Badge>
          {effectivelyEarned ? (
            <Badge className={`${getCategoryGradient(category)} text-white`}>
              <CheckCircle2 className="mr-1 h-3 w-3" />
              Earned
            </Badge>
          ) : (
            <Badge variant="outline" className="border-orange-200 text-orange-700">
              <Clock className="mr-1 h-3 w-3" />
              In Progress
            </Badge>
          )}
        </div>
      </CardContent>
    </Card>
  )
} 
