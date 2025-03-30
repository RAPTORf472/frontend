"use client"

import type React from "react"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { formatDistance, format } from "date-fns"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetFooter,
  SheetClose,
} from "@/components/ui/sheet"
import {
  TreePine,
  Award,
  Target,
  Medal,
  Star,
  Trophy,
  Sprout,
  Heart,
  Edit,
  MapPin,
  Calendar,
  Users,
  Leaf,
  MessageSquare,
  UserPlus,
  Activity,
  Clock,
  Flame,
  Zap,
  ArrowRight,
  User,
  X,
  UserMinus,
  LayoutGrid,
  List,
  MoreHorizontal,
  Share2,
  Download,
  Search,
  Settings,
  Camera,
  Sparkles,
  FileText,
  Globe,
  Briefcase,
  Layers,
  BookOpen,
  Copy,
  Twitter,
  Facebook,
  Mail,
} from "lucide-react"
import Link from "next/link"
import { motion, AnimatePresence } from "framer-motion"
import { Spinner } from "@/components/ui/spinner"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

interface Group {
  id: number
  name: string
  image_url?: string
  role?: string
}

interface Achievement {
  id: number
  name: string
  description: string
  icon_name: string
  exp_reward: number
  criteria?: any
  earned_at: string
  category?: string
}

interface UserActivity {
  id: number
  user_id: number
  activity_type:
    | "challenge_completed"
    | "events_joined"
    | "events_created"
    | "tree_planted"
    | "group_created"
    | "forum_post"
    | "forum_reply"
    | "learning_completed"
    | "achievement_earned"
    | "forum_likes"
    | "group_member_added"
    | "group_member_removed"
    | "events_unregistered"
    | "materials_read"
  activity_data: {
    name?: string
    exp_reward?: number
    achievement_id?: number
    event_id?: number
    event_title?: string
    challenge_id?: number
    challenge_name?: string
    [key: string]: any
  }
  created_at: string
}

interface UserProfile {
  success: boolean
  user: {
    id: number
    username: string
    email: string
    exp: number
    level: number
    created_at: string
    last_login: string
    bio?: string
    location?: string
    website?: string
    occupation?: string
    avatar_url?: string
  }
  stats: {
    trees_planted: number
    events_joined: number
    co2_offset: number
    events_created?: number
    volunteer_hours?: number
    followers_count?: number
    following_count?: number
    forum_posts?: number
    achievements_earned?: number
  }
  group: Group | null
  is_following: boolean
  chatGroups: {
    id: number
    name: string
    description: string
    joined_at: string
  }[]
  achievements?: Achievement[]
  activities?: UserActivity[]
}

// Animation variants
const fadeIn = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { duration: 0.6 },
  },
}

const slideUp = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      type: "spring",
      stiffness: 100,
      damping: 15,
    },
  },
}

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
}

