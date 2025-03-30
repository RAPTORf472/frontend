"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  Search,
  Play,
  BookOpen,
  Clock,
  TreePine,
  Filter,
  ChevronRight,
  FileText,
  Leaf,
  Globe,
  BookMarked,
  Video,
  GraduationCap,
  Lightbulb,
  Users,
  Calendar,
  Heart,
  Bookmark,
  Edit,
  User,
  MessageSquare,
  Trash2,
  Film,
  Mic,
  Newspaper,
  Microscope,
  Sprout,
  Wrench,
  Shield,
  Star,
  Zap,
  Eye,
  Thermometer,
} from "lucide-react"
import Link from "next/link"
import { useAuth } from "@/contexts/auth-context"
import { AdminControls } from "@/components/admin-controls"
import { Spinner } from "@/components/ui/spinner"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useMediaQuery } from "@/hooks/use-media-query"
import { cn } from "@/lib/utils"
import { FeaturedContent } from "@/components/learning/FeaturedContent"
import { Material } from "@/types/learning"

interface Category {
  id: number
  title: string
  slug: string
  description: string
  icon_name: string
  material_count: number
  content_type: string
}

// Add a helper function to limit excerpt to 50 words at the top of the file, after the imports
function limitExcerptToWords(excerpt: string, letterLimit: number = 50): string {
  if (!excerpt) return '';
  
  // Limit to characters instead of words
  if (excerpt.length <= letterLimit) return excerpt;
  
  // Look for a space near the limit to make a clean cut
  const cutOffPoint = excerpt.lastIndexOf(' ', letterLimit);
  return excerpt.substring(0, cutOffPoint > 0 ? cutOffPoint : letterLimit) + '...';
}

