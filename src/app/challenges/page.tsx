"use client"

import { useState, useEffect } from "react"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Trophy, Star, Calendar, Clock, Target, Award, ChevronRight, ShieldCheck, Leaf, LayoutGrid, List, Filter } from "lucide-react"
import { useAuth } from "@/contexts/auth-context"
import { Spinner } from "@/components/ui/spinner"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog"
import { SubmitChallengeForm } from "@/components/challenges/SubmitChallengeForm"
import { ModerationDashboard } from "@/components/challenges/ModerationDashboard"
import Link from "next/link"
import { motion } from "framer-motion"

// Animation variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const itemVariants = {
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
};

interface Challenge {
  id: number
  title: string
  description: string
  category: 'daily' | 'weekly' | 'monthly' | 'one_time'
  difficulty: 'easy' | 'medium' | 'hard' | 'expert'
  exp_reward: number
  icon_name: string
  requirements: string
  progress?: number
  status?: 'in_progress' | 'completed' | 'failed'
  started_at?: string
  completed_at?: string
}

interface LeaderboardEntry {
  username: string
  total_exp: number
  completed_challenges: number
}

export default function ChallengesPage() {
  const { user } = useAuth()
  const [activeTab, setActiveTab] = useState("available")
  const [challenges, setChallenges] = useState<{
    active: Challenge[]
    completed: Challenge[]
    available: Challenge[]
  }>({
    active: [],
    completed: [],
    available: []
  })
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedChallenge, setSelectedChallenge] = useState<Challenge | null>(null)
  const [openDialogId, setOpenDialogId] = useState<number | null>(null)
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false)
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list')
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>('all')

  // Check for reduced motion preference
  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    setPrefersReducedMotion(mediaQuery.matches);

    const handleChange = () => setPrefersReducedMotion(mediaQuery.matches);
    mediaQuery.addEventListener("change", handleChange);

    return () => mediaQuery.removeEventListener("change", handleChange);
  }, []);

  // Adjust animations based on preference
  const getAnimationProps = (variants: any) => {
    return prefersReducedMotion ? {} : variants;
  };

  const fetchChallenges = async () => {
    try {
      const token = localStorage.getItem('token')
      if (!token) return

      const response = await fetch('/api/challenges/user', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      
      if (!response.ok) {
        const error = await response.json()
        console.error('Error fetching challenges:', error)
        return
      }
      
      const data = await response.json()
      setChallenges(data)
    } catch (error) {
      console.error('Error fetching challenges:', error)
    }
  }

  const fetchLeaderboard = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch('/api/challenges/leaderboard', {
        headers: {
          'Authorization': `Bearer ${token || ''}`
        }
      })
      if (response.ok) {
        const data = await response.json()
        setLeaderboard(data)
      }
    } catch (error) {
      console.error('Error fetching leaderboard:', error)
    }
  }

  useEffect(() => {
    Promise.all([fetchChallenges(), fetchLeaderboard()])
      .finally(() => setIsLoading(false))
  }, [])

  const handleStartChallenge = async (challengeId: number) => {
    try {
      const token = localStorage.getItem('token')
      if (!token) return

      const response = await fetch(`/api/challenges/${challengeId}/start`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      
      if (response.ok) {
        await fetchChallenges() // Refresh the challenges list
      } else {
        const error = await response.json()
        console.error('Error starting challenge:', error)
      }
    } catch (error) {
      console.error('Error starting challenge:', error)
    }
  }

  const handleSubmitSuccess = async () => {
    setOpenDialogId(null)
    setSelectedChallenge(null)
    await fetchChallenges() // Refresh challenges after submission
  }

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return 'bg-green-100 text-green-700'
      case 'medium': return 'bg-yellow-100 text-yellow-700'
      case 'hard': return 'bg-orange-100 text-orange-700'
      case 'expert': return 'bg-red-100 text-red-700'
      default: return 'bg-gray-100 text-gray-700'
    }
  }

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'daily': return <Clock className="h-5 w-5" />
      case 'weekly': return <Calendar className="h-5 w-5" />
      case 'monthly': return <Target className="h-5 w-5" />
      case 'one_time': return <Star className="h-5 w-5" />
      default: return <Award className="h-5 w-5" />
    }
  }

  const getCategoryLabel = (category: string) => {
    switch (category) {
      case 'daily': return 'Daily Challenge'
      case 'weekly': return 'Weekly Challenge'
      case 'monthly': return 'Monthly Challenge'
      case 'one_time': return 'Special Challenge'
      default: return 'Challenge'
    }
  }

  // Filter challenges based on selected difficulty
  const getFilteredChallenges = (challengeList: Challenge[]): Challenge[] => {
    if (selectedDifficulty === 'all') return challengeList;
    return challengeList.filter(challenge => challenge.difficulty === selectedDifficulty);
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Spinner size="lg" className="text-[#2c5530]" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#f8f9f3] py-8 relative">
      {/* Background image */}
      <div 
        className="absolute inset-0 bg-cover bg-center opacity-10 z-0" 
        style={{ 
          backgroundImage: "url('https://4kwallpapers.com/images/walls/thumbs_3t/2445.jpg')",
          backgroundAttachment: "fixed"
        }}
        aria-hidden="true"
      />
      
      <div className="container mx-auto px-4 relative z-10">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-[#2c5530] flex items-center gap-2">
              <Trophy className="h-7 w-7 text-[#e76f51]" />
              Environmental Challenges
            </h1>
            <p className="text-[#5a7d61] mt-2">Complete challenges to earn XP and unlock achievements</p>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="flex items-center bg-[#e9f0e6] rounded-full p-1">
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setViewMode('list')} 
                className={`rounded-full p-2 ${viewMode === 'list' ? 'bg-[#2c5530] text-white' : 'text-[#2c5530]'}`}
              >
                <List className="h-4 w-4" />
              </Button>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setViewMode('grid')} 
                className={`rounded-full p-2 ${viewMode === 'grid' ? 'bg-[#2c5530] text-white' : 'text-[#2c5530]'}`}
              >
                <LayoutGrid className="h-4 w-4" />
              </Button>
            </div>
            
            {(user?.roles?.includes('admin') || user?.roles?.includes('moderator')) && (
              <Link href="/admin/challenges">
                <Button variant="outline" className="flex items-center border-[#d1e0d3] text-[#2c5530] hover:bg-[#e9f0e6]">
                  <ShieldCheck className="h-4 w-4 mr-2" />
                  Review Submissions
                </Button>
              </Link>
            )}
          </div>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6">
              <TabsList className="bg-[#e9f0e6] p-1 rounded-full w-full max-w-md mx-auto flex justify-between">
                <TabsTrigger
                  value="available"
                  className="rounded-full data-[state=active]:bg-[#2c5530] data-[state=active]:text-white flex-1"
                >
                  Available
                </TabsTrigger>
                <TabsTrigger
                  value="active"
                  className="rounded-full data-[state=active]:bg-[#2c5530] data-[state=active]:text-white flex-1"
                >
                  In Progress
                </TabsTrigger>
                <TabsTrigger
                  value="completed"
                  className="rounded-full data-[state=active]:bg-[#2c5530] data-[state=active]:text-white flex-1"
                >
                  Completed
                </TabsTrigger>
              </TabsList>

              <TabsContent value="available">
                <motion.div 
                  className={viewMode === 'list' ? "grid gap-4" : "grid grid-cols-1 md:grid-cols-2 gap-4"}
                  variants={containerVariants} 
                  initial="hidden" 
                  animate="visible"
                >
                  {getFilteredChallenges(challenges.available).map((challenge) => (
                    <motion.div key={challenge.id} variants={itemVariants} whileHover={getAnimationProps({ y: -3 })}>
                      <Card className="overflow-hidden border-[#d1e0d3] hover:border-[#5a7d61] transition-all duration-300 hover:shadow-md bg-white h-full flex flex-col">
                        <CardHeader className="bg-[#f0f4e9] border-b border-[#d1e0d3] pb-4">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className="rounded-full bg-[#e9f0e6] p-2 text-[#2c5530]">
                                {getCategoryIcon(challenge.category)}
                              </div>
                              <div>
                                <CardTitle className="text-lg text-[#2c5530]">{challenge.title}</CardTitle>
                                <div className="flex gap-2 mt-1">
                                  <Badge variant="outline" className={`${getDifficultyColor(challenge.difficulty)}`}>
                                    {challenge.difficulty}
                                  </Badge>
                                  <Badge variant="outline" className="bg-[#e9f0e6] text-[#2c5530]">
                                    {getCategoryLabel(challenge.category)}
                                  </Badge>
                                </div>
                              </div>
                            </div>
                            <Badge className="bg-[#e76f51]/10 text-[#e76f51] rounded-full px-3 py-1">
                              +{challenge.exp_reward} XP
                            </Badge>
                          </div>
                        </CardHeader>
                        <CardContent className="pt-4 flex-1 flex flex-col">
                          <p className="text-[#5a7d61] mb-4 flex-1">{challenge.description}</p>
                          <div className="flex items-center justify-between mt-auto">
                            <div className="text-sm text-[#5a7d61]">
                              <strong>Requirements:</strong> {challenge.requirements}
                            </div>
                            <Button 
                              onClick={() => handleStartChallenge(challenge.id)}
                              className="bg-[#2c5530] hover:bg-[#3a6b3e] text-white"
                            >
                              Start Challenge
                              <ChevronRight className="ml-2 h-4 w-4" />
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))}
                </motion.div>
              </TabsContent>

              <TabsContent value="active">
                <motion.div 
                  className={viewMode === 'list' ? "grid gap-4" : "grid grid-cols-1 md:grid-cols-2 gap-4"}
                  variants={containerVariants} 
                  initial="hidden" 
                  animate="visible"
                >
                  {getFilteredChallenges(challenges.active).map((challenge) => (
                    <motion.div key={challenge.id} variants={itemVariants}>
                      <Card className="overflow-hidden border-[#d1e0d3] hover:shadow-md transition-all duration-300 bg-white h-full flex flex-col">
                        <CardHeader className="bg-[#f0f4e9] border-b border-[#d1e0d3] pb-4">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className="rounded-full bg-[#e9f0e6] p-2 text-[#2c5530]">
                                {getCategoryIcon(challenge.category)}
                              </div>
                              <div>
                                <CardTitle className="text-lg text-[#2c5530]">{challenge.title}</CardTitle>
                                <div className="flex gap-2 mt-1">
                                  <Badge variant="outline" className={`${getDifficultyColor(challenge.difficulty)}`}>
                                    {challenge.difficulty}
                                  </Badge>
                                  <Badge variant="outline" className="bg-[#e9f0e6] text-[#2c5530]">
                                    {getCategoryLabel(challenge.category)}
                                  </Badge>
                                </div>
                              </div>
                            </div>
                            <Badge className="bg-[#e76f51]/10 text-[#e76f51] rounded-full px-3 py-1">
                              +{challenge.exp_reward} XP
                            </Badge>
                          </div>
                        </CardHeader>
                        <CardContent className="pt-4 flex-1 flex flex-col">
                          <p className="text-[#5a7d61] mb-4 flex-1">{challenge.description}</p>
                          <div className="space-y-4">
                            <div>
                              <div className="flex justify-between text-sm mb-1">
                                <span className="text-[#2c5530] font-medium">Progress</span>
                                <span className="text-[#2c5530] font-medium">{challenge.progress || 0}%</span>
                              </div>
                              <Progress value={challenge.progress || 0} className="h-2 bg-[#d1e0d3]" />
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="text-sm text-[#5a7d61]">
                                Started {new Date(challenge.started_at!).toLocaleDateString()}
                              </span>
                              <Dialog 
                                open={openDialogId === challenge.id} 
                                onOpenChange={(open) => {
                                  if (open) {
                                    setSelectedChallenge(challenge)
                                    setOpenDialogId(challenge.id)
                                  } else {
                                    setOpenDialogId(null)
                                    setSelectedChallenge(null)
                                  }
                                }}
                              >
                                <DialogTrigger asChild>
                                  <Button 
                                    onClick={() => {
                                      setSelectedChallenge(challenge)
                                      setOpenDialogId(challenge.id)
                                    }}
                                    className="bg-[#e76f51] hover:bg-[#e25b3a] text-white"
                                  >
                                    Submit Proof
                                  </Button>
                                </DialogTrigger>
                                <DialogContent className="bg-white border-[#d1e0d3]">
                                  <DialogHeader>
                                    <DialogTitle className="text-[#2c5530]">Submit Challenge Proof</DialogTitle>
                                    <DialogDescription className="text-[#5a7d61]">
                                      Provide proof of how you completed this challenge. Your submission will be reviewed by a moderator.
                                    </DialogDescription>
                                  </DialogHeader>
                                  {selectedChallenge && (
                                    <SubmitChallengeForm
                                      challengeId={selectedChallenge.id}
                                      onSubmitSuccess={handleSubmitSuccess}
                                    />
                                  )}
                                </DialogContent>
                              </Dialog>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))}
                </motion.div>
              </TabsContent>

              <TabsContent value="completed">
                <motion.div 
                  className={viewMode === 'list' ? "grid gap-4" : "grid grid-cols-1 md:grid-cols-2 gap-4"}
                  variants={containerVariants} 
                  initial="hidden" 
                  animate="visible"
                >
                  {getFilteredChallenges(challenges.completed).map((challenge) => (
                    <motion.div key={challenge.id} variants={itemVariants}>
                      <Card className="overflow-hidden border-[#d1e0d3] bg-white border-l-4 border-l-[#e76f51] h-full flex flex-col">
                        <CardHeader className="bg-[#f0f4e9] border-b border-[#d1e0d3] pb-4">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className="rounded-full bg-[#e9f0e6] p-2 text-[#2c5530]">
                                {getCategoryIcon(challenge.category)}
                              </div>
                              <div>
                                <CardTitle className="text-lg text-[#2c5530]">{challenge.title}</CardTitle>
                                <div className="flex gap-2 mt-1">
                                  <Badge variant="outline" className={`${getDifficultyColor(challenge.difficulty)}`}>
                                    {challenge.difficulty}
                                  </Badge>
                                  <Badge variant="outline" className="bg-[#e9f0e6] text-[#2c5530]">
                                    {getCategoryLabel(challenge.category)}
                                  </Badge>
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <Trophy className="h-5 w-5 text-[#e76f51]" />
                              <span className="text-sm text-[#5a7d61]">
                                Completed on {new Date(challenge.completed_at!).toLocaleDateString()}
                              </span>
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent className="pt-4 flex-1 flex flex-col">
                          <p className="text-[#5a7d61]">{challenge.description}</p>
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))}
                </motion.div>
              </TabsContent>
            </Tabs>
          </div>

          {/* Sidebar */}
          <div>
            {/* Leaderboard */}
            <Card className="border-[#d1e0d3] bg-white overflow-hidden">
              <CardHeader className="bg-[#f0f4e9] border-b border-[#d1e0d3]">
                <CardTitle className="flex items-center text-[#2c5530]">
                  <Trophy className="mr-2 h-5 w-5 text-[#e76f51]" />
                  Leaderboard
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4">
                <div className="space-y-3">
                  {leaderboard.map((entry, index) => (
                    <motion.div
                      key={entry.username}
                      whileHover={getAnimationProps({ x: 5 })}
                      className="flex items-center justify-between p-3 rounded-lg bg-[#f8f9f3] border border-[#d1e0d3]"
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center 
                          ${index === 0 ? 'bg-yellow-100 text-yellow-700' : 
                            index === 1 ? 'bg-gray-100 text-gray-700' : 
                            index === 2 ? 'bg-amber-100 text-amber-700' : 
                            'bg-[#e9f0e6] text-[#2c5530]'}`}>
                          {index + 1}
                        </div>
                        <div>
                          <p className="font-medium text-[#2c5530]">{entry.username}</p>
                          <p className="text-xs text-[#5a7d61]">
                            {entry.completed_challenges} challenge{entry.completed_challenges !== 1 ? 's' : ''} completed
                          </p>
                        </div>
                      </div>
                      <span className="text-[#e76f51] font-medium bg-[#e76f51]/10 px-2 py-1 rounded-full text-sm">
                        {entry.total_exp} XP
                      </span>
                    </motion.div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Difficulty Filter Panel */}
            <Card className="border-[#d1e0d3] bg-white mt-6 overflow-hidden">
              <CardHeader className="bg-[#f0f4e9] border-b border-[#d1e0d3]">
                <CardTitle className="flex items-center text-[#2c5530]">
                  <Filter className="mr-2 h-5 w-5 text-[#e76f51]" />
                  Filter by Difficulty
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4">
                <div className="space-y-2">
                  <Button
                    onClick={() => setSelectedDifficulty('all')}
                    variant="ghost"
                    className={`w-full justify-start rounded-lg p-3 text-left ${
                      selectedDifficulty === 'all' 
                        ? 'bg-[#2c5530] text-white' 
                        : 'hover:bg-[#e9f0e6] text-[#2c5530]'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="rounded-full bg-[#e9f0e6] p-2 text-[#2c5530]">
                        <Filter className="h-4 w-4" />
                      </div>
                      <div>
                        <p className={`font-medium ${selectedDifficulty === 'all' ? 'text-white' : 'text-[#2c5530]'}`}>
                          All Difficulties
                        </p>
                      </div>
                    </div>
                  </Button>
                  
                  <Button
                    onClick={() => setSelectedDifficulty('easy')}
                    variant="ghost"
                    className={`w-full justify-start rounded-lg p-3 text-left ${
                      selectedDifficulty === 'easy' 
                        ? 'bg-[#2c5530] text-white' 
                        : 'hover:bg-[#e9f0e6] text-[#2c5530]'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="rounded-full bg-green-100 p-2 text-green-700">
                        <Leaf className="h-4 w-4" />
                      </div>
                      <div>
                        <p className={`font-medium ${selectedDifficulty === 'easy' ? 'text-white' : 'text-[#2c5530]'}`}>
                          Easy
                        </p>
                        <p className={`text-xs ${selectedDifficulty === 'easy' ? 'text-white/80' : 'text-[#5a7d61]'}`}>
                          Beginner-friendly challenges
                        </p>
                      </div>
                    </div>
                  </Button>
                  
                  <Button
                    onClick={() => setSelectedDifficulty('medium')}
                    variant="ghost"
                    className={`w-full justify-start rounded-lg p-3 text-left ${
                      selectedDifficulty === 'medium' 
                        ? 'bg-[#2c5530] text-white' 
                        : 'hover:bg-[#e9f0e6] text-[#2c5530]'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="rounded-full bg-yellow-100 p-2 text-yellow-700">
                        <Target className="h-4 w-4" />
                      </div>
                      <div>
                        <p className={`font-medium ${selectedDifficulty === 'medium' ? 'text-white' : 'text-[#2c5530]'}`}>
                          Medium
                        </p>
                        <p className={`text-xs ${selectedDifficulty === 'medium' ? 'text-white/80' : 'text-[#5a7d61]'}`}>
                          Moderate complexity and effort
                        </p>
                      </div>
                    </div>
                  </Button>
                  
                  <Button
                    onClick={() => setSelectedDifficulty('hard')}
                    variant="ghost"
                    className={`w-full justify-start rounded-lg p-3 text-left ${
                      selectedDifficulty === 'hard' 
                        ? 'bg-[#2c5530] text-white' 
                        : 'hover:bg-[#e9f0e6] text-[#2c5530]'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="rounded-full bg-orange-100 p-2 text-orange-700">
                        <Award className="h-4 w-4" />
                      </div>
                      <div>
                        <p className={`font-medium ${selectedDifficulty === 'hard' ? 'text-white' : 'text-[#2c5530]'}`}>
                          Hard
                        </p>
                        <p className={`text-xs ${selectedDifficulty === 'hard' ? 'text-white/80' : 'text-[#5a7d61]'}`}>
                          Challenging tasks for committed users
                        </p>
                      </div>
                    </div>
                  </Button>
                  
                  <Button
                    onClick={() => setSelectedDifficulty('expert')}
                    variant="ghost"
                    className={`w-full justify-start rounded-lg p-3 text-left ${
                      selectedDifficulty === 'expert' 
                        ? 'bg-[#2c5530] text-white' 
                        : 'hover:bg-[#e9f0e6] text-[#2c5530]'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="rounded-full bg-red-100 p-2 text-red-700">
                        <Trophy className="h-4 w-4" />
                      </div>
                      <div>
                        <p className={`font-medium ${selectedDifficulty === 'expert' ? 'text-white' : 'text-[#2c5530]'}`}>
                          Expert
                        </p>
                        <p className={`text-xs ${selectedDifficulty === 'expert' ? 'text-white/80' : 'text-[#5a7d61]'}`}>
                          Elite challenges with highest rewards
                        </p>
                      </div>
                    </div>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
} 