export default function UserProfilePage({ params }: { params: { id: string } }) {
  const { user, isLoading: isAuthLoading } = useAuth()
  const router = useRouter()
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isFollowing, setIsFollowing] = useState(false)
  const [selectedAchievement, setSelectedAchievement] = useState<Achievement | null>(null)
  const [viewMode, setViewMode] = useState<"list" | "grid">("grid")
  const [activeFilter, setActiveFilter] = useState<string>("all")
  const [searchQuery, setSearchQuery] = useState<string>("")
  const [activeTab, setActiveTab] = useState("overview")
  const [showShareDialog, setShowShareDialog] = useState(false)

  const fetchUserAchievements = useCallback(async (userId: number) => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`/api/users/${userId}/achievements`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      
      if (!response.ok) {
        return []
      }
      
      const data = await response.json()
      return data.success ? data.earned_achievements : []
    } catch (error) {
      console.error('Error fetching achievements:', error)
      return []
    }
  }, [])

  const fetchUserActivities = useCallback(async (userId: number) => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`/api/users/${userId}/activities?limit=10`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      
      if (!response.ok) {
        return []
      }
      
      const data = await response.json()
      return data.success ? data.activities : []
    } catch (error) {
      console.error('Error fetching activities:', error)
      return []
    }
  }, [])

  const fetchFollowingStatus = useCallback(async (profileUserId: number) => {
    try {
      const token = localStorage.getItem('token')
      if (!token) return false
      
      const response = await fetch('/api/users/following', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      
      if (!response.ok) return false
      
      const data = await response.json()
      
      if (!data.success || !Array.isArray(data.following)) return false
            // Check if the profile user is in the following list
      return data.following.some((followedUser: any) => 
        followedUser.followed_id === profileUserId
      )
    } catch (error) {
      console.error('Error checking following status:', error)
      return false
    }
  }, [])

  useEffect(() => {
    const fetchProfile = async () => {
      setIsLoading(true)
      setError(null)
      
      try {
        const token = localStorage.getItem('token')
        const response = await fetch(`/api/users/${params.id}/profile`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        })
        
        if (!response.ok) {
          throw new Error("Failed to fetch user profile")
        }
        
        const data = await response.json()
        if (!data.success) {
          throw new Error(data.error || "Failed to fetch user profile")
        }
        
        // Calculate level from exp if not provided
        if (!data.user.level && data.user.exp) {
          data.user.level = Math.floor(data.user.exp / 100) + 1
        }
        
        setProfile(data)
        
        // Fetch following status directly from following API
        const isUserFollowed = await fetchFollowingStatus(data.user.id)
        
        setIsFollowing(isUserFollowed)

        // Fetch additional user data
        if (data.user.id) {
          const achievements = await fetchUserAchievements(data.user.id)
          const activities = await fetchUserActivities(data.user.id)
          
          setProfile(prev => {
            if (!prev) return null
            return {
              ...prev,
              achievements,
              activities
            }
          })
        }
      } catch (error) {
        console.error('Error fetching user profile:', error)
        setError(error instanceof Error ? error.message : "An unknown error occurred")
      } finally {
        setIsLoading(false)
      }
    }

    if (!isAuthLoading) {
      fetchProfile()
    }
  }, [params.id, isAuthLoading, fetchUserAchievements, fetchUserActivities, fetchFollowingStatus])

  const handleFollow = async () => {
    if (!user || !profile) return
    
    try {
      const method = isFollowing ? 'DELETE' : 'POST'
      const token = localStorage.getItem('token')
      const response = await fetch(`/api/users/${profile.user.id}/follow`, {
        method: method,
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      
      if (!response.ok) {
        throw new Error(`Failed to ${isFollowing ? 'unfollow' : 'follow'} user`)
      }
      
      const data = await response.json()
      if (data.success) {
        setIsFollowing(!isFollowing)
        
        // Update stats
        setProfile(prev => {
          if (!prev) return null
          
          const followerDelta = isFollowing ? -1 : 1
          return {
            ...prev,
            stats: {
              ...prev.stats,
              followers_count: (prev.stats.followers_count || 0) + followerDelta
            }
          }
        })
      }
    } catch (error) {
      console.error('Error following/unfollowing user:', error)
    }
  }

  const getActivityIcon = (type: string): JSX.Element => {
    switch (type) {
      case "challenge_completed":
        return <Target className="h-5 w-5 text-emerald-500" />
      case "events_joined":
        return <Calendar className="h-5 w-5 text-blue-500" />
      case "events_created":
        return <Calendar className="h-5 w-5 text-purple-500" />
      case "tree_planted":
        return <TreePine className="h-5 w-5 text-green-600" />
      case "group_created":
        return <Users className="h-5 w-5 text-indigo-500" />
      case "forum_post":
        return <FileText className="h-5 w-5 text-amber-500" />
      case "forum_reply":
        return <MessageSquare className="h-5 w-5 text-cyan-500" />
      case "learning_completed":
        return <BookOpen className="h-5 w-5 text-red-500" />
      case "achievement_earned":
        return <Award className="h-5 w-5 text-yellow-500" />
      case "forum_likes":
        return <Heart className="h-5 w-5 text-rose-500" />
      case "group_member_added":
        return <UserPlus className="h-5 w-5 text-teal-500" />
      case "group_member_removed":
        return <UserMinus className="h-5 w-5 text-red-500" />
      default:
        return <Activity className="h-5 w-5 text-gray-500" />
    }
  }

  const getAchievementIcon = (iconName: string): JSX.Element => {
    // Convert icon name from CamelCase or kebab-case to JSX component
    const icons: Record<string, JSX.Element> = {
      "TreePine": <TreePine className="h-5 w-5" />,
      "Medal": <Medal className="h-5 w-5" />,
      "Leaf": <Leaf className="h-5 w-5" />,
      "Award": <Award className="h-5 w-5" />,
      "Star": <Star className="h-5 w-5" />,
      "Sprout": <Sprout className="h-5 w-5" />,
      "Zap": <Zap className="h-5 w-5" />,
      "Trophy": <Trophy className="h-5 w-5" />,
      "Heart": <Heart className="h-5 w-5" />,
    }
    return icons[iconName] || <Award className="h-5 w-5" />
  }

  const formatDateTime = (dateString: string): string => {
    try {
      return format(new Date(dateString), 'MMM d, yyyy')
    } catch (error) {
      return "Unknown date"
    }
  }

  const formatRelativeTime = (dateString: string): string => {
    try {
      return formatDistance(new Date(dateString), new Date(), { addSuffix: true })
    } catch (error) {
      return "Unknown time"
    }
  }

  const handleShare = () => {
    setShowShareDialog(true)
  }

  const copyProfileLink = () => {
    navigator.clipboard.writeText(window.location.href)
      .then(() => {
        // Show success notification
        console.log('Profile link copied to clipboard')
      })
      .catch(err => {
        console.error('Failed to copy profile link:', err)
      })
  }

  // Loading state
  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Spinner size="lg" className="text-[#2c5530]" />
      </div>
    )
  }

  // Error state
  if (error || !profile) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card className="mx-auto max-w-2xl">
          <CardHeader>
            <CardTitle className="text-2xl text-red-600">Error</CardTitle>
          </CardHeader>
          <CardContent>
            <p>{error || "Failed to load user profile. Please try again later."}</p>
            <Button 
              onClick={() => router.push('/profile')} 
              className="mt-4 bg-[#2c5530] hover:bg-[#1a3a1f]"
            >
              Go to Your Profile
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Calculate progress to next level
  const expToNextLevel = 100 // Assuming 100 exp per level
  const currentLevelExp = profile.user.exp % expToNextLevel
  const progressPercent = (currentLevelExp / expToNextLevel) * 100

  // Filter achievements by category if needed
  const filteredAchievements = profile.achievements?.filter(achievement => {
    if (activeFilter !== "all" && achievement.category !== activeFilter) {
      return false
    }
    
    if (searchQuery) {
      return achievement.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        achievement.description.toLowerCase().includes(searchQuery.toLowerCase())
    }
    
    return true
  }) || []

  return (
    <div className="min-h-screen bg-[#f8f9f3]">
      {/* Hero Section with User Profile */}
      <div className="bg-gradient-to-b from-[#2c5530] to-[#1a3a1f] pb-16 pt-12">
        <div className="container mx-auto px-4">
          <motion.div 
            variants={fadeIn}
            initial="hidden"
            animate="visible"
          >
            <div className="relative mx-auto max-w-4xl rounded-xl bg-white p-6 shadow-lg">
              <div className="flex flex-col md:flex-row md:items-center md:gap-8">
                {/* Avatar */}
                <div className="mx-auto mb-5 md:mb-0 md:mx-0">
                  <Avatar className="h-28 w-28 border-4 border-[#e8f2e8]">
                    <AvatarImage
                      src={profile.user.avatar_url || "/avatars/default.png"}
                      alt={profile.user.username}
                      className="object-cover"
                    />
                    <AvatarFallback className="bg-[#2c5530] text-3xl text-white">
                      {profile.user.username ? profile.user.username[0].toUpperCase() : 'U'}
                    </AvatarFallback>
                  </Avatar>
                </div>

                {/* User Info */}
                <div className="flex-1 text-center md:text-left">
                  <div className="mb-3 flex flex-col md:flex-row md:items-center md:justify-between">
                    <h1 className="text-3xl font-bold text-[#2c5530]">
                      {profile.user.username}
                    </h1>
                    <div className="mt-3 flex justify-center gap-2 md:mt-0 md:justify-start">
                      {user && user.id !== parseInt(params.id) && (
                        <Button
                          onClick={handleFollow}
                          className={isFollowing ? "bg-gray-200 text-gray-800 hover:bg-gray-300" : "bg-[#2c5530] text-white hover:bg-[#1a3a1f]"}
                          size="sm"
                        >
                          {isFollowing ? (
                            <>
                              <UserMinus className="mr-1 h-4 w-4" /> Unfollow
                            </>
                          ) : (
                            <>
                              <UserPlus className="mr-1 h-4 w-4" /> Follow
                            </>
                          )}
                        </Button>
                      )}
                      <Button
                        variant="outline"
                        size="sm"
                        className="border-[#2c5530] text-[#2c5530] hover:bg-[#e8f2e8]"
                        onClick={handleShare}
                      >
                        <Share2 className="mr-1 h-4 w-4" /> Share
                      </Button>
                    </div>
                  </div>

                  <div className="mb-4 flex flex-wrap items-center justify-center gap-4 text-sm text-gray-600 md:justify-start">
                    {profile.user.location && (
                      <div className="flex items-center">
                        <MapPin className="mr-1 h-4 w-4 text-[#2c5530]" />
                        <span>{profile.user.location}</span>
                      </div>
                    )}
                    {profile.user.occupation && (
                      <div className="flex items-center">
                        <Briefcase className="mr-1 h-4 w-4 text-[#2c5530]" />
                        <span>{profile.user.occupation}</span>
                      </div>
                    )}
                    {profile.user.website && (
                      <div className="flex items-center">
                        <Globe className="mr-1 h-4 w-4 text-[#2c5530]" />
                        <a
                          href={profile.user.website.startsWith('http') ? profile.user.website : `https://${profile.user.website}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="hover:text-[#2c5530] hover:underline"
                        >
                          {profile.user.website.replace(/^https?:\/\//, '')}
                        </a>
                      </div>
                    )}
                    <div className="flex items-center">
                      <Calendar className="mr-1 h-4 w-4 text-[#2c5530]" />
                      <span>Joined {formatDateTime(profile.user.created_at)}</span>
                    </div>
                  </div>

                  {profile.user.bio && (
                    <p className="mt-2 text-gray-600">{profile.user.bio}</p>
                  )}

                  {/* Level Info */}
                  <div className="mt-6">
                    <div className="mb-1 flex items-center justify-between">
                      <div className="flex items-center">
                        <Award className="mr-2 h-5 w-5 text-[#e76f51]" />
                        <span className="font-medium">Level {profile.user.level}</span>
                      </div>
                      <span className="text-sm text-gray-500">
                        {currentLevelExp}/{expToNextLevel} XP to next level
                      </span>
                    </div>
                    <Progress value={progressPercent} className="h-2 bg-gray-200">
                      <div className="h-full bg-gradient-to-r from-[#e76f51] to-[#f4a261] rounded-full"></div>
                    </Progress>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="container mx-auto px-4 py-6">
        <div className="mb-6 flex justify-center">
          <Tabs value={activeTab} className="w-full max-w-4xl">
            <TabsList className="bg-white">
              <TabsTrigger 
                value="overview" 
                onClick={() => setActiveTab("overview")}
                className="data-[state=active]:bg-[#e8f2e8] data-[state=active]:text-[#2c5530]"
              >
                Overview
              </TabsTrigger>
              <TabsTrigger 
                value="achievements" 
                onClick={() => setActiveTab("achievements")}
                className="data-[state=active]:bg-[#e8f2e8] data-[state=active]:text-[#2c5530]"
              >
                Achievements
              </TabsTrigger>
              <TabsTrigger 
                value="activity" 
                onClick={() => setActiveTab("activity")}
                className="data-[state=active]:bg-[#e8f2e8] data-[state=active]:text-[#2c5530]"
              >
                Activity
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {activeTab === "overview" && (
          <motion.div
            variants={staggerContainer}
            initial="hidden"
            animate="visible"
            className="mx-auto max-w-4xl"
          >
            {/* Stats Row */}
            <motion.div variants={slideUp} className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <Card className="bg-white shadow-sm transition-all hover:shadow-md">
                <CardContent className="p-6">
                  <div className="mb-4 flex items-center justify-between">
                    <h3 className="text-sm font-medium text-gray-500">Trees Planted</h3>
                    <TreePine className="h-5 w-5 text-[#2c5530]" />
                  </div>
                  <p className="text-3xl font-bold text-[#2c5530]">{profile.stats.trees_planted}</p>
                </CardContent>
              </Card>

              <Card className="bg-white shadow-sm transition-all hover:shadow-md">
                <CardContent className="p-6">
                  <div className="mb-4 flex items-center justify-between">
                    <h3 className="text-sm font-medium text-gray-500">CO₂ Offset</h3>
                    <Leaf className="h-5 w-5 text-[#2c5530]" />
                  </div>
                  <p className="text-3xl font-bold text-[#2c5530]">{profile.stats.co2_offset} kg</p>
                </CardContent>
              </Card>

              <Card className="bg-white shadow-sm transition-all hover:shadow-md">
                <CardContent className="p-6">
                  <div className="mb-4 flex items-center justify-between">
                    <h3 className="text-sm font-medium text-gray-500">Events Joined</h3>
                    <Calendar className="h-5 w-5 text-[#2c5530]" />
                  </div>
                  <p className="text-3xl font-bold text-[#2c5530]">{profile.stats.events_joined}</p>
                </CardContent>
              </Card>

              <Card className="bg-white shadow-sm transition-all hover:shadow-md">
                <CardContent className="p-6">
                  <div className="mb-4 flex items-center justify-between">
                    <h3 className="text-sm font-medium text-gray-500">Followers</h3>
                    <Users className="h-5 w-5 text-[#2c5530]" />
                  </div>
                  <p className="text-3xl font-bold text-[#2c5530]">{profile.stats.followers_count || 0}</p>
                </CardContent>
              </Card>
            </motion.div>

            {/* Group Membership */}
            {profile.group && (
              <motion.div variants={slideUp}>
                <h2 className="mb-4 text-xl font-bold text-[#2c5530]">Group Membership</h2>
                <Card className="bg-white shadow-sm transition-all hover:shadow-md">
                  <CardContent className="p-6">
                    <div className="flex items-center gap-4">
                      <Avatar className="h-12 w-12">
                        <AvatarImage src={profile.group.image_url || "/placeholders/group.png"} alt={profile.group.name} />
                        <AvatarFallback className="bg-[#2c5530] text-white">
                          {profile.group.name[0]}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <h3 className="font-semibold text-[#2c5530]">{profile.group.name}</h3>
                        <p className="text-sm text-gray-500">
                          {profile.group.role ? `Role: ${profile.group.role}` : "Member"}
                        </p>
                      </div>
                      <Button 
                        asChild
                        className="ml-auto bg-[#2c5530] hover:bg-[#1a3a1f]"
                        size="sm"
                      >
                        <Link href={`/groups/${profile.group.id}`}>
                          View Group
                        </Link>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}
            
            {/* Recent Activity */}
            <motion.div variants={slideUp}>
              <div className="mb-4 mt-8 flex items-center justify-between">
                <h2 className="text-xl font-bold text-[#2c5530]">Recent Activity</h2>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => setActiveTab("activity")}
                  className="text-[#2c5530] hover:bg-[#e8f2e8]"
                >
                  View All <ArrowRight className="ml-1 h-4 w-4" />
                </Button>
              </div>
              <Card className="bg-white shadow-sm">
                <CardContent className="p-4">
                  {profile.activities && profile.activities.length > 0 ? (
                    <div className="space-y-4">
                      {profile.activities.slice(0, 5).map((activity) => (
                        <div key={activity.id} className="flex items-start gap-3 rounded-lg p-2 transition-colors hover:bg-[#f8f9f3]">
                          <div className="rounded-full bg-[#e8f2e8] p-2">
                            {getActivityIcon(activity.activity_type)}
                          </div>
                          <div>
                            <p className="text-sm text-gray-700">
                              {activity.activity_type === "tree_planted" && "Planted a tree"}
                              {activity.activity_type === "events_joined" && 
                                `Joined the event "${activity.activity_data.event_title || 'Environmental Event'}"`}
                              {activity.activity_type === "events_created" && 
                                `Created a new event "${activity.activity_data.event_title || 'Environmental Event'}"`}
                              {activity.activity_type === "challenge_completed" && 
                                `Completed the challenge "${activity.activity_data.challenge_name || 'Environmental Challenge'}"`}
                              {activity.activity_type === "achievement_earned" && 
                                `Earned the "${activity.activity_data.name || 'Environmental'}" achievement`}
                              {activity.activity_type === "forum_post" && "Posted in the forum"}
                              {activity.activity_type === "forum_reply" && "Replied to a forum post"}
                              {activity.activity_type === "learning_completed" && "Completed a learning module"}
                              {activity.activity_type === "group_created" && "Created a new group"}
                              {activity.activity_type === "group_member_added" && "Joined a group"}
                            </p>
                            <p className="mt-1 text-xs text-gray-500">
                              {formatRelativeTime(activity.created_at)}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="py-8 text-center text-gray-500">
                      No recent activity
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
            
            {/* Recent Achievements */}
            {profile.achievements && profile.achievements.length > 0 && (
              <motion.div variants={slideUp}>
                <div className="mb-4 mt-8 flex items-center justify-between">
                  <h2 className="text-xl font-bold text-[#2c5530]">Recent Achievements</h2>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => setActiveTab("achievements")}
                    className="text-[#2c5530] hover:bg-[#e8f2e8]"
                  >
                    View All <ArrowRight className="ml-1 h-4 w-4" />
                  </Button>
                </div>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
                  {profile.achievements.slice(0, 3).map((achievement) => (
                    <Card 
                      key={achievement.id} 
                      className="cursor-pointer bg-white shadow-sm transition-all hover:shadow-md"
                      onClick={() => setSelectedAchievement(achievement)}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="rounded-full bg-[#e8f2e8] p-2">
                            {getAchievementIcon(achievement.icon_name)}
                          </div>
                          <div>
                            <h3 className="font-semibold text-[#2c5530]">{achievement.name}</h3>
                            <p className="text-xs text-gray-500">
                              {formatRelativeTime(achievement.earned_at)}
                            </p>
                          </div>
                        </div>
                        <p className="mt-2 text-sm text-gray-600">{achievement.description}</p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </motion.div>
            )}
          </motion.div>
        )}

        {activeTab === "achievements" && (
          <motion.div
            variants={staggerContainer}
            initial="hidden"
            animate="visible"
            className="mx-auto max-w-4xl"
          >
            {/* Filtering/Search for Achievements */}
            <motion.div variants={slideUp} className="mb-6">
              <Card className="bg-white shadow-sm">
                <CardContent className="p-4">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                    <div className="relative flex-1">
                      <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                      <Input
                        placeholder="Search achievements..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-9"
                      />
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="outline"
                          size="icon"
                          className={`${viewMode === 'grid' ? 'bg-[#e8f2e8] text-[#2c5530]' : ''}`}
                          onClick={() => setViewMode('grid')}
                        >
                          <LayoutGrid className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="icon"
                          className={`${viewMode === 'list' ? 'bg-[#e8f2e8] text-[#2c5530]' : ''}`}
                          onClick={() => setViewMode('list')}
                        >
                          <List className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Achievements Content */}
            <motion.div variants={slideUp}>
              <Card className="bg-white shadow-sm">
                <CardContent className="p-4">
                  {profile.achievements && profile.achievements.length > 0 ? (
                    <>
                      {viewMode === 'grid' ? (
                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                          {filteredAchievements.map((achievement) => (
                            <Card 
                              key={achievement.id} 
                              className="cursor-pointer border-[#e8f2e8] shadow-sm transition-all hover:shadow-md"
                              onClick={() => setSelectedAchievement(achievement)}
                            >
                              <CardContent className="p-4">
                                <div className="flex items-center gap-3">
                                  <div className="rounded-full bg-[#e8f2e8] p-2">
                                    {getAchievementIcon(achievement.icon_name)}
                                  </div>
                                  <div>
                                    <h3 className="font-semibold text-[#2c5530]">{achievement.name}</h3>
                                    <p className="text-xs text-gray-500">
                                      {formatRelativeTime(achievement.earned_at)}
                                    </p>
                                  </div>
                                </div>
                                <p className="mt-2 text-sm text-gray-600">{achievement.description}</p>
                                <div className="mt-2 flex items-center justify-between">
                                  <Badge className="bg-[#e8f2e8] text-[#2c5530]">
                                    {achievement.category || "Environmental"}
                                  </Badge>
                                  <span className="text-sm font-medium text-[#e76f51]">
                                    {achievement.exp_reward} XP
                                  </span>
                                </div>
                              </CardContent>
                            </Card>
                          ))}
                        </div>
                      ) : (
                        <div className="space-y-2">
                          {filteredAchievements.map((achievement) => (
                            <div 
                              key={achievement.id} 
                              className="flex cursor-pointer items-center justify-between rounded-lg p-3 transition-colors hover:bg-[#f8f9f3]"
                              onClick={() => setSelectedAchievement(achievement)}
                            >
                              <div className="flex items-center gap-3">
                                <div className="rounded-full bg-[#e8f2e8] p-2">
                                  {getAchievementIcon(achievement.icon_name)}
                                </div>
                                <div>
                                  <h3 className="font-semibold text-[#2c5530]">{achievement.name}</h3>
                                  <p className="text-sm text-gray-600">{achievement.description}</p>
                                  <div className="mt-1 flex items-center gap-2">
                                    <Badge className="bg-[#e8f2e8] text-[#2c5530] text-xs">
                                      {achievement.category || "Environmental"}
                                    </Badge>
                                    <span className="text-xs text-[#e76f51]">
                                      {achievement.exp_reward} XP
                                    </span>
                                  </div>
                                </div>
                              </div>
                              <div className="text-xs text-gray-500">
                                {formatRelativeTime(achievement.earned_at)}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="py-8 text-center text-gray-500">
                      No achievements yet
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          </motion.div>
        )}

        {activeTab === "activity" && (
          <motion.div
            variants={staggerContainer}
            initial="hidden"
            animate="visible"
            className="mx-auto max-w-4xl"
          >
            <motion.div variants={slideUp}>
              <Card className="bg-white shadow-sm">
                <CardHeader>
                  <CardTitle>Activity Log</CardTitle>
                </CardHeader>
                <CardContent>
                  {profile.activities && profile.activities.length > 0 ? (
                    <div className="space-y-4">
                      {profile.activities.map((activity) => (
                        <div key={activity.id} className="flex items-start gap-3 rounded-lg p-3 transition-colors hover:bg-[#f8f9f3]">
                          <div className="rounded-full bg-[#e8f2e8] p-2">
                            {getActivityIcon(activity.activity_type)}
                          </div>
                          <div className="flex-1">
                            <p className="text-sm text-gray-700">
                              {activity.activity_type === "tree_planted" && "Planted a tree"}
                              {activity.activity_type === "events_joined" && 
                                `Joined the event "${activity.activity_data.event_title || 'Environmental Event'}"`}
                              {activity.activity_type === "events_created" && 
                                `Created a new event "${activity.activity_data.event_title || 'Environmental Event'}"`}
                              {activity.activity_type === "challenge_completed" && 
                                `Completed the challenge "${activity.activity_data.challenge_name || 'Environmental Challenge'}"`}
                              {activity.activity_type === "achievement_earned" && 
                                `Earned the "${activity.activity_data.name || 'Environmental'}" achievement`}
                              {activity.activity_type === "forum_post" && "Posted in the forum"}
                              {activity.activity_type === "forum_reply" && "Replied to a forum post"}
                              {activity.activity_type === "learning_completed" && "Completed a learning module"}
                              {activity.activity_type === "group_created" && "Created a new group"}
                              {activity.activity_type === "group_member_added" && "Joined a group"}
                            </p>
                            {activity.activity_type === "achievement_earned" && activity.activity_data.exp_reward && (
                              <Badge className="mt-1 bg-[#e8f2e8] text-[#2c5530] text-xs">
                                +{activity.activity_data.exp_reward} XP
                              </Badge>
                            )}
                            <p className="mt-1 text-xs text-gray-500">
                              {formatDateTime(activity.created_at)}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="py-8 text-center text-gray-500">
                      No activity recorded yet
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          </motion.div>
        )}
      </div>

      {/* Achievement Dialog */}
      <Dialog open={!!selectedAchievement} onOpenChange={(open) => !open && setSelectedAchievement(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Achievement Details</DialogTitle>
          </DialogHeader>
          {selectedAchievement && (
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="rounded-full bg-[#e8f2e8] p-4">
                  {getAchievementIcon(selectedAchievement.icon_name)}
                </div>
                <div>
                  <h3 className="font-semibold text-[#2c5530]">{selectedAchievement.name}</h3>
                  <p className="text-xs text-gray-500">
                    Earned {formatRelativeTime(selectedAchievement.earned_at)}
                  </p>
                </div>
              </div>
              
              <div>
                <h4 className="mb-1 text-sm font-medium text-[#2c5530]">Description</h4>
                <p className="text-gray-600">{selectedAchievement.description}</p>
              </div>

              <div>
                <h4 className="mb-1 text-sm font-medium text-[#2c5530]">Reward</h4>
                <p className="text-[#e76f51] font-medium">{selectedAchievement.exp_reward} XP</p>
              </div>

              {selectedAchievement.category && (
                <div>
                  <h4 className="mb-1 text-sm font-medium text-[#2c5530]">Category</h4>
                  <Badge className="bg-[#e8f2e8] text-[#2c5530]">
                    {selectedAchievement.category}
                  </Badge>
                </div>
              )}

              {selectedAchievement.criteria && (
                <div>
                  <h4 className="mb-1 text-sm font-medium text-[#2c5530]">Criteria</h4>
                  <ul className="list-inside list-disc space-y-1 text-sm text-gray-600">
                    {Object.entries(selectedAchievement.criteria).map(([key, value]) => (
                      <li key={key}>
                        {key.replace(/_/g, ' ')}: {value?.toString()}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Share Dialog */}
      <Dialog open={showShareDialog} onOpenChange={setShowShareDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Share Profile</DialogTitle>
            <DialogDescription>
              Share this profile with others through these options
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="flex items-center gap-4">
              <Input
                value={window.location.href}
                readOnly
                className="flex-1"
              />
              <Button 
                type="button" 
                variant="outline" 
                onClick={copyProfileLink}
                className="border-[#2c5530] text-[#2c5530] hover:bg-[#e8f2e8]"
              >
                <Copy className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex justify-center gap-4 pt-2">
              <Button 
                variant="outline" 
                className="border-[#1da1f2] text-[#1da1f2] hover:bg-[#1da1f2] hover:text-white"
                onClick={() => window.open(`https://twitter.com/intent/tweet?url=${encodeURIComponent(window.location.href)}`, '_blank')}
              >
                <Twitter className="h-5 w-5" />
              </Button>
              <Button 
                variant="outline"
                className="border-[#3b5998] text-[#3b5998] hover:bg-[#3b5998] hover:text-white"
                onClick={() => window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(window.location.href)}`, '_blank')}
              >
                <Facebook className="h-5 w-5" />
              </Button>
              <Button 
                variant="outline"
                className="border-[#ea4335] text-[#ea4335] hover:bg-[#ea4335] hover:text-white"
                onClick={() => window.open(`mailto:?subject=Check out this profile&body=${encodeURIComponent(window.location.href)}`, '_blank')}
              >
                <Mail className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
} 