export function LearningPageContent() {
  const [searchQuery, setSearchQuery] = useState("")
  const [activeTab, setActiveTab] = useState<string>('all')
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false)
  const [allMaterials, setAllMaterials] = useState<Material[]>([])
  const [filteredMaterials, setFilteredMaterials] = useState<Material[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [allCategories, setAllCategories] = useState<Category[]>([])
  const [filteredCategories, setFilteredCategories] = useState<Category[]>([])
  const { user } = useAuth()
  const isDesktop = useMediaQuery("(min-width: 1024px)")
  
  const MaterialCountMap: { [key: string]: number } = {
    'video': 0,
    'article': 0,
    'wiki': 0,
    'community': 0
  }
  

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)")
    setPrefersReducedMotion(mediaQuery.matches)

    const handleChange = () => setPrefersReducedMotion(mediaQuery.matches)
    mediaQuery.addEventListener("change", handleChange)
    return () => mediaQuery.removeEventListener("change", handleChange)
  }, [])

  // Fetch all materials and categories once when component mounts
  useEffect(() => {
    const fetchInitialData = async () => {
      setIsLoading(true)
      setError(null)
      
      try {
        // Fetch materials
        const token = localStorage.getItem('token')
        const materialsResponse = await fetch('/api/learning/materials', {
          headers: {
            'Authorization': token ? `Bearer ${token}` : ''
          }
        })

        const materialsData = await materialsResponse.json()
        
        if (!materialsResponse.ok) {
          throw new Error(materialsData.message || 'Failed to fetch materials')
        }

        if (!materialsData.materials || !Array.isArray(materialsData.materials)) {
          throw new Error('Invalid response format')
        }

        setAllMaterials(materialsData.materials)
        setFilteredMaterials(materialsData.materials)

        // Fetch all categories
        const categoriesResponse = await fetch('/api/learning/categories')
        const categoriesData = await categoriesResponse.json()

        if (!categoriesResponse.ok) {
          throw new Error(categoriesData.message || 'Failed to fetch categories')
        }

        setAllCategories(categoriesData.categories || [])
        setFilteredCategories([]) // Start with empty filtered categories for 'all' tab
      } catch (error) {
        console.error('Error fetching data:', error)
        setError(error instanceof Error ? error.message : 'Failed to load data')
        setAllMaterials([])
        setFilteredMaterials([])
        setAllCategories([])
        setFilteredCategories([])
      } finally {
        setIsLoading(false)
      }
    }


    fetchInitialData()

  }, [])

  // Filter categories when tab changes
  useEffect(() => {
    if (activeTab === 'all') {
      setFilteredCategories([])
      return
    }

    const contentTypeMap: { [key: string]: string } = {
      'videos': 'video',
      'articles': 'article',
      'wiki': 'wiki',
      'community': 'community'
    }

    const contentType = contentTypeMap[activeTab]
    const filtered = allCategories.filter(c => 
      c.content_type === 'general' || c.content_type === contentType
    )
    setFilteredCategories(filtered)
  }, [activeTab, allCategories])

  // Filter materials when tab, category, or search query changes
  useEffect(() => {
    let filtered = [...allMaterials]
    
    // Filter by tab
    if (activeTab !== 'all') {
      const contentTypeMap: { [key: string]: string } = {
        'videos': 'video',
        'articles': 'article',
        'wiki': 'wiki',
        'community': 'community'
      }
      const contentType = contentTypeMap[activeTab]
      filtered = filtered.filter(m => m.type === contentType)
    }
    
    // Filter by category
    if (selectedCategory) {
      filtered = filtered.filter(m => m.category_title === selectedCategory)
    }
    
    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(m => 
        m.title.toLowerCase().includes(query) || 
        m.excerpt.toLowerCase().includes(query)
      )
    }
    
    setFilteredMaterials(filtered)
  }, [activeTab, selectedCategory, searchQuery, allMaterials])

  const handleTabChange = (tab: string) => {
    setActiveTab(tab)
    setSelectedCategory(null)
  }

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value)
  }

  const getCategoryIcon = (iconName: string | undefined | null) => {
    if (!iconName) return BookOpen

    switch (iconName.toLowerCase()) {
      // General categories
      case 'treepine':
        return TreePine
      case 'leaf':
        return Leaf
      case 'zap':
        return Zap

      
      // Video categories
      case 'play':
        return Play
      case 'film':
        return Film
      case 'mic':
        return Mic
      
      // Article categories
      case 'newspaper':
        return Newspaper
      case 'bookmarked':
        return BookMarked
      case 'microscope':
        return Microscope
      
      // Wiki categories
      case 'sprout':
        return Sprout
      case 'wrench':
        return Wrench
      case 'globe':
        return Globe
      case 'shield':
        return Shield
      case 'video':
        return Video
      // Community categories
      case 'star':
        return Star
      case 'users':
        return Users
      case 'lightbulb':
        return Lightbulb
      case 'messagesquare':
        return MessageSquare
      case 'thermometer':
        return Thermometer
      // Default fallback
      default:
        console.warn(`Icon name not found: ${iconName}`)
        return BookOpen
    }
  }

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: prefersReducedMotion ? 0 : 0.1,
        duration: prefersReducedMotion ? 0 : 0.3,
      },
    },
  }

  const itemVariants = {
    hidden: { opacity: 0, y: prefersReducedMotion ? 0 : 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: prefersReducedMotion ? 0 : 0.5 },
    },
  }

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this item?')) {
      return
    }

    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`/api/learning/materials/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': token ? `Bearer ${token}` : ''
        }
      })

      if (!response.ok) {
        throw new Error('Failed to delete item')
      }

      // Remove the deleted item from the state
      setFilteredMaterials(filteredMaterials.filter(m => m.id !== id))
    } catch (error) {
      console.error('Error deleting item:', error)
      alert('Failed to delete item')
    }
  }

  const canEdit = (material: Material) => {
    if (!user) return false
    const isAdmin = user.roles.includes('admin')
    const isModerator = user.roles.includes('moderator')
    const isOwner = material.author_id === user.id
    return isAdmin || isModerator || (isOwner && material.type === 'community')
  }

  const canDelete = (material: Material) => {
    if (!user) return false
    const isAdmin = user.roles.includes('admin')
    const isOwner = material.author_id === user.id
    return isAdmin || (isOwner && material.type === 'community')
  }

  const canCreate = () => {
    return Boolean(user?.roles?.some(role => ['admin', 'moderator'].includes(role)))
  }

  const videos = filteredMaterials.filter(m => m.type === 'video')
  const articles = filteredMaterials.filter(m => m.type === 'article')
  const wikiArticles = filteredMaterials.filter(m => m.type === 'wiki')
  const communityArticles = filteredMaterials.filter(m => m.type === 'community')

  allMaterials.forEach((material: Material) => {
    MaterialCountMap[material.type]++
  })

  const renderAdminControls = (material: Material) => {
    if (!canEdit(material) && !canDelete(material)) return null

    return (
      <div 
        className="absolute top-2 right-2 z-10 flex gap-2 bg-white/80 backdrop-blur-sm rounded-lg p-1"
        onClick={(e) => e.stopPropagation()}
      >
        {canEdit(material) && (
          <Button 
            size="sm" 
            variant="ghost" 
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              window.location.href = `/learning/${material.type}/${material.id}/edit`;
            }}
          >
            <Edit className="h-4 w-4" />
          </Button>
        )}
        {canDelete(material) && (
          <Button 
            size="sm" 
            variant="ghost" 
            className="text-red-500 hover:text-red-700"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              handleDelete(material.id);
            }}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        )}
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Spinner size="lg" className="text-green-600" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    )
  }
    
  return (
    <div className="min-h-screen bg-[#f8f9f3]">
      {/* Header Section */}
      <section className="relative bg-[#2c5530] py-16">
        <div className="container px-4">
          <div className="mx-auto max-w-2xl text-center text-white">
            <motion.h1
              className="text-4xl font-bold tracking-tight sm:text-5xl"
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              Learning Resources
            </motion.h1>
            <motion.p
              className="mt-4 text-xl text-green-100"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2, duration: 0.5 }}
            >
              Discover everything you need to know about tree planting and environmental conservation.
            </motion.p>
          </div>
        </div>
        <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-b from-transparent to-[#f8f9f3]" />
      </section>

      {/* Search Bar */}
      <div className="sticky top-16 z-10 bg-[#f8f9f3] pt-4 pb-2">
        <div className="container px-4">
          <div className="flex flex-wrap items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <Input
                placeholder="Search resources..."
                value={searchQuery}
                onChange={handleSearch}
                className="pl-10 border-none bg-white shadow-sm"
              />
            </div>
            <Button
              variant="outline"
              className="flex items-center gap-2 bg-white border-none shadow-sm hover:bg-[#e8f2e8]"
            >
              <Filter className="h-4 w-4" />
              Filter
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="container px-4 py-8">
        <div className="grid gap-8 lg:grid-cols-[240px_1fr_300px]">
          {/* Left Sidebar */}
          {isDesktop && (
            <motion.aside
              className="space-y-6"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
            >
              {/* Categories Panel - Only show when not in 'all' tab */}
              {activeTab !== 'all' && (
                <Card className="bg-white border-none shadow-sm">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-[#2c5530]">Categories</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-1 p-3">
                    <Button
                      variant="ghost"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !selectedCategory && "bg-[#e8f2e8] text-[#2c5530] font-medium",
                      )}
                      onClick={() => setSelectedCategory(null)}
                    >
                      <GraduationCap className="mr-2 h-4 w-4" />
                      All Resources
                    </Button>
                    {isLoading ? (
                      <div className="space-y-2 animate-pulse">
                        {[1, 2, 3, 4].map((i) => (
                          <div key={i} className="h-10 bg-gray-100 rounded-md" />
                        ))}
                      </div>
                    ) : (
                      filteredCategories.map((category) => {
                        const Icon = getCategoryIcon(category?.icon_name)
                        return (
                          <Button
                            key={category?.id}
                            variant="ghost"
                            className={cn(
                              "w-full justify-start text-left font-normal",
                              selectedCategory === category?.title && "bg-[#e8f2e8] text-[#2c5530] font-medium",
                            )}
                            onClick={() => setSelectedCategory(category?.title)}
                          >
                            <Icon className="mr-2 h-4 w-4" />
                            {category?.title || 'Unnamed Category'}
                          </Button>
                        )
                      })
                    )}
                  </CardContent>
                </Card>
              )}

              {/* Quick Stats Panel - Always show */}
              <Card className="bg-white border-none shadow-sm">
                <CardHeader className="pb-2">
                  <CardTitle className="text-[#2c5530]">Quick Stats</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 p-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Videos</span>
                    <Badge variant="outline" className="bg-[#e8f2e8] text-[#2c5530]">
                      {MaterialCountMap['video']}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Articles</span>
                    <Badge variant="outline" className="bg-[#e8f2e8] text-[#2c5530]">
                      {MaterialCountMap['article']}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Wiki Topics</span>
                    <Badge variant="outline" className="bg-[#e8f2e8] text-[#2c5530]">
                      {MaterialCountMap['wiki']}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Community Posts</span>
                    <Badge variant="outline" className="bg-[#e8f2e8] text-[#2c5530]">
                      {MaterialCountMap['community']}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            </motion.aside>
          )}

          {/* Main Content Area */}
          <div className="space-y-6">
            {/* Content Tabs */}
            <Tabs defaultValue="all" value={activeTab} onValueChange={handleTabChange} className="space-y-6">
              <TabsList className="bg-white p-1 shadow-sm rounded-full w-fit">
                <TabsTrigger
                  value="all"
                  className="rounded-full data-[state=active]:bg-[#2c5530] data-[state=active]:text-white"
                >
                  All
                </TabsTrigger>
                <TabsTrigger
                  value="videos"
                  className="rounded-full data-[state=active]:bg-[#2c5530] data-[state=active]:text-white"
                >
                  Videos
                </TabsTrigger>
                <TabsTrigger
                  value="articles"
                  className="rounded-full data-[state=active]:bg-[#2c5530] data-[state=active]:text-white"
                >
                  Articles
                </TabsTrigger>
                <TabsTrigger
                  value="wiki"
                  className="rounded-full data-[state=active]:bg-[#2c5530] data-[state=active]:text-white"
                >
                  Wiki
                </TabsTrigger>
                <TabsTrigger
                  value="community"
                  className="rounded-full data-[state=active]:bg-[#2c5530] data-[state=active]:text-white"
                >
                  Community
                </TabsTrigger>
              </TabsList>

              {/* All Content Tab */}
              <TabsContent value="all" className="space-y-8 mt-6">
                {/* Featured Content */}
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5 }}>
                  <h2 className="text-xl font-semibold mb-4 text-[#2c5530]">Featured Content</h2>
                  <FeaturedContent />
                </motion.div>

                {/* Featured Videos */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                  {videos.slice(0, 4).map((video) => (
                    <div key={video.id} className="relative">
                      {renderAdminControls(video)}
                      <Link href={`/learning/video/${video.id}`} className="block">
                        <Card className="overflow-hidden border-none shadow-sm hover:shadow transition-shadow duration-200">
                          <div className="aspect-video relative">
                            <img
                              src={video.thumbnail_url || "https://via.placeholder.com/300x200"}
                              alt={video.title}
                              className="object-cover w-full h-full"
                            />
                            <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                              <div className="rounded-full bg-white p-2">
                                <Play className="h-4 w-4 text-[#2c5530]" />
                              </div>
                            </div>
                            <div className="absolute bottom-2 right-2 bg-black/60 text-white text-xs px-2 py-1 rounded">
                              {video.duration}
                            </div>
                          </div>
                          <CardContent className="p-3">
                            <h3 className="font-medium text-sm line-clamp-2">{video.title}</h3>
                            <div className="flex items-center justify-between mt-2 text-xs text-gray-500">
                              <div className="flex items-center gap-1">
                                <Eye className="h-3 w-3" />
                                <span>{video.views_count}</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <Heart className="h-3 w-3" />
                                <span>{video.likes_count}</span>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      </Link>
                    </div>
                  ))}
                </div>

                {/* Recent Videos */}
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-semibold text-[#2c5530]">Recent Videos</h2>

                  </div>
                  <motion.div
                    className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3"
                    variants={containerVariants}
                    initial="hidden"
                    animate="visible"
                  >
                    {videos.slice(0, 3).map((video) => (
                      <motion.div key={video.id} variants={itemVariants} className="relative">
                        {renderAdminControls(video)}
                        <Link href={`/learning/video/${video.id}`} className="block">
                          <Card className="overflow-hidden group border-none shadow-sm hover:shadow-md transition-shadow duration-300">
                            <div className="aspect-video relative">
                              <img
                                src={video.thumbnail_url || "/placeholder.svg?height=200&width=300"}
                                alt={video.title}
                                className="absolute inset-0 h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                              />
                              <div className="absolute inset-0 flex items-center justify-center bg-black/20 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                                <div className="rounded-full bg-white p-2">
                                  <Play className="h-6 w-6 text-[#2c5530]" />
                                </div>
                              </div>
                              <Badge className="absolute top-2 left-2 bg-[#2c5530] text-white">{video.category_title}</Badge>
                              <div className="absolute bottom-2 right-2 bg-black/60 text-white text-xs px-2 py-1 rounded-md backdrop-blur-sm">
                                {video.duration}
                              </div>
                            </div>
                            <CardContent className="p-4">
                              <h3 className="font-semibold group-hover:text-[#2c5530] transition-colors duration-300">
                                {video.title}
                              </h3>
                              <p className="mt-1 text-sm text-gray-600 line-clamp-2">{limitExcerptToWords(video.excerpt)}</p>
                            </CardContent>
                            <CardFooter className="border-t p-4 flex items-center justify-between">
                              <div className="flex items-center gap-2 text-sm text-gray-500">
                                <Clock className="h-4 w-4" />
                                <span>{video.duration}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <div className="flex items-center gap-1 text-gray-500">
                                  <Heart className="h-4 w-4" />
                                  <span>{video.likes_count}</span>
                                </div>
                                <div className="flex items-center gap-1 text-gray-500">
                                  <Eye className="h-4 w-4" />
                                  <span>{video.views_count}</span>
                                </div>
                              </div>
                            </CardFooter>
                          </Card>
                        </Link>
                      </motion.div>
                    ))}
                  </motion.div>
                </div>

                {/* Recent Articles */}
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-semibold text-[#2c5530]">Recent Articles</h2>

                  </div>
                  <motion.div
                    className="grid gap-6 md:grid-cols-2"
                    variants={containerVariants}
                    initial="hidden"
                    animate="visible"
                  >
                    {articles.slice(0, 2).map((article) => (
                      <motion.div key={article.id} variants={itemVariants} className="relative">
                        {renderAdminControls(article)}
                        <Link href={`/learning/article/${article.id}`} className="block">
                          <Card className="overflow-hidden group border-none shadow-sm hover:shadow-md transition-shadow duration-300">
                            <div className="grid gap-6 md:grid-cols-[2fr_1fr]">
                              <CardContent className="p-6">
                                <Badge className="mb-2 bg-[#e8f2e8] text-[#2c5530]">{article.category_title}</Badge>
                                <h3 className="text-xl font-bold group-hover:text-[#2c5530] transition-colors duration-300">
                                  {article.title}
                                </h3>
                                <p className="mt-2 text-gray-600 line-clamp-3">{limitExcerptToWords(article.excerpt)}</p>
                                <div className="mt-4 flex items-center gap-4">
                                  <div className="flex items-center gap-2">
                                    <Avatar className="h-8 w-8">
                                      <AvatarImage
                                        src={article.author_avatar_url || "/placeholder.svg?height=32&width=32"}
                                        alt={article.author_name}
                                      />
                                      <AvatarFallback>{article.author_name[0]}</AvatarFallback>
                                    </Avatar>
                                    <span className="text-sm font-medium">{article.author_name}</span>
                                  </div>
                                  <span className="text-sm text-gray-500">{article.duration || article.duration}</span>
                                </div>
                              </CardContent>
                              <div className="relative">
                                <img
                                  src={article.thumbnail_url || "/placeholder.svg?height=200&width=300"}
                                  alt={article.title}
                                  className="absolute inset-0 h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                                />
                              </div>
                            </div>
                          </Card>
                        </Link>
                      </motion.div>
                    ))}
                  </motion.div>
                </div>

                {/* Wiki Categories */}
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-semibold text-[#2c5530]">Knowledge Base</h2>

                  </div>
                  <motion.div
                    className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3"
                    variants={containerVariants}
                    initial="hidden"
                    animate="visible"
                  >
                    {wikiArticles.slice(0, 3).map((wiki) => (
                      <motion.div key={wiki.id} variants={itemVariants} className="relative">
                        {renderAdminControls(wiki)}
                        <Link href={`/learning/wiki/${wiki.id}`} className="block">
                          <Card className="group cursor-pointer border-none shadow-sm hover:shadow-md transition-all duration-300">
                            <CardHeader>
                              <div className="flex items-center gap-4">
                                <div className="rounded-full bg-[#e8f2e8] p-3 transition-colors duration-300 group-hover:bg-[#2c5530]">
                                  <BookOpen className="h-6 w-6 text-[#2c5530] transition-colors duration-300 group-hover:text-white" />
                                </div>
                                <CardTitle className="group-hover:text-[#2c5530] transition-colors duration-300">
                                  {wiki.title}
                                </CardTitle>
                              </div>
                            </CardHeader>
                            <CardContent>
                              <p className="text-gray-600">{limitExcerptToWords(wiki.excerpt)}</p>
                            </CardContent>
                            <CardFooter className="border-t">

                            </CardFooter>
                          </Card>
                        </Link>
                      </motion.div>
                    ))}
                  </motion.div>
                </div>
              </TabsContent>

              {/* Other tab contents */}
              <TabsContent value="videos" className="space-y-8 mt-6">
                <AnimatePresence mode="wait">
                  <motion.div
                    key="videos"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.5 }}
                  >
                    <div className="flex items-center justify-between mb-6">
                      <h2 className="text-xl font-semibold text-[#2c5530]">Videos</h2>
                      {/* Admin-only button to create new videos */}
                      {user?.roles?.includes('admin') && (
                        <Button className="bg-[#2c5530] hover:bg-[#1a3a1a] text-white" asChild>
                          <Link href="/learning/video/create">
                            <Edit className="mr-2 h-4 w-4" />
                            Create New Video
                          </Link>
                        </Button>
                      )}
                    </div>

                    <motion.div
                      className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mt-6"
                      variants={containerVariants}
                      initial="hidden"
                      animate="visible"
                    >
                      {videos.map((video) => (
                        <div key={video.id} className="relative">
                          {renderAdminControls(video)}
                          <Link href={`/learning/video/${video.id}`} className="block">
                            <Card className="overflow-hidden h-full border-none shadow-sm hover:shadow transition-shadow duration-200">
                              <div className="relative aspect-video">
                                <img
                                  src={video.thumbnail_url || "https://via.placeholder.com/600x400"}
                                  alt={video.title}
                                  className="object-cover w-full h-full"
                                />
                                <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                                  <div className="rounded-full bg-white p-3">
                                    <Play className="h-6 w-6 text-[#2c5530]" />
                                  </div>
                                </div>
                              </div>
                              <CardContent className="p-4">
                                <Badge
                                  variant="outline"
                                  className="bg-blue-50 text-blue-700 mb-2"
                                >
                                  Video
                                </Badge>
                                <h3 className="font-medium mb-2 line-clamp-2">{video.title}</h3>
                                <p className="text-sm text-gray-600 line-clamp-2">{limitExcerptToWords(video.excerpt)}</p>
                                <div className="flex items-center justify-between mt-4 text-xs text-gray-500">
                                  <div className="flex items-center gap-1">
                                    <Clock className="h-3 w-3" />
                                    <span>{video.duration || "10 min"}</span>
                                  </div>
                                  <div className="flex items-center gap-3">
                                    <div className="flex items-center gap-1">
                                      <Eye className="h-3 w-3" />
                                      <span>{video.views_count}</span>
                                    </div>
                                    <div className="flex items-center gap-1">
                                      <Heart className="h-3 w-3" />
                                      <span>{video.likes_count}</span>
                                    </div>
                                  </div>
                                </div>
                              </CardContent>
                            </Card>
                          </Link>
                        </div>
                      ))}
                    </motion.div>
                  </motion.div>
                </AnimatePresence>
              </TabsContent>

              {/* Articles Tab */}
              <TabsContent value="articles" className="space-y-8 mt-6">
                <AnimatePresence mode="wait">
                  <motion.div
                    key="articles"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.5 }}
                  >
                    <div className="flex items-center justify-between mb-6">
                      <h2 className="text-xl font-semibold text-[#2c5530]">Articles</h2>
                      {/* Admin-only button to create new articles */}
                      {user?.roles?.includes('admin') && (
                        <Button className="bg-[#2c5530] hover:bg-[#1a3a1a] text-white" asChild>
                          <Link href="/learning/article/create">
                            <Edit className="mr-2 h-4 w-4" />
                            Create New Article
                          </Link>
                        </Button>
                      )}
                    </div>

                    <motion.div
                      className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6"
                      variants={containerVariants}
                      initial="hidden"
                      animate="visible"
                    >
                      {articles.map((article) => (
                        <div key={article.id} className="relative">
                          {renderAdminControls(article)}
                          <Link href={`/learning/article/${article.id}`} className="block">
                            <Card className="overflow-hidden h-full flex flex-col border-none shadow-sm hover:shadow transition-shadow duration-200">
                              {article.thumbnail_url && (
                                <div className="relative h-48">
                                  <img
                                    src={article.thumbnail_url}
                                    alt={article.title}
                                    className="object-cover w-full h-full"
                                  />
                                </div>
                              )}
                              <CardContent className="p-4 flex-1 flex flex-col">
                                <div className="flex-1">
                                  <Badge
                                    variant="outline"
                                    className="bg-[#e8f2e8] text-[#2c5530] mb-2"
                                  >
                                    {article.category_title || "General"}
                                  </Badge>
                                  <h3 className="font-medium mb-2">{article.title}</h3>
                                  <p className="text-sm text-gray-600 line-clamp-3">{limitExcerptToWords(article.excerpt)}</p>
                                </div>
                                <div className="flex items-center justify-between mt-4 text-xs text-gray-500">
                                  <div className="flex items-center gap-1">
                                    <Clock className="h-3 w-3" />
                                    <span>{article.duration || "5 min read"}</span>
                                  </div>
                                  <div className="flex items-center gap-3">
                                    <div className="flex items-center gap-1">
                                      <Eye className="h-3 w-3" />
                                      <span>{article.views_count}</span>
                                    </div>
                                    <div className="flex items-center gap-1">
                                      <Heart className="h-3 w-3" />
                                      <span>{article.likes_count}</span>
                                    </div>
                                  </div>
                                </div>
                              </CardContent>
                            </Card>
                          </Link>
                        </div>
                      ))}
                    </motion.div>
                  </motion.div>
                </AnimatePresence>
              </TabsContent>

              {/* Wiki Tab */}
              <TabsContent value="wiki" className="space-y-8 mt-6">
                <AnimatePresence mode="wait">
                  <motion.div
                    key="wiki"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.5 }}
                  >
                    <div className="flex items-center justify-between mb-6">
                      <h2 className="text-xl font-semibold text-[#2c5530]">Wiki</h2>
                      {/* Admin-only button to create new wiki articles */}
                      {user?.roles?.includes('admin') && (
                        <Button className="bg-[#2c5530] hover:bg-[#1a3a1a] text-white" asChild>
                          <Link href="/learning/wiki/create">
                            <Edit className="mr-2 h-4 w-4" />
                            Create New Wiki
                          </Link>
                        </Button>
                      )}
                    </div>

                    <motion.div
                      className="mt-6"
                      variants={containerVariants}
                      initial="hidden"
                      animate="visible"
                    >
                      {wikiArticles.map((wiki) => (
                        <div key={wiki.id} className="relative mb-4">
                          {renderAdminControls(wiki)}
                          <Link href={`/learning/wiki/${wiki.id}`} className="block">
                            <Card className="overflow-hidden border-none shadow-sm hover:shadow hover:bg-[#f9fbf7] transition-all duration-200">
                              <CardContent className="p-4">
                                <div className="flex gap-4">
                                  <div className="rounded-full bg-[#e8f2e8] p-3 h-fit">
                                    <BookOpen className="h-5 w-5 text-[#2c5530]" />
                                  </div>
                                  <div>
                                    <h3 className="font-medium mb-1">{wiki.title}</h3>
                                    <p className="text-sm text-gray-600 line-clamp-2">{limitExcerptToWords(wiki.excerpt)}</p>
                                    <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                                      <Badge
                                        variant="outline"
                                        className="bg-[#e8f2e8] text-[#2c5530]"
                                      >
                                        {wiki.category_title || "General"}
                                      </Badge>
                                      <div className="flex items-center gap-1">
                                        <Clock className="h-3 w-3" />
                                        <span>Updated recently</span>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              </CardContent>
                            </Card>
                          </Link>
                        </div>
                      ))}
                    </motion.div>
                  </motion.div>
                </AnimatePresence>
              </TabsContent>

              {/* Community Tab */}
              <TabsContent value="community" className="space-y-8 mt-6">
                <AnimatePresence mode="wait">
                  <motion.div
                    key="community"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.5 }}
                  >
                    <div className="flex items-center justify-between mb-6">
                      <h2 className="text-xl font-semibold text-[#2c5530]">Community Knowledge Base</h2>
                      {user && (
                        <Button className="bg-[#e76f51] hover:bg-[#e76f51]/90" asChild>
                          <Link href="/learning/community/create">
                            <Edit className="mr-2 h-4 w-4" />
                            Create Community Content
                          </Link>
                        </Button>
                      )}
                    </div>

                    <div className="grid gap-8 md:grid-cols-[2fr_1fr]">
                      <div className="space-y-6">
                        {/* Recently Updated Articles */}
                        <Card className="border-none shadow-sm">
                          <CardHeader>
                            <CardTitle className="text-[#2c5530]">Recently Updated Articles</CardTitle>
                          </CardHeader>
                          <CardContent className="p-4">
                            <div className="space-y-4">
                              {communityArticles.slice(0, 5).map((article) => (
                                <div key={article.id} className="relative">
                                  <Link href={`/learning/community/${article.id}`} className="block group cursor-pointer">
                                    <div className="flex items-start gap-4">
                                      <div className="rounded-full bg-[#e8f2e8] p-2 mt-1">
                                        <BookOpen className="h-4 w-4 text-[#2c5530]" />
                                      </div>
                                      <div className="flex-1">
                                        <h3 className="font-medium group-hover:text-[#2c5530]">{article.title}</h3>
                                        <p className="text-sm text-gray-600 line-clamp-2">{limitExcerptToWords(article.excerpt)}</p>
                                        <div className="mt-2 flex items-center gap-4 text-xs text-gray-500">
                                          <div className="flex items-center gap-1">
                                            <Clock className="h-3 w-3" />
                                            <span>Updated recently</span>
                                          </div>
                                          <div className="flex items-center gap-1">
                                            <User className="h-3 w-3" />
                                            <span>by {article.author_name}</span>
                                          </div>
                                          <Badge variant="outline" className="text-xs bg-[#e8f2e8] text-[#2c5530]">
                                            {article.category_title}
                                          </Badge>
                                        </div>
                                      </div>
                                    </div>
                                  </Link>
                                  {/* Admin controls positioned absolutely */}
                                  <div className="absolute top-0 right-0">
                                    {renderAdminControls(article)}
                                  </div>
                                </div>
                              ))}
                            </div>
                            <Button variant="ghost" className="w-full mt-4 text-[#2c5530] hover:bg-[#e8f2e8]">
                              View All Recent Updates
                            </Button>
                          </CardContent>
                        </Card>
                      </div>

                      {/* Sidebar */}
                      <div className="space-y-6">
                        {/* Top Contributors */}
                        <Card className="border-none shadow-sm">
                          <CardHeader className="pb-2">
                            <CardTitle className="text-[#2c5530]">Top Contributors</CardTitle>
                          </CardHeader>
                          <CardContent className="p-4">
                            <div className="space-y-4">
                              {communityArticles.slice(0, 4).map((article) => (
                                <div key={article.id} className="relative flex items-center gap-3">
                                  <Avatar>
                                    <AvatarImage src={article.author_avatar_url || "/placeholder.svg?height=40&width=40"} />
                                    <AvatarFallback>{article.author_name[0]}</AvatarFallback>
                                  </Avatar>
                                  <div className="flex-1">
                                    <div className="font-medium">{article.author_name}</div>
                                    <div className="text-sm text-gray-500">
                                      {article.likes_count} contributions
                                    </div>
                                  </div>
                                  <Badge variant="outline" className="bg-[#e8f2e8] text-[#2c5530]">
                                    Expert
                                  </Badge>
                                </div>
                              ))}
                            </div>
                          </CardContent>
                        </Card>

                        {/* How to Contribute */}
                        <Card className="bg-gradient-to-br from-[#2c5530] to-[#1a3a1a] text-white border-none shadow-sm">
                          <CardContent className="p-4 space-y-3">
                            <div className="rounded-full bg-white/20 p-3 w-fit">
                              <Edit className="h-6 w-6" />
                            </div>
                            <h3 className="font-semibold text-lg">How to Contribute</h3>
                            <p className="text-sm text-green-100">
                              Share your knowledge with the community by creating or editing wiki articles. Every
                              contribution helps grow our collective knowledge.
                            </p>
                            <div className="grid grid-cols-1 gap-2">
                              <Button
                                variant="secondary"
                                className="w-full bg-white text-[#2c5530] hover:bg-green-50"
                              >
                                Contribution Guidelines
                              </Button>
                              {user && (
                                <Button
                                  variant="outline"
                                  className="w-full bg-white/10 text-white border-white/30 hover:bg-white/20"
                                  asChild
                                >
                                  <Link href="/learning/community/create">
                                    <Edit className="mr-2 h-4 w-4" />
                                    Share Your Knowledge
                                  </Link>
                                </Button>
                              )}
                            </div>
                          </CardContent>
                        </Card>
                      </div>
                    </div>
                  </motion.div>
                </AnimatePresence>
              </TabsContent>
            </Tabs>
          </div>

          {/* Right Sidebar */}
          {isDesktop && (
            <motion.aside
              className="space-y-6"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
            >
              {/* Popular Content */}
              <Card className="bg-white border-none shadow-sm">
                <CardHeader className="pb-2">
                  <CardTitle className="text-[#2c5530]">Popular Content</CardTitle>
                </CardHeader>
                <CardContent className="p-4">
                  <div className="space-y-4">
                    {filteredMaterials.slice(0, 4).map((item) => (
                      <div key={item.id} className="relative">
                        {/* Render admin controls here, outside of Link */}
                        {renderAdminControls(item)}
                        <Link href={`/learning/${item.type}/${item.id}`} className="block">
                          <div className="flex gap-3 group cursor-pointer">
                            <div className="relative w-20 h-20 rounded-md overflow-hidden flex-shrink-0">
                              <img
                                src={item.thumbnail_url || "/placeholder.svg?height=80&width=80"}
                                alt={item.title}
                                className="absolute inset-0 h-full w-full object-cover"
                              />
                              {item.type === "video" && (
                                <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                                  <Play className="h-4 w-4 text-white" />
                                </div>
                              )}
                            </div>
                            <div>
                              <Badge
                                variant="outline"
                                className={cn(
                                  "mb-1 text-xs",
                                  item.type === "video" ? "bg-blue-50 text-blue-700" : "bg-[#e8f2e8] text-[#2c5530]",
                                )}
                              >
                                {item.type === "video" ? "Video" : "Article"}
                              </Badge>
                              <h4 className="text-sm font-medium line-clamp-2 group-hover:text-[#2c5530]">{item.title}</h4>
                              <p className="text-xs text-gray-500 mt-1">{item.views_count} views</p>
                            </div>
                          </div>
                        </Link>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Newsletter */}
              <Card className="bg-gradient-to-br from-[#e76f51] to-[#e76f51]/80 text-white border-none shadow-sm">
                <CardContent className="p-4 space-y-3">
                  <h3 className="font-semibold text-lg">Subscribe to Our Newsletter</h3>
                  <p className="text-sm">
                    Get the latest updates on tree planting events, educational resources, and community initiatives.
                  </p>
                  <Input
                    placeholder="Your email address"
                    className="bg-white/20 border-white/30 placeholder:text-white/70 text-white"
                  />
                  <Button className="w-full bg-white text-[#e76f51] hover:bg-white/90">Subscribe</Button>
                </CardContent>
              </Card>
            </motion.aside>
          )}
        </div>
      </main>
    </div>
  )
} 