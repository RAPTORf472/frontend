"use client"

import type React from "react"

import { useState, useEffect } from "react"
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
  Star,
  Trophy,
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
} from "lucide-react"
import Link from "next/link"
import { motion, AnimatePresence } from "framer-motion"

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

export default function ProfilePage() {
  const { user } = useAuth()
  const router = useRouter()
  const [isEditing, setIsEditing] = useState(false)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [editForm, setEditForm] = useState({
    username: "",
    email: "",
    bio: "",
    location: "",
    website: "",
    occupation: "",
  })
  const [error, setError] = useState<string | null>(null)
  const [selectedAchievement, setSelectedAchievement] = useState<Achievement | null>(null)
  const [viewMode, setViewMode] = useState<"list" | "grid">("grid")
  const [activeFilter, setActiveFilter] = useState<string>("all")
  const [searchQuery, setSearchQuery] = useState<string>("")
  const [showNotification, setShowNotification] = useState(false)
  const [activeTab, setActiveTab] = useState("overview")
  useEffect(() => {
    if (!user) {
      router.push("/auth/login")
      return
    }
    fetchProfile()
  }, [user, router])

  const fetchProfile = async () => {
    setIsLoading(true)
    try {
      const response = await fetch("/api/auth/me", {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      })

      if (!response.ok) {
        throw new Error("Failed to fetch profile")
      }

      const data = await response.json()
      if (!data.success) {
        throw new Error(data.error || "Failed to fetch profile")
      }

      // Calculate level from exp if not provided
      if (!data.user.level && data.user.exp) {
        data.user.level = Math.floor(data.user.exp / 100) + 1
      }

      setProfile(data)
      setEditForm({
        username: data.user.username,
        email: data.user.email,
        bio: data.user.bio || "",
        location: data.user.location || "",
        website: data.user.website || "",
        occupation: data.user.occupation || "",
      })

      // Fetch achievements after profile is loaded
      if (data.user && data.user.id) {
        await fetchUserAchievements(data.user.id)
        await fetchUserActivities(data.user.id)
      }
    } catch (error) {
      console.error("Error fetching profile:", error)
      setError("Failed to load profile")
    } finally {
      setIsLoading(false)
    }
  }

  const fetchUserStats = async (userId: number) => {
    try {
      const response = await fetch(`/api/users/${userId}/stats`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      })

      if (!response.ok) {
        throw new Error("Failed to fetch stats")
      }

      const data = await response.json()
      setProfile((prevProfile) => {
        if (!prevProfile) return null
        return {
          ...prevProfile,
          stats: data.stats,
        }
      })
      
      if (!data.success) {
        throw new Error(data.error || "Failed to fetch stats")
      }
    }
    catch (error) {
      console.error("Error fetching stats:", error)
    }
  }
  
  useEffect(() => {
    if (user && user.id) {
      fetchUserStats(user.id)
    }
  }, [user])



  const fetchUserAchievements = async (userId: number) => {
    try {
      const response = await fetch(`/api/users/${userId}/achievements`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      })

      if (!response.ok) {
        throw new Error("Failed to fetch achievements")
      }

      const data = await response.json()
      if (!data.success) {
        throw new Error(data.error || "Failed to fetch achievements")
      }

      // Update profile with achievements
      setProfile((prevProfile) => {
        if (!prevProfile) return null
        return {
          ...prevProfile,
          achievements: data.earned_achievements || [],
        }
      })
    } catch (error) {
      console.error("Error fetching achievements:", error)
    }
  }

  const fetchUserActivities = async (userId: number) => {
    try {
      const response = await fetch(`/api/users/${userId}/activities?limit=20`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      })

      if (!response.ok) {
        throw new Error("Failed to fetch activities")
      }

      const data = await response.json()
      if (!data.success) {
        throw new Error(data.error || "Failed to fetch activities")
      }

      // Update profile with activities
      setProfile((prevProfile) => {
        if (!prevProfile) return null
        return {
          ...prevProfile,
          activities: data.activities || [],
        }
      })
    } catch (error) {
      console.error("Error fetching activities:", error)
    }
  }

  const handleEditSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault()
    setIsLoading(true)
    try {
      const response = await fetch("/api/auth/me", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify(editForm),
      })

      if (!response.ok) {
        throw new Error("Failed to update profile")
      }

      // Update local profile state
      if (profile) {
        setProfile({
          ...profile,
          user: {
            ...profile.user,
            username: editForm.username,
            email: editForm.email,
            bio: editForm.bio,
            location: editForm.location,
            website: editForm.website,
            occupation: editForm.occupation,
          },
        })
      }
      setIsEditing(false)

      // Show success notification
      setShowNotification(true)
      setTimeout(() => setShowNotification(false), 3000)
      
      return Promise.resolve(); // Add explicit return statement
    } catch (error) {
      console.error("Error updating profile:", error)
      setError("Failed to update profile")
      
      return Promise.resolve(); // Add explicit return statement
    } finally {
      setIsLoading(false)
    }
  }

  // Filter activities based on active filter
  const filteredActivities = profile?.activities
    ?.filter((activity) => {
      if (activeFilter === "all") return true
      return activity.activity_type === activeFilter
    })
    .filter((activity) => {
      if (!searchQuery) return true

      // Search in activity data
      const activityData = activity.activity_data
      return (
        (activityData.name && activityData.name.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (activityData.event_title && activityData.event_title.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (activityData.challenge_name && activityData.challenge_name.toLowerCase().includes(searchQuery.toLowerCase()))
      )
    })


  // Filter achievements based on search query
  const filteredAchievements = profile?.achievements?.filter((achievement) => {
    if (!searchQuery) return true
    return (
      achievement.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      achievement.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (achievement.category && achievement.category.toLowerCase().includes(searchQuery.toLowerCase()))
    )
  })

  if (isLoading || !profile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f0f4e9]">
        <motion.div
          className="flex flex-col items-center gap-4"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
        >
          <div className="relative h-16 w-16">
            <div className="absolute inset-0 rounded-full border-4 border-[#2c5530]/20"></div>
            <div className="absolute inset-0 rounded-full border-4 border-t-[#2c5530] animate-spin"></div>
          </div>
          <div className="text-center">
            <p className="text-lg font-medium text-[#2c5530]">Loading Profile</p>
            <p className="text-sm text-[#5a7d61]">Please wait a moment...</p>
          </div>
        </motion.div>
      </div>
    )
  }

  // Calculate progress within current level
  const expProgress = profile.user.exp % 100

  // Get icon based on activity type
  const getActivityIcon = (type: string): JSX.Element => {
    switch (type) {
      case "tree_planted":
        return <TreePine className="h-5 w-5 text-[#e76f51]" />
      case "events_joined":
        return <Calendar className="h-5 w-5 text-[#e76f51]" />
      case "events_created":
        return <Users className="h-5 w-5 text-[#e76f51]" />
      case "achievement_earned":
        return <Award className="h-5 w-5 text-[#e76f51]" />
      case "challenge_completed":
        return <Trophy className="h-5 w-5 text-[#e76f51]" />
      case "forum_post":
        return <MessageSquare className="h-5 w-5 text-[#e76f51]" />
      case "forum_reply":
        return <MessageSquare className="h-5 w-5 text-[#e76f51]" />
      case "forum_likes":
        return <Heart className="h-5 w-5 text-[#e76f51]" />
      case "learning_completed":
        return <Leaf className="h-5 w-5 text-[#e76f51]" />
      case "group_member_added":
        return <UserPlus className="h-5 w-5 text-[#e76f51]" />
      case "group_member_removed":
        return <UserMinus className="h-5 w-5 text-[#e76f51]" />
      case "group_created":
        return <Users className="h-5 w-5 text-[#e76f51]" />
      case "events_unregistered":
        return <Users className="h-5 w-5 text-[#e76f51]" />
      case "materials_read":
        return <BookOpen className="h-5 w-5 text-[#e76f51]" />
      default:
        return <Activity className="h-5 w-5 text-[#e76f51]" />
    }
  }

  // Get achievement icon
  const getAchievementIcon = (title: string): JSX.Element => {
    if (title.toLowerCase().includes("tree")) {
      return <TreePine className="h-5 w-5 text-emerald-600" />
    } else if (title.toLowerCase().includes("event")) {
      return <Calendar className="h-5 w-5 text-blue-600" />
    } else if (title.toLowerCase().includes("challenge")) {
      return <Target className="h-5 w-5 text-purple-600" />
    } else if (title.toLowerCase().includes("champion")) {
      return <Trophy className="h-5 w-5 text-amber-600" />
    } else {
      return <Award className="h-5 w-5 text-indigo-600" />
    }
  }

  // Format date to a consistent human-readable format
  const formatDateTime = (dateString: string): string => {
    try {
      const date = new Date(dateString)
      // Use format to get a consistent date representation
      return format(date, "MMM d, yyyy 'at' h:mm a")
    } catch (error) {
      console.error("Date formatting error:", error)
      return dateString // Return original string if there's an error
    }
  }

  // Format date to relative time (e.g. "2 days ago")
  const formatRelativeTime = (dateString: string): string => {
    try {
      const date = new Date(dateString)
      return formatDistance(date, new Date(), { addSuffix: true })
    } catch (error) {
      console.error("Date formatting error:", error)
      return dateString
    }
  }

  return (
    <div className="min-h-screen bg-[#f0f4e9]">
      {/* Notification */}
      <AnimatePresence>
        {showNotification && (
          <motion.div
            className="fixed top-4 right-4 z-50 bg-[#2c5530] text-white px-6 py-4 rounded-xl shadow-xl flex items-center gap-3"
            initial={{ opacity: 0, y: -20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.9 }}
          >
            <div className="bg-white/20 rounded-full p-2">
              <Check className="h-5 w-5" />
            </div>
            <div>
              <p className="font-medium">Profile updated successfully!</p>
              <p className="text-sm text-white/80">Your changes have been saved</p>
            </div>
            <button onClick={() => setShowNotification(false)} className="ml-2 p-1 hover:bg-white/20 rounded-full">
              <X className="h-4 w-4" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Layout */}
      <div className="max-w-7xl mx-auto px-4 py-8 md:px-6 lg:px-8">
        {/* Profile Header */}
        <motion.div className="mb-8" initial="hidden" animate="visible" variants={fadeIn}>
          <div className="relative rounded-3xl overflow-hidden">
            {/* Cover Photo */}
            <div className="h-64 md:h-80 bg-gradient-to-r from-[#2c5530] to-[#3a6b3e] relative">
              <div className="absolute inset-0 bg-[url('/placeholder.svg?height=400&width=1200')] opacity-10 mix-blend-overlay bg-center bg-cover"></div>
              <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent"></div>

              {/* Profile Actions */}
              <div className="absolute top-4 right-4 flex gap-2">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="secondary" size="sm" className="bg-white/90 hover:bg-white text-[#2c5530]">
                      <MoreHorizontal className="h-4 w-4 mr-1" />
                      Options
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48">
                    <DropdownMenuItem onClick={() => setIsEditing(true)}>
                      <Edit className="h-4 w-4 mr-2" />
                      Edit Profile
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                      <Camera className="h-4 w-4 mr-2" />
                      Change Photo
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                      <Share2 className="h-4 w-4 mr-2" />
                      Share Profile
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem>
                      <Download className="h-4 w-4 mr-2" />
                      Export Data
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                      <Settings className="h-4 w-4 mr-2" />
                      Settings
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>

                <Button onClick={() => setIsEditing(true)} className="bg-[#e76f51] hover:bg-[#e25b3a] text-white">
                  <Edit className="h-4 w-4 mr-2" />
                  Edit Profile
                </Button>
              </div>
            </div>

            {/* Profile Info Overlay */}
            <div className="absolute bottom-0 left-0 right-0 px-6 py-6 flex flex-col md:flex-row md:items-end gap-6">
              {/* Avatar */}
              <div className="relative">
                <div className="h-32 w-32 md:h-40 md:w-40 rounded-full border-4 border-white bg-white shadow-xl overflow-hidden">
                  <Avatar className="h-full w-full">
                    <AvatarImage
                      src={profile?.user.avatar_url || `https://api.dicebear.com/7.x/initials/svg?seed=${profile?.user.username || "User"}`}
                      alt={profile?.user.username}
                      className="object-cover"
                    />
                    <AvatarFallback className="text-6xl">
                      <User className="h-24 w-24 text-[#5a7d61]/60" />
                    </AvatarFallback>
                  </Avatar>
                </div>
                <div className="absolute -bottom-2 -right-2">
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          size="icon"
                          className="rounded-full bg-[#e76f51] hover:bg-[#e25b3a] text-white shadow-md h-10 w-10"
                          onClick={() => setIsEditing(true)}
                        >
                          <Camera className="h-5 w-5" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Change Profile Photo</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
              </div>

              {/* User Info */}
              <div className="text-white flex-1">
                <h1 className="text-3xl font-bold">{profile?.user.username}</h1>
                <p className="text-white/80">{profile?.user.email}</p>
                {profile?.user?.occupation && <p className="text-white/80 mt-1">{profile.user.occupation}</p>}
                <div className="flex flex-wrap gap-2 mt-3">
                  <Badge className="bg-white/20 hover:bg-white/30 text-white border-none">
                    <Star className="h-3 w-3 mr-1" />
                    Level {profile?.user.level}
                  </Badge>
                  <Badge className="bg-[#e76f51] hover:bg-[#e25b3a] text-white border-none">
                    <Flame className="h-3 w-3 mr-1" />
                    {profile?.user.exp} EXP
                  </Badge>
                  {profile?.group && (
                    <Badge className="bg-white/20 hover:bg-white/30 text-white border-none">
                      <Users className="h-3 w-3 mr-1" />
                      {profile.group.name}
                    </Badge>
                  )}
                </div>
              </div>

              {/* Stats */}
              <div className="flex gap-6 text-white">
                <div className="text-center">
                  <p className="text-2xl font-bold">{profile?.stats?.followers_count || 0}</p>
                  <p className="text-sm text-white/80">Followers</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold">{profile?.stats?.following_count || 0}</p>
                  <p className="text-sm text-white/80">Following</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold">{profile?.achievements?.length || 0}</p>
                  <p className="text-sm text-white/80">Achievements</p>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_350px] gap-8">
          {/* Left Column */}
          <div className="space-y-8">
            {isEditing ? (
              <EditProfileForm
                editForm={editForm as EditProfileFormProps['editForm']}
                setEditForm={setEditForm as EditProfileFormProps['setEditForm']}
                handleEditSubmit={handleEditSubmit}
                setIsEditing={setIsEditing}
              />
            ) : (
              <>
                {/* Profile Navigation */}
                <motion.div
                  className="bg-white rounded-xl shadow-sm overflow-hidden"
                  variants={slideUp}
                  initial="hidden"
                  animate="visible"
                >
                  <div className="border-b border-[#d1e0d3]">
                    <nav className="flex overflow-x-auto">
                      {[
                        { id: "overview", label: "Overview", icon: <Layers className="h-4 w-4" /> },
                        { id: "achievements", label: "Achievements", icon: <Trophy className="h-4 w-4" /> },
                        { id: "activity", label: "Activity", icon: <Activity className="h-4 w-4" /> },
                        { id: "groups", label: "Groups", icon: <Users className="h-4 w-4" /> },
                      ].map((item) => (
                        <button
                          key={item.id}
                          onClick={() => setActiveTab(item.id)}
                          className={`flex items-center gap-2 px-6 py-4 font-medium transition-colors ${
                            activeTab === item.id
                              ? "text-[#2c5530] border-b-2 border-[#2c5530]"
                              : "text-[#5a7d61] hover:text-[#2c5530] hover:bg-[#f0f4e9]"
                          }`}
                        >
                          {item.icon}
                          {item.label}
                        </button>
                      ))}
                    </nav>
                  </div>
                </motion.div>

                {/* Tab Content */}
                <AnimatePresence mode="wait">
                  {activeTab === "overview" && (
                    <OverviewTab 
                      profile={profile} 
                      expProgress={expProgress} 
                      setActiveTab={setActiveTab} 
                      getActivityIcon={getActivityIcon}
                      formatRelativeTime={formatRelativeTime}
                    />
                  )}

                  {activeTab === "achievements" && (
                    <AchievementsTab
                      achievements={filteredAchievements}
                      searchQuery={searchQuery}
                      setSearchQuery={setSearchQuery}
                      viewMode={viewMode}
                      setViewMode={setViewMode}
                      setSelectedAchievement={setSelectedAchievement}
                      getActivityIcon={getActivityIcon}
                      formatRelativeTime={formatRelativeTime}
                      activeFilter={activeFilter}
                      setActiveFilter={setActiveFilter}
                    />
                  )}

                  {activeTab === "activity" && (
                    <ActivityTab
                      activities={filteredActivities}
                      searchQuery={searchQuery}
                      setSearchQuery={setSearchQuery}
                      activeFilter={activeFilter}
                      setActiveFilter={setActiveFilter}
                      viewMode={viewMode}
                      setViewMode={setViewMode}
                      getActivityIcon={getActivityIcon}
                      formatRelativeTime={formatRelativeTime}
                    />
                  )}

                  {activeTab === "groups" && <GroupsTab profile={profile} />}
                </AnimatePresence>
              </>
            )}
          </div>

          {/* Right Column */}
          <div className="space-y-8">
            {/* Profile Details Card */}
            <motion.div variants={slideUp} initial="hidden" animate="visible">
              <Card className="overflow-hidden border-none shadow-md">
                <CardHeader className="bg-gradient-to-r from-[#e9f0e6] to-[#d1e0d3] pb-4">
                  <CardTitle className="text-[#2c5530] flex items-center text-lg">
                    <User className="h-5 w-5 mr-2" />
                    Profile Details
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-6 bg-white">
                  <div className="space-y-4">
                    {profile?.user?.bio && (
                      <div className="pb-4 border-b border-[#d1e0d3]">
                        <h3 className="text-sm font-medium text-[#2c5530] mb-2">About</h3>
                        <p className="text-[#5a7d61]">{profile.user.bio}</p>
                      </div>
                    )}

                    <div className="space-y-3">
                      <div className="flex items-center gap-3">
                        <div className="bg-[#f0f4e9] p-2 rounded-full">
                          <Calendar className="h-4 w-4 text-[#3a6b3e]" />
                        </div>
                        <div>
                          <p className="text-xs text-[#5a7d61]">Joined</p>
                          <p className="text-sm text-[#2c5530] font-medium">
                            {formatDateTime(profile?.user.created_at || "")}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <div className="bg-[#f0f4e9] p-2 rounded-full">
                          <Clock className="h-4 w-4 text-[#3a6b3e]" />
                        </div>
                        <div>
                          <p className="text-xs text-[#5a7d61]">Last active</p>
                          <p className="text-sm text-[#2c5530] font-medium">
                            {formatRelativeTime(profile?.user.last_login || "")}
                          </p>
                        </div>
                      </div>

                      {profile?.user?.location && (
                        <div className="flex items-center gap-3">
                          <div className="bg-[#f0f4e9] p-2 rounded-full">
                            <MapPin className="h-4 w-4 text-[#3a6b3e]" />
                          </div>
                          <div>
                            <p className="text-xs text-[#5a7d61]">Location</p>
                            <p className="text-sm text-[#2c5530] font-medium">{profile.user.location}</p>
                          </div>
                        </div>
                      )}

                      {profile?.user?.website && (
                        <div className="flex items-center gap-3">
                          <div className="bg-[#f0f4e9] p-2 rounded-full">
                            <Globe className="h-4 w-4 text-[#3a6b3e]" />
                          </div>
                          <div>
                            <p className="text-xs text-[#5a7d61]">Website</p>
                            <p className="text-sm text-[#2c5530] font-medium">{profile.user.website}</p>
                          </div>
                        </div>
                      )}

                      {profile?.user?.occupation && (
                        <div className="flex items-center gap-3">
                          <div className="bg-[#f0f4e9] p-2 rounded-full">
                            <Briefcase className="h-4 w-4 text-[#3a6b3e]" />
                          </div>
                          <div>
                            <p className="text-xs text-[#5a7d61]">Occupation</p>
                            <p className="text-sm text-[#2c5530] font-medium">{profile.user.occupation}</p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Stats Cards */}
            <motion.div
              className="grid grid-cols-2 gap-4"
              variants={staggerContainer}
              initial="hidden"
              animate="visible"
            >
              <StatCard
                title="Trees Planted"
                value={profile?.stats?.trees_planted || 0}
                icon={<TreePine className="h-5 w-5 text-white" />}
                description="Contributing to a greener future"
                color="from-[#2c5530] to-[#3a6b3e]"
              />

              <StatCard
                title="CO2 Offset"
                value={`${profile?.stats?.co2_offset || 0}kg`}
                icon={<Leaf className="h-5 w-5 text-white" />}
                description="Environmental impact"
                color="from-[#3a6b3e] to-[#5a7d61]"
              />

              <StatCard
                title="Events Joined"
                value={profile?.stats?.events_joined || 0}
                icon={<Calendar className="h-5 w-5 text-white" />}
                description="Active community member"
                color="from-[#e76f51] to-[#e25b3a]"
              />

              <StatCard
                title="Volunteer Hours"
                value={profile?.stats?.volunteer_hours || 0}
                icon={<Clock className="h-5 w-5 text-white" />}
                description="Time dedicated"
                color="from-[#e25b3a] to-[#e76f51]"
              />
            </motion.div>

            {/* Quick Links */}
            <motion.div variants={slideUp} initial="hidden" animate="visible">
              <Card className="overflow-hidden border-none shadow-md">
                <CardHeader className="bg-gradient-to-r from-[#e9f0e6] to-[#d1e0d3] pb-4">
                  <CardTitle className="text-[#2c5530] flex items-center text-lg">
                    <Zap className="h-5 w-5 mr-2" />
                    Quick Links
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-4 pb-2 bg-white">
                  <div className="grid grid-cols-2 gap-2">
                    <QuickLinkButton href="/events" icon={<Calendar className="h-4 w-4" />} label="Events" />
                    <QuickLinkButton href="/challenges" icon={<Target className="h-4 w-4" />} label="Challenges" />
                    <QuickLinkButton href="/forum" icon={<MessageSquare className="h-4 w-4" />} label="Forum" />
                    <QuickLinkButton href="/groups" icon={<Users className="h-4 w-4" />} label="Groups" />
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Achievement Detail Dialog */}
      <Dialog open={!!selectedAchievement} onOpenChange={(open) => !open && setSelectedAchievement(null)}>
        <DialogContent className="bg-white border-none max-w-md">
          <DialogHeader>
            <DialogTitle className="text-[#2c5530] text-xl">Achievement Details</DialogTitle>
            <DialogDescription className="text-[#5a7d61]">
              View more information about this achievement
            </DialogDescription>
          </DialogHeader>

          {selectedAchievement && (
            <motion.div
              className="space-y-6"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <div className="flex items-start gap-4">
                <div className="rounded-full p-4 bg-gradient-to-br from-[#2c5530] to-[#3a6b3e] text-white">
                  {getActivityIcon("achievement_earned")}
                </div>
                <div>
                  <h3 className="font-semibold text-[#2c5530] text-lg">{selectedAchievement.name}</h3>
                  <p className="text-[#5a7d61] mt-1">{selectedAchievement.description}</p>
                </div>
              </div>

              <div className="bg-[#f0f4e9] rounded-lg p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[#2c5530] font-medium">Earned</span>
                  <span className="text-[#5a7d61]">{formatDateTime(selectedAchievement.earned_at)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[#2c5530] font-medium">Reward</span>
                  <span className="text-[#5a7d61]">{selectedAchievement.exp_reward} XP</span>
                </div>
                {selectedAchievement.category && (
                  <div className="flex items-center justify-between">
                    <span className="text-[#2c5530] font-medium">Category</span>
                    <Badge variant="outline" className="bg-[#d1e0d3] text-[#2c5530] border-none">
                      {selectedAchievement.category.replace("_", " ")}
                    </Badge>
                  </div>
                )}
              </div>

              <div className="flex gap-2">
                <Button
                  onClick={() => setSelectedAchievement(null)}
                  className="flex-1 bg-[#e76f51] hover:bg-[#e25b3a] text-white"
                >
                  Close
                </Button>
                <Button variant="outline" className="border-[#d1e0d3] text-[#2c5530] hover:bg-[#f0f4e9]">
                  <Share2 className="h-4 w-4 mr-2" />
                  Share
                </Button>
              </div>
            </motion.div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

// Component for Edit Profile Form
interface EditProfileFormProps {
  editForm: {
    username: string;
    email: string;
    bio: string;
    location: string;
    website: string;
    occupation: string;
  };
  setEditForm: React.Dispatch<React.SetStateAction<{
    username: string;
    email: string;
    bio: string;
    location: string;
    website: string;
    occupation: string;
  }>>;
  handleEditSubmit: (e: React.FormEvent) => Promise<void>;
  setIsEditing: React.Dispatch<React.SetStateAction<boolean>>;
}

function EditProfileForm({ editForm, setEditForm, handleEditSubmit, setIsEditing }: EditProfileFormProps) {
  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
      <Card className="border-none shadow-md overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-[#e9f0e6] to-[#d1e0d3] pb-4">
          <CardTitle className="text-[#2c5530] flex items-center">
            <Edit className="h-5 w-5 mr-2" />
            Edit Profile
          </CardTitle>
          <CardDescription className="text-[#5a7d61]">Update your profile information</CardDescription>
        </CardHeader>
        <CardContent className="pt-6 bg-white">
          <form onSubmit={handleEditSubmit} className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-sm font-medium mb-1.5 text-[#2c5530]">Username</label>
                <Input
                  type="text"
                  value={editForm.username}
                  onChange={(e) => setEditForm({ ...editForm, username: e.target.value })}
                  className="border-[#d1e0d3] focus-visible:ring-[#3a6b3e]"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5 text-[#2c5530]">Email</label>
                <Input
                  type="email"
                  value={editForm.email}
                  onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                  className="border-[#d1e0d3] focus-visible:ring-[#3a6b3e]"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5 text-[#2c5530]">Location</label>
                <Input
                  type="text"
                  value={editForm.location}
                  onChange={(e) => setEditForm({ ...editForm, location: e.target.value })}
                  className="border-[#d1e0d3] focus-visible:ring-[#3a6b3e]"
                  placeholder="City, Country"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5 text-[#2c5530]">Website</label>
                <Input
                  type="text"
                  value={editForm.website}
                  onChange={(e) => setEditForm({ ...editForm, website: e.target.value })}
                  className="border-[#d1e0d3] focus-visible:ring-[#3a6b3e]"
                  placeholder="https://example.com"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5 text-[#2c5530]">Occupation</label>
                <Input
                  type="text"
                  value={editForm.occupation}
                  onChange={(e) => setEditForm({ ...editForm, occupation: e.target.value })}
                  className="border-[#d1e0d3] focus-visible:ring-[#3a6b3e]"
                  placeholder="Your profession"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5 text-[#2c5530]">Bio</label>
              <textarea
                value={editForm.bio}
                onChange={(e) => setEditForm({ ...editForm, bio: e.target.value })}
                className="w-full min-h-[120px] rounded-md border border-[#d1e0d3] bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#3a6b3e]"
                placeholder="Tell us about yourself..."
              />
            </div>
            <div className="flex justify-end space-x-3 pt-2">
              <Button
                variant="outline"
                onClick={() => setIsEditing(false)}
                className="border-[#d1e0d3] text-[#2c5530] hover:bg-[#f0f4e9]"
              >
                Cancel
              </Button>
              <Button type="submit" className="bg-[#e76f51] hover:bg-[#e25b3a] text-white">
                Save Changes
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </motion.div>
  )
}

// Component for Overview Tab
interface OverviewTabProps {
  profile: UserProfile;
  expProgress: number;
  setActiveTab: React.Dispatch<React.SetStateAction<string>>;
  getActivityIcon: (type: string) => JSX.Element;
  formatRelativeTime: (dateString: string) => string;
}

function OverviewTab({ profile, expProgress, setActiveTab, getActivityIcon, formatRelativeTime }: OverviewTabProps) {  return (
    <motion.div
      key="overview"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-8"
    >
      {/* Bio Section */}
      <Card className="border-none shadow-md overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-[#e9f0e6] to-[#d1e0d3] pb-4">
          <CardTitle className="text-[#2c5530] flex items-center">
            <FileText className="h-5 w-5 mr-2" />
            About
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6 bg-white">
          {profile?.user?.bio ? (
            <p className="text-[#5a7d61]">{profile.user.bio}</p>
          ) : (
            <div className="text-center py-6">
              <p className="text-[#5a7d61]">No bio information added yet.</p>
              <Button variant="link" className="text-[#e76f51] mt-2">
                Add Bio
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Level Progress */}
      <Card className="border-none shadow-md overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-[#e9f0e6] to-[#d1e0d3] pb-4">
          <CardTitle className="text-[#2c5530] flex items-center">
            <Sparkles className="h-5 w-5 mr-2" />
            Level Progress
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6 bg-white">
          <div className="flex items-center justify-between mb-2">
            <div>
              <span className="text-lg font-bold text-[#2c5530]">Level {profile?.user.level}</span>
              <span className="text-sm text-[#5a7d61] ml-2">({profile?.user.exp} XP total)</span>
            </div>
            <span className="text-sm font-medium text-[#3a6b3e]">
              {expProgress}% to Level {profile?.user.level + 1}
            </span>
          </div>
          <Progress
            value={expProgress}
            className="h-3 bg-[#d1e0d3] rounded-full"
            style={
              {
                "--progress-background": "linear-gradient(to right, #2c5530, #3a6b3e)",
              } as React.CSSProperties
            }
          />

          <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-[#f0f4e9] rounded-lg p-4 text-center">
              <div className="bg-[#d1e0d3] rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-2">
                <TreePine className="h-6 w-6 text-[#2c5530]" />
              </div>
              <p className="text-lg font-bold text-[#2c5530]">{profile?.stats?.trees_planted || 0}</p>
              <p className="text-xs text-[#5a7d61]">Trees Planted</p>
            </div>

            <div className="bg-[#f0f4e9] rounded-lg p-4 text-center">
              <div className="bg-[#d1e0d3] rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-2">
                <Calendar className="h-6 w-6 text-[#2c5530]" />
              </div>
              <p className="text-lg font-bold text-[#2c5530]">{profile?.stats?.events_joined || 0}</p>
              <p className="text-xs text-[#5a7d61]">Events Joined</p>
            </div>

            <div className="bg-[#f0f4e9] rounded-lg p-4 text-center">
              <div className="bg-[#d1e0d3] rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-2">
                <Award className="h-6 w-6 text-[#2c5530]" />
              </div>
              <p className="text-lg font-bold text-[#2c5530]">{profile?.achievements?.length || 0}</p>
              <p className="text-xs text-[#5a7d61]">Achievements</p>
            </div>
          </div>

          <div className="mt-6 bg-[#e76f51]/10 rounded-lg p-4 flex items-center">
            <div className="bg-[#e76f51] rounded-full p-2 text-white mr-4">
              <Flame className="h-5 w-5" />
            </div>
            <div>
              <p className="text-[#e76f51] font-medium">Keep up the good work!</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recent Activity */}
      <Card className="border-none shadow-md overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-[#e9f0e6] to-[#d1e0d3] pb-4">
          <div className="flex justify-between items-center">
            <CardTitle className="text-[#2c5530] flex items-center">
              <Activity className="h-5 w-5 mr-2" />
              Recent Activity
            </CardTitle>
            <Button variant="link" className="text-[#e76f51]" onClick={() => setActiveTab("activity")}>
              View All
            </Button>
          </div>
        </CardHeader>
        <CardContent className="pt-6 bg-white">
          {profile?.activities && profile.activities.length > 0 ? (
            <div className="space-y-4">
              {profile.activities.slice(0, 3).map((activity: UserActivity) => (
                <div key={activity.id} className="flex gap-3 pb-4 border-b border-[#d1e0d3] last:border-0">
                  <div className="bg-[#f0f4e9] p-2 rounded-full h-fit">{getActivityIcon(activity.activity_type)}</div>
                  <div>
                    <p className="text-[#2c5530] font-medium">
                      {activity.activity_type === "tree_planted" && "Planted a tree"}
                      {activity.activity_type === "events_joined" &&
                        `Joined event: ${activity.activity_data?.event_title || ""}`}
                      {activity.activity_type === "events_unregistered" &&
                        `Unregistered from event: ${activity.activity_data?.event_title || ""}`}
                      {activity.activity_type === "events_created" &&
                        `Created event: ${activity.activity_data?.event_title || ""}`}
                      {activity.activity_type === "achievement_earned" &&
                        `Earned achievement: ${activity.activity_data?.name || ""}`}
                      {activity.activity_type === "challenge_completed" &&
                        `Completed challenge: ${activity.activity_data?.challenge_name || ""}`}
                      {activity.activity_type === "forum_post" && "Posted in the forum"}
                      {activity.activity_type === "forum_reply" && "Replied to a forum post"}
                      {activity.activity_type === "forum_likes" && "Liked a forum post"}
                      {activity.activity_type === "learning_completed" && "Completed a learning resource"}
                      {activity.activity_type === "group_created" && "Created a community group"}
                      {activity.activity_type === "group_member_added" && "Joined a community group"}
                      {activity.activity_type === "group_member_removed" && "Left a community group"}
                      {activity.activity_type === "materials_read" && "Read a learning resource"}
                    </p>
                    <p className="text-xs text-[#5a7d61] mt-1">{formatRelativeTime(activity.created_at)}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-6">
              <Activity className="h-12 w-12 text-[#d1e0d3] mx-auto mb-2" />
              <p className="text-[#5a7d61]">No recent activity found</p>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  )
}

// Component for Achievements Tab
interface AchievementsTabProps {
  achievements: Achievement[] | undefined;
  searchQuery: string;
  setSearchQuery: React.Dispatch<React.SetStateAction<string>>;
  viewMode: 'list' | 'grid';
  setViewMode: React.Dispatch<React.SetStateAction<'list' | 'grid'>>;
  setSelectedAchievement: React.Dispatch<React.SetStateAction<Achievement | null>>;
  getActivityIcon: (type: string) => JSX.Element;
  formatRelativeTime: (dateString: string) => string;
  activeFilter?: string;
  setActiveFilter?: React.Dispatch<React.SetStateAction<string>>;
}

function AchievementsTab({
  achievements,
  searchQuery,
  setSearchQuery,
  viewMode,
  setViewMode,
  setSelectedAchievement,
  getActivityIcon,
  formatRelativeTime,
  activeFilter,
  setActiveFilter,
}: AchievementsTabProps) {
  return (
    <motion.div
      key="achievements"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-6"
    >
      <Card className="border-none shadow-md overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-[#e9f0e6] to-[#d1e0d3] pb-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <CardTitle className="text-[#2c5530] flex items-center">
              <Trophy className="h-5 w-5 mr-2" />
              Achievements
            </CardTitle>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="h-4 w-4 absolute left-2.5 top-2.5 text-[#5a7d61]" />
                <Input
                  type="search"
                  placeholder="Search achievements..."
                  className="pl-9 border-[#d1e0d3] focus-visible:ring-[#3a6b3e] w-[200px]"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <div className="flex space-x-1 bg-[#e9f0e6] p-1 rounded-full">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setViewMode("list")}
                  className={`rounded-full p-2 ${viewMode === "list" ? "bg-[#2c5530] text-white" : "text-[#2c5530]"}`}
                >
                  <List className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setViewMode("grid")}
                  className={`rounded-full p-2 ${viewMode === "grid" ? "bg-[#2c5530] text-white" : "text-[#2c5530]"}`}
                >
                  <LayoutGrid className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-6 bg-white">
          <div className={viewMode === "grid" ? "grid grid-cols-1 md:grid-cols-2 gap-4" : "space-y-4"}>
            {achievements?.map((achievement: Achievement) => (
              <motion.div key={achievement.id} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                <Card
                  className={`border-none ${viewMode === "grid" ? "bg-gradient-to-br from-[#f0f4e9] to-[#e9f0e6]" : "bg-white border border-[#d1e0d3]"} shadow-sm hover:shadow-md transition-shadow cursor-pointer`}
                  onClick={() => setSelectedAchievement(achievement)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start gap-4">
                      <div className="rounded-full p-3 bg-gradient-to-br from-[#2c5530] to-[#3a6b3e] text-white">
                        {getActivityIcon("achievement_earned")}
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-[#2c5530]">{achievement.name}</h3>
                        <p className="text-sm text-[#5a7d61]">{achievement.description}</p>
                        <div className={`${viewMode === "grid" ? "" : "flex justify-between items-center"} mt-2`}>
                          <p className="text-xs text-[#5a7d61]">Earned {formatRelativeTime(achievement.earned_at)}</p>
                          {viewMode === "list" && (
                            <Badge className="bg-[#e76f51]/10 text-[#e76f51] rounded-full px-3 py-1">
                              +{achievement.exp_reward} XP
                            </Badge>
                          )}
                        </div>
                        {viewMode === "grid" && (
                          <div className="mt-2">
                            <Badge className="bg-[#e76f51]/10 text-[#e76f51] rounded-full px-3 py-1">
                              +{achievement.exp_reward} XP
                            </Badge>
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
            {(!achievements || achievements.length === 0) && (
              <div className={viewMode === "grid" ? "col-span-2 text-center py-8" : "text-center py-8"}>
                <Trophy className="h-12 w-12 text-[#d1e0d3] mx-auto mb-2" />
                <p className="text-sm text-[#5a7d61]">
                  {searchQuery ? "No achievements match your search" : "No achievements yet"}
                </p>
                {searchQuery && (
                  <Button variant="link" onClick={() => setSearchQuery("")} className="text-[#e76f51] mt-2">
                    Clear search
                  </Button>
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}

// Component for Activity Tab
interface ActivityTabProps {
  activities: UserActivity[] | undefined;
  searchQuery: string;
  setSearchQuery: React.Dispatch<React.SetStateAction<string>>;
  activeFilter: string;
  setActiveFilter: React.Dispatch<React.SetStateAction<string>>;
  viewMode: 'list' | 'grid';
  setViewMode: React.Dispatch<React.SetStateAction<'list' | 'grid'>>;
  getActivityIcon: (type: string) => JSX.Element;
  formatRelativeTime: (dateString: string) => string;
}

function ActivityTab({
  activities,
  searchQuery,
  setSearchQuery,
  activeFilter,
  setActiveFilter,
  viewMode,
  setViewMode,
  getActivityIcon,
  formatRelativeTime,
}: ActivityTabProps) {
  return (
    <motion.div
      key="activity"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-6"
    >
      <Card className="border-none shadow-md overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-[#e9f0e6] to-[#d1e0d3] pb-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <CardTitle className="text-[#2c5530] flex items-center">
              <Activity className="h-5 w-5 mr-2" />
              Activity
            </CardTitle>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="h-4 w-4 absolute left-2.5 top-2.5 text-[#5a7d61]" />
                <Input
                  type="search"
                  placeholder="Search activity..."
                  className="pl-9 border-[#d1e0d3] focus-visible:ring-[#3a6b3e] w-[200px]"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <div className="flex space-x-1 bg-[#e9f0e6] p-1 rounded-full">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setViewMode("list")}
                  className={`rounded-full p-2 ${viewMode === "list" ? "bg-[#2c5530] text-white" : "text-[#2c5530]"}`}
                >
                  <List className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setViewMode("grid")}
                  className={`rounded-full p-2 
                  onClick={() => setViewMode('grid')} 
                  className={\`rounded-full p-2 ${viewMode === "grid" ? "bg-[#2c5530] text-white" : "text-[#2c5530]"}`}
                >
                  <LayoutGrid className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-6 bg-white">
          <div className="flex items-center gap-2 mb-4 overflow-x-auto pb-2 scrollbar-thin">
            <Button
              variant={activeFilter === "all" ? "default" : "outline"}
              size="sm"
              onClick={() => setActiveFilter("all")}
              className={activeFilter === "all" ? "bg-[#2c5530] hover:bg-[#3a6b3e]" : "border-[#d1e0d3]"}
            >
              All
            </Button>
            <Button
              variant={activeFilter === "tree_planted" ? "default" : "outline"}
              size="sm"
              onClick={() => setActiveFilter("tree_planted")}
              className={activeFilter === "tree_planted" ? "bg-[#2c5530] hover:bg-[#3a6b3e]" : "border-[#d1e0d3]"}
            >
              <TreePine className="h-4 w-4 mr-1" />
              Trees
            </Button>
            <Button
              variant={activeFilter === "events_joined" ? "default" : "outline"}
              size="sm"
              onClick={() => setActiveFilter("events_joined")}
              className={activeFilter === "events_joined" ? "bg-[#2c5530] hover:bg-[#3a6b3e]" : "border-[#d1e0d3]"}
            >
              <Calendar className="h-4 w-4 mr-1" />
              Events
            </Button>
            <Button
              variant={activeFilter === "achievement_earned" ? "default" : "outline"}
              size="sm"
              onClick={() => setActiveFilter("achievement_earned")}
              className={activeFilter === "achievement_earned" ? "bg-[#2c5530] hover:bg-[#3a6b3e]" : "border-[#d1e0d3]"}
            >
              <Award className="h-4 w-4 mr-1" />
              Achievements
            </Button>
            <Button
              variant={activeFilter === "challenge_completed" ? "default" : "outline"}
              size="sm"
              onClick={() => setActiveFilter("challenge_completed")}
              className={
                activeFilter === "challenge_completed" ? "bg-[#2c5530] hover:bg-[#3a6b3e]" : "border-[#d1e0d3]"
              }
            >
              <Target className="h-4 w-4 mr-1" />
              Challenges
            </Button>
          </div>

          <div className={viewMode === "grid" ? "grid grid-cols-1 md:grid-cols-2 gap-4" : "space-y-4"}>
            {activities?.map((activity: UserActivity) => (
              <motion.div
                key={activity.id}
                whileHover={{ scale: 1.01 }}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                <Card
                  className={`${viewMode === "grid" ? "border-none bg-gradient-to-br from-[#f0f4e9] to-[#e9f0e6]" : "bg-white border border-[#d1e0d3]"} shadow-sm hover:shadow-md transition-shadow`}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <div
                        className={`${viewMode === "grid" ? "bg-gradient-to-br from-[#2c5530] to-[#3a6b3e] text-white" : "bg-[#f0f4e9]"} p-2 rounded-full`}
                      >
                        {getActivityIcon(activity.activity_type)}
                      </div>
                      <div className="flex-1">
                        <p className={`${viewMode === "grid" ? "text-[#2c5530] font-medium" : "text-[#5a7d61]"}`}>
                          {activity.activity_type === "tree_planted" && "Planted a tree"}
                          {activity.activity_type === "events_joined" &&
                            `Joined event: ${activity.activity_data?.event_title || ""}`}
                          {activity.activity_type === "events_unregistered" &&
                            `Unregistered from event: ${activity.activity_data?.event_title || ""}`}
                          {activity.activity_type === "events_created" &&
                            `Created event: ${activity.activity_data?.event_title || ""}`}
                          {activity.activity_type === "achievement_earned" &&
                            `Earned achievement: ${activity.activity_data?.name || ""}`}
                          {activity.activity_type === "challenge_completed" &&
                            `Completed challenge: ${activity.activity_data?.challenge_name || ""}`}
                          {activity.activity_type === "forum_post" && "Posted in the forum"}
                          {activity.activity_type === "forum_reply" && "Replied to a forum post"}
                          {activity.activity_type === "forum_likes" && "Liked a forum post"}
                          {activity.activity_type === "learning_completed" && "Completed a learning resource"}
                          {activity.activity_type === "group_created" && "Created a community group"}
                          {activity.activity_type === "group_member_added" && "Joined a community group"}
                          {activity.activity_type === "group_member_removed" && "Left a community group"}
                          {activity.activity_type === "materials_read" && `Read a learning resource`}
                        </p>
                        <p className="text-xs text-[#5a7d61] mt-1">{formatRelativeTime(activity.created_at)}</p>

                        {activity.activity_data?.exp_reward && (
                          <Badge className="mt-2 bg-[#e76f51]/10 text-[#e76f51] rounded-full px-2 py-0.5 text-xs">
                            +{activity.activity_data.exp_reward} XP
                          </Badge>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
            {(!activities || activities.length === 0) && (
              <div className={viewMode === "grid" ? "col-span-2 text-center py-8" : "text-center py-8"}>
                <Activity className="h-12 w-12 text-[#d1e0d3] mx-auto mb-2" />
                <p className="text-sm text-[#5a7d61]">
                  {searchQuery || activeFilter !== "all"
                    ? "No activities match your filters"
                    : "No recent activity found"}
                </p>
                {(searchQuery || activeFilter !== "all") && (
                  <Button
                    variant="link"
                    onClick={() => {
                      setSearchQuery("")
                      setActiveFilter("all")
                    }}
                    className="text-[#e76f51] mt-2"
                  >
                    Clear filters
                  </Button>
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}

// Component for Groups Tab
interface GroupsTabProps {
  profile: UserProfile;
}

function GroupsTab({ profile }: GroupsTabProps) {
  return (
    <motion.div
      key="groups"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-6"
    >
      {profile.group ? (
        // User has joined a group
        <>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            <Card className="border-none shadow-lg overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-[#2c5530]/10 to-[#3a6b3e]/20 pb-4">
                <CardTitle className="text-[#2c5530] flex items-center">
                  <Users className="h-5 w-5 mr-2 text-[#3a6b3e]" />
                  My Community Group
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6 bg-white">
                <div className="flex flex-col md:flex-row md:items-center gap-6">
                  {profile.group.image_url ? (
                    <Avatar className="h-24 w-24 border-4 border-[#d1e0d3] shadow-md mx-auto md:mx-0">
                      <AvatarImage src={profile.group.image_url} alt={profile.group.name} />
                      <AvatarFallback className="bg-[#2c5530]/10">
                        <Users className="h-12 w-12 text-[#5a7d61]" />
                      </AvatarFallback>
                    </Avatar>
                  ) : (
                    <div className="h-24 w-24 rounded-full bg-gradient-to-br from-[#2c5530] to-[#3a6b3e] border-4 border-white shadow-md flex items-center justify-center mx-auto md:mx-0">
                      <Users className="h-12 w-12 text-white" />
                    </div>
                  )}
                  <div className="flex-1 text-center md:text-left">
                    <h3 className="text-2xl font-semibold text-[#2c5530]">{profile.group.name}</h3>
                    {profile.group.role && (
                      <Badge className="mt-2 bg-[#3a6b3e]/10 text-[#3a6b3e] border-none">{profile.group.role}</Badge>
                    )}
                    <p className="mt-3 text-[#5a7d61]">
                      As a member of this community group, you can participate in group activities, discussions, and
                      collaborate on environmental initiatives.
                    </p>
                  </div>
                </div>

                <div className="mt-6 flex flex-col sm:flex-row gap-4 justify-center sm:justify-end">
                  <Sheet>
                    <SheetTrigger asChild>
                      <Button
                        variant="outline"
                        className="border-[#e76f51] text-[#e76f51] hover:bg-[#e76f51]/10 hover:text-[#e25b3a]"
                      >
                        Leave Group
                        <X className="ml-2 w-4 h-4" />
                      </Button>
                    </SheetTrigger>
                    <SheetContent>
                      <SheetHeader>
                        <SheetTitle>Leave Group</SheetTitle>
                        <SheetDescription>
                          Are you sure you want to leave this group? You will lose access to group activities and
                          discussions.
                        </SheetDescription>
                      </SheetHeader>
                      <div className="py-6">
                        <p className="text-[#5a7d61]">
                          You are currently a member of{" "}
                          <span className="font-medium text-[#2c5530]">{profile.group.name}</span>. Leaving this group
                          means you will no longer have access to group events, discussions, and resources.
                        </p>
                      </div>
                      <SheetFooter>
                        <SheetClose asChild>
                          <Button variant="outline">Cancel</Button>
                        </SheetClose>
                        <Button className="bg-[#e76f51] hover:bg-[#e25b3a] text-white">Confirm Leave</Button>
                      </SheetFooter>
                    </SheetContent>
                  </Sheet>
                  <Link href={`/groups/${profile.group.id}`}>
                    <Button className="bg-[#2c5530] hover:bg-[#3a6b3e] text-white shadow-md hover:shadow-lg transition-all w-full sm:w-auto">
                      View Group Page
                      <ArrowRight className="ml-2 w-4 h-4" />
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.5 }}
          >
            <Card className="border-none shadow-md overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-[#e9f0e6] to-[#d1e0d3] pb-4">
                <CardTitle className="text-[#2c5530] flex items-center">
                  <Calendar className="h-5 w-5 mr-2 text-[#3a6b3e]" />
                  Upcoming Group Events
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6 bg-white">
                <div className="space-y-4">
                  <div className="bg-[#f0f4e9] rounded-lg p-4 flex items-start gap-4">
                    <div className="bg-[#2c5530] text-white p-2 rounded-lg text-center min-w-[60px]">
                      <p className="text-xs font-medium">JUN</p>
                      <p className="text-xl font-bold">15</p>
                    </div>
                    <div>
                      <h4 className="font-medium text-[#2c5530]">Tree Planting Day</h4>
                      <p className="text-sm text-[#5a7d61]">
                        Join us for a community tree planting event at Central Park
                      </p>
                      <div className="flex items-center gap-4 mt-2">
                        <Badge variant="outline" className="bg-white/50 text-[#5a7d61] border-none">
                          <Clock className="h-3 w-3 mr-1" />
                          9:00 AM
                        </Badge>
                        <Badge variant="outline" className="bg-white/50 text-[#5a7d61] border-none">
                          <MapPin className="h-3 w-3 mr-1" />
                          Central Park
                        </Badge>
                      </div>
                    </div>
                  </div>

                  <div className="bg-[#f0f4e9] rounded-lg p-4 flex items-start gap-4">
                    <div className="bg-[#e76f51] text-white p-2 rounded-lg text-center min-w-[60px]">
                      <p className="text-xs font-medium">JUN</p>
                      <p className="text-xl font-bold">22</p>
                    </div>
                    <div>
                      <h4 className="font-medium text-[#2c5530]">Sustainability Workshop</h4>
                      <p className="text-sm text-[#5a7d61]">Learn about sustainable practices for everyday living</p>
                      <div className="flex items-center gap-4 mt-2">
                        <Badge variant="outline" className="bg-white/50 text-[#5a7d61] border-none">
                          <Clock className="h-3 w-3 mr-1" />
                          2:00 PM
                        </Badge>
                        <Badge variant="outline" className="bg-white/50 text-[#5a7d61] border-none">
                          <MapPin className="h-3 w-3 mr-1" />
                          Community Center
                        </Badge>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-4 text-center">
                  <Button variant="link" className="text-[#e76f51]">
                    View all upcoming events
                    <ArrowRight className="ml-1 h-3 w-3" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </>
      ) : (
        // User hasn't joined any group
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
        >
          <Card className="border-none shadow-md overflow-hidden">
            <CardContent className="p-8 bg-white">
              <div className="text-center">
                <div className="bg-gradient-to-br from-[#2c5530] to-[#3a6b3e] rounded-full p-6 w-24 h-24 mx-auto mb-6 flex items-center justify-center">
                  <Users className="h-12 w-12 text-white" />
                </div>
                <h3 className="text-2xl font-semibold text-[#2c5530] mb-2">No Group Joined Yet</h3>
                <p className="text-[#5a7d61] max-w-md mx-auto mb-6">
                  Join a community group to connect with like-minded individuals and participate in group activities and
                  environmental initiatives.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Link href="/groups">
                    <Button className="bg-[#2c5530] hover:bg-[#3a6b3e] text-white shadow-md">
                      Browse Groups
                      <ArrowRight className="ml-2 w-4 h-4" />
                    </Button>
                  </Link>
                  <Link href="/groups/create">
                    <Button variant="outline" className="border-[#2c5530] text-[#2c5530] hover:bg-[#f0f4e9]">
                      Create New Group
                    </Button>
                  </Link>
                </div>
              </div>

              <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-[#f0f4e9] rounded-xl p-6 text-center">
                  <div className="bg-white rounded-full p-4 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                    <Users className="h-8 w-8 text-[#2c5530]" />
                  </div>
                  <h4 className="font-medium text-[#2c5530] mb-2">Connect</h4>
                  <p className="text-sm text-[#5a7d61]">
                    Meet like-minded individuals who share your passion for the environment
                  </p>
                </div>

                <div className="bg-[#f0f4e9] rounded-xl p-6 text-center">
                  <div className="bg-white rounded-full p-4 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                    <Calendar className="h-8 w-8 text-[#2c5530]" />
                  </div>
                  <h4 className="font-medium text-[#2c5530] mb-2">Participate</h4>
                  <p className="text-sm text-[#5a7d61]">Join group events and activities to make a positive impact</p>
                </div>

                <div className="bg-[#f0f4e9] rounded-xl p-6 text-center">
                  <div className="bg-white rounded-full p-4 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                    <MessageSquare className="h-8 w-8 text-[#2c5530]" />
                  </div>
                  <h4 className="font-medium text-[#2c5530] mb-2">Collaborate</h4>
                  <p className="text-sm text-[#5a7d61]">Share ideas and work together on environmental initiatives</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </motion.div>
  )
}

// Component for Stat Card
interface StatCardProps {
  title: string;
  value: number | string;
  icon: React.ReactNode;
  description: string;
  color: string;
}

function StatCard({ title, value, icon, description, color }: StatCardProps) {
  return (
    <motion.div variants={slideUp} className="rounded-xl overflow-hidden shadow-md">
      <div className={`bg-gradient-to-br ${color} p-4 text-white`}>
        <div className="flex justify-between items-center">
          <h3 className="font-medium">{title}</h3>
          <div className="bg-white/20 rounded-full p-1.5">{icon}</div>
        </div>
        <p className="text-2xl font-bold mt-2">{value}</p>
      </div>
      <div className="bg-white p-3">
        <p className="text-xs text-[#5a7d61]">{description}</p>
      </div>
    </motion.div>
  )
}

// Component for Quick Link Button
interface QuickLinkButtonProps {
  href: string;
  icon: React.ReactNode;
  label: string;
}

function QuickLinkButton({ href, icon, label }: QuickLinkButtonProps) {
  return (
    <Link href={href}>
      <Button
        variant="outline"
        className="w-full h-auto py-3 border-[#d1e0d3] text-[#2c5530] hover:bg-[#f0f4e9] flex flex-col items-center gap-1"
      >
        <div className="bg-[#f0f4e9] p-2 rounded-full">{icon}</div>
        <span className="text-xs font-medium">{label}</span>
      </Button>
    </Link>
  )
}

// Define proper type for Check component
function Check(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

