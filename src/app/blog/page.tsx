"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Search,
  TrendingUp,
  Clock,
  ThumbsUp,
  ThumbsDown,
  MessageCircle,
  Share2,
  Bookmark,
  Filter,
  Flame,
  Plus,
  ChevronLeft,
  ChevronRight,
  User,
  Calendar,
  Hash
} from "lucide-react"
import { Spinner } from "@/components/ui/spinner"
import Link from "next/link"
import { cn } from "@/lib/utils"
import { Avatar, AvatarImage } from "@/components/ui/avatar"

interface Post {
  id: number
  title: string
  content: string
  excerpt: string
  author_name: string
  featured_image_url: string
  views_count: number
  likes_count: number
  comments_count: number
  tags: { id: number; name: string }[] | string[] | string
  created_at: string
  is_featured?: boolean
  is_trending?: boolean
  is_liked?: boolean
  author_avatar_url?: string
}

interface Tag {
  id: number
  name: string
  post_count: number
  total_views?: number
}

type TagString = {
  id?: number;
  name: string;
} | string;

type TagArray = TagString[] | string[] | string | undefined | null;

interface RenderTagsOptions {
  className?: string;
  isTrending?: boolean;
}

interface TopAuthor {
  author_id: number;
  author_name: string;
  author_avatar_url: string | null;
  post_count: number;
  likes_count: number;
}

export function renderTags(tags: TagArray, options: RenderTagsOptions = {}) {
  const { className = "bg-green-100 text-green-700", isTrending = false } = options;
  
  if (!tags) return null;
  
  const renderedTags = [];
  
  // Handle string (comma-separated)
  if (typeof tags === 'string') {
    renderedTags.push(...tags.split(',').map((tag: string, i: number) => (
      <Badge key={`str-${i}`} variant="secondary" className={className}>
        {tag.trim()}
      </Badge>
    )));
  }
  
  // Handle array
  if (Array.isArray(tags)) {
    renderedTags.push(...tags.map((tag: TagString, i: number) => (
      <Badge 
        key={typeof tag === 'string' ? `str-${i}` : tag.id || i} 
        variant="secondary" 
        className={className}
      >
        {typeof tag === 'string' ? tag : tag.name}
      </Badge>
    )));
  }
  
  // Add trending tag if specified
  if (isTrending) {
    renderedTags.push(
      <Badge 
        key="trending"
        variant="secondary"
        className="flex items-center gap-1 bg-orange-100 text-orange-700 hover:bg-orange-200"
      >
        <TrendingUp className="h-3 w-3" /> Trending
      </Badge>
    );
  }
  
  return renderedTags;
}; 

export default function BlogPage() {
  const { user } = useAuth()
  const router = useRouter()
  const [posts, setPosts] = useState<Post[]>([])
  const [featuredPosts, setFeaturedPosts] = useState<Post[]>([])
  const [currentFeaturedIndex, setCurrentFeaturedIndex] = useState(0)
  const [tags, setTags] = useState<Tag[]>([])
  const [trendingTags, setTrendingTags] = useState<Tag[]>([])
  const [topAuthors, setTopAuthors] = useState<TopAuthor[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedTag, setSelectedTag] = useState<number | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [activeTab, setActiveTab] = useState("all")
  const [likedPosts, setLikedPosts] = useState<number[]>([])
  const [followingAuthors, setFollowingAuthors] = useState<number[]>([])

  // Fetch posts when search, tag, page, or tab changes
  useEffect(() => {
    fetchPosts()
  }, [searchTerm, selectedTag, currentPage, activeTab])

  // Fetch tags and trending tags only on initial load
  useEffect(() => {
    fetchTags()
    fetchTrendingTags()
    fetchTopAuthors()
    
    // If user is logged in, fetch their following status
    if (user) {
      fetchFollowingStatus()
    }
  }, [user])

  useEffect(() => {
    if (posts) {
      setLikedPosts(posts.filter(post => post.is_liked).map(post => post.id))
    }
  }, [posts])

  const fetchPosts = async () => {
    setIsLoading(true)
    try {
      // Fetch featured posts first
      const featuredResponse = await fetch('/api/blog/featured?limit=3', {
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      })
      
      if (!featuredResponse.ok) {
        const errorText = await featuredResponse.text()
        console.error('Featured posts error response:', errorText)
        throw new Error('Failed to fetch featured posts')
      }
      
      const featuredData = await featuredResponse.json()
      setFeaturedPosts(featuredData.success ? (featuredData.posts || []) : [])

      // Then fetch regular posts
      let url = `/api/blog?page=${currentPage}`
      if (searchTerm) {
        url += `&search=${encodeURIComponent(searchTerm)}`
      }
      if (selectedTag) {
        url += `&tag=${selectedTag}`
      }

      const response = await fetch(url, {
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      })
      
      if (!response.ok) {
        const errorText = await response.text()
        console.error('Posts error response:', errorText)
        throw new Error('Failed to fetch posts')
      }
      
      const data = await response.json()
      
      if (data.success) {
        const processedPosts = data.posts.map((post: Post) => {
          return post
        })
        setPosts(processedPosts || [])
        setTotalPages(data.total_pages || 1)
      } else {
        setPosts([])
        setTotalPages(1)
        console.error('Failed to fetch posts:', data.message)
      }
    } catch (error) {
      console.error('Error fetching posts:', error)
      setFeaturedPosts([])
      setPosts([])
      setTotalPages(1)
    } finally {
      setIsLoading(false)
    }
  }

  const fetchTags = async () => {
    try {
      const response = await fetch('/api/blog/tags', {
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        }
      })
      
      if (!response.ok) {
        const errorText = await response.text()
        console.error('Tags error response:', errorText)
        throw new Error('Failed to fetch tags')
      }
      
      const data = await response.json()
      setTags(data.success ? (data.tags || []) : [])
    } catch (error) {
      console.error('Error fetching tags:', error)
      setTags([])
    }
  }

  const fetchTrendingTags = async () => {
    try {
      const response = await fetch('/api/blog/tags/trending', {
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        }
      })
            
      if (!response.ok) {
        const errorText = await response.text()
        console.error('Trending tags error response:', errorText)
        throw new Error('Failed to fetch trending tags')
      }
      
      const data = await response.json()
      
      if (data.success) {
        setTrendingTags(data.tags || [])
      } else {
        console.warn('Trending tags response not successful:', data)
        setTrendingTags([])
      }
    } catch (error) {
      console.error('Error in fetchTrendingTags:', error)
      setTrendingTags([])
    }
  }

  const fetchTopAuthors = async () => {
    try {
      const response = await fetch('/api/blog/authors/top?limit=5', {
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token') || ''}`
        }
      })
      
      if (!response.ok) {
        const errorText = await response.text()
        console.error('Top authors error response:', errorText)
        throw new Error('Failed to fetch top authors')
      }
      
      const data = await response.json()
      setTopAuthors(data.success ? (data.authors || []) : [])
    } catch (error) {
      console.error('Error fetching top authors:', error)
      setTopAuthors([])
    }
  }

  const fetchFollowingStatus = async () => {
    if (!user) return
    
    try {
      const response = await fetch('/api/users/following', {
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token') || ''}`
        }
      })
      
      if (!response.ok) {
        throw new Error('Failed to fetch following status')
      }
      
      const data = await response.json()
      if (data.success && data.following) {
        setFollowingAuthors(data.following.map((f: any) => f.followed_id))
      }
    } catch (error) {
      console.error('Error fetching following status:', error)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const nextFeaturedPost = () => {
    setCurrentFeaturedIndex((prev) => (prev + 1) % featuredPosts.length)
  }

  const prevFeaturedPost = () => {
    setCurrentFeaturedIndex((prev) => (prev - 1 + featuredPosts.length) % featuredPosts.length)
  }

  const handleLike = async (postId: number) => {
    if (!user) {
      router.push('/auth/login')
      return
    }

    const isCurrentlyLiked = likedPosts.includes(postId)
    const newLikedState = !isCurrentlyLiked

    // Optimistically update UI
    if (newLikedState) {
      setLikedPosts(prev => [...prev, postId])
    } else {
      setLikedPosts(prev => prev.filter(id => id !== postId))
    }

    // Optimistically update post state
    setPosts(prevPosts => 
      prevPosts.map(post => 
        post.id === postId 
          ? { 
              ...post, 
              is_liked: newLikedState,
              likes_count: post.likes_count + (newLikedState ? 1 : -1)
            }
          : post
      )
    )

    try {
      const response = await fetch(`/api/blog/${postId}/${newLikedState ? 'like' : 'unlike'}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      })

      if (!response.ok) {
        throw new Error('Failed to toggle like')
      }

      const data = await response.json()
      
      // Update post with the actual likes count from the server
      setPosts(prevPosts => 
        prevPosts.map(post => 
          post.id === postId 
            ? { 
                ...post, 
                likes_count: data.likes_count,
                is_liked: newLikedState
              }
            : post
        )
      )
    } catch (error) {
      console.error('Error toggling like:', error)
      // Revert optimistic updates on error
      if (newLikedState) {
        setLikedPosts(prev => prev.filter(id => id !== postId))
      } else {
        setLikedPosts(prev => [...prev, postId])
      }
      // Revert post state on error
      setPosts(prevPosts => 
        prevPosts.map(post => 
          post.id === postId 
            ? { 
                ...post, 
                is_liked: !newLikedState,
                likes_count: post.likes_count + (newLikedState ? -1 : 1)
              }
            : post
        )
      )
    }
  }

  const handleFollow = async (authorId: number) => {
    if (!user) {
      router.push('/auth/login')
      return
    }
    
    const isFollowing = followingAuthors.includes(authorId)
    
    // Optimistically update UI
    if (isFollowing) {
      setFollowingAuthors(prev => prev.filter(id => id !== authorId))
    } else {
      setFollowingAuthors(prev => [...prev, authorId])
    }
    
    try {
      const response = await fetch(`/api/users/${authorId}/follow`, {
        method: isFollowing ? 'DELETE' : 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      })
      
      if (!response.ok) {
        // Revert optimistic update on failure
        if (isFollowing) {
          setFollowingAuthors(prev => [...prev, authorId])
        } else {
          setFollowingAuthors(prev => prev.filter(id => id !== authorId))
        }
        throw new Error('Failed to update follow status')
      }
    } catch (error) {
      console.error('Error updating follow status:', error)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Spinner size="lg" className="text-[#2c5530]" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#f8f9f3]">
      {/* Hero Section */}
      <section className="relative bg-[#2c5530] py-20">
        <div className="absolute inset-0 bg-[url('https://thinkzone.vn/uploads/2022_01/anatomy-of-a-blog-post-deconstructed-open-graph-1641376129.jpg')] opacity-5 bg-repeat"></div>
        <div className="container px-4">
          {featuredPosts.length > 0 ? (
            <div className="relative mx-auto max-w-4xl overflow-hidden">
              {/* Featured Posts Slider */}
              <div 
                className="relative transition-transform duration-500 ease-in-out"
                style={{ 
                  width: `${featuredPosts.length * 100}%`,
                  transform: `translateX(-${(currentFeaturedIndex * 100) / featuredPosts.length}%)`
                }}
              >
                <div className="flex">
                  {featuredPosts.map((post, index) => (
                    <div 
                      key={post.id}
                      className="w-full flex-shrink-0"
                      style={{ width: `${100 / featuredPosts.length}%` }}
                    >
                      <div className="relative overflow-hidden rounded-xl bg-white shadow-xl">
                        <div className="grid md:grid-cols-2">
                          <div className="relative aspect-[4/3] md:aspect-auto">
                            <img
                              src={post.featured_image_url || "https://thinkzone.vn/uploads/2022_01/anatomy-of-a-blog-post-deconstructed-open-graph-1641376129.jpg"}
                              alt={post.title}
                              className="absolute inset-0 h-full w-full object-cover"
                            />
                            <div className="absolute left-4 top-4">
                              <Badge className="bg-[#e76f51] text-white">Blog of the Day</Badge>
                            </div>
                          </div>
                          <div className="p-6">
                            <div className="flex flex-wrap gap-2 mb-3">
                              {renderTags(post.tags)}
                            </div>
                            <h2 className="mb-3 text-2xl font-bold text-[#2c5530]">
                              {post.title}
                            </h2>
                            <p className="mb-4 text-[#5a7d61]">
                              {post.excerpt}
                            </p>
                            <div className="flex items-center gap-4 text-sm text-[#5a7d61]">
                              <div className="flex items-center gap-2">
                                <User className="h-4 w-4" />
                                <span>{post.author_name}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <Calendar className="h-4 w-4" />
                                <span>{formatDate(post.created_at)}</span>
                              </div>
                            </div>
                            <div className="mt-6">
                              <Link href={`/blog/${post.id}`}>
                                <Button className="bg-[#2c5530] hover:bg-[#1e3c21] text-white">Read More</Button>
                              </Link>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Navigation Buttons */}
              {featuredPosts.length > 1 && (
                <>
                  <button
                    onClick={prevFeaturedPost}
                    className="absolute left-4 top-1/2 -translate-y-1/2 rounded-full bg-white/80 p-2 text-[#2c5530] shadow-lg hover:bg-white transition-colors duration-200"
                  >
                    <ChevronLeft className="h-6 w-6" />
                  </button>
                  <button
                    onClick={nextFeaturedPost}
                    className="absolute right-4 top-1/2 -translate-y-1/2 rounded-full bg-white/80 p-2 text-[#2c5530] shadow-lg hover:bg-white transition-colors duration-200"
                  >
                    <ChevronRight className="h-6 w-6" />
                  </button>
                  <div className="absolute bottom-4 left-1/2 flex -translate-x-1/2 gap-2">
                    {featuredPosts.map((_, index) => (
                      <button
                        key={index}
                        onClick={() => setCurrentFeaturedIndex(index)}
                        className={`h-2 w-2 rounded-full transition-colors duration-200 ${
                          index === currentFeaturedIndex ? 'bg-white' : 'bg-white/40'
                        }`}
                      />
                    ))}
                  </div>
                </>
              )}
            </div>
          ) : (
            <div className="text-center text-white">
              <h1 className="text-4xl font-bold">Community Blog</h1>
              <p className="mt-4 text-xl text-white/90">Share your environmental journey and learn from others</p>
          </div>
          )}
        </div>
      </section>

      {/* Search and Filter Section */}
      <section className="border-b border-[#d1e0d3] bg-[#f0f4e9] py-4">
        <div className="container px-4">
          <div className="flex flex-wrap items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#5a7d61]" />
              <Input 
                placeholder="Search blog posts..." 
                className="pl-10 border-[#d1e0d3] focus-visible:ring-[#2c5530] bg-white rounded-full"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Button variant="outline" className="flex items-center gap-2 border-[#d1e0d3] text-[#5a7d61] rounded-full">
              <Filter className="h-4 w-4" />
              Filters
            </Button>
            <div className="flex items-center gap-2">
              <span className="text-sm text-[#5a7d61]">Sort by:</span>
              <select className="rounded-full border border-[#d1e0d3] px-2 py-1 text-sm text-[#5a7d61] focus:ring-[#2c5530]">
                <option>Most Recent</option>
                <option>Most Popular</option>
                <option>Most Discussed</option>
              </select>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <main className="container px-4 py-8">
        <div className="grid gap-8 lg:grid-cols-[1fr_300px]">
          {/* Blog Posts */}
          <div className="space-y-8">
            <Tabs defaultValue="all" className="space-y-4" value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="bg-[#e9f0e6] p-1 rounded-full w-full max-w-md mx-auto flex justify-between">
                <TabsTrigger 
                  value="all" 
                  className="rounded-full data-[state=active]:bg-[#2c5530] data-[state=active]:text-white flex-1"
                >
                  All Posts
                </TabsTrigger>
                <TabsTrigger 
                  value="trending" 
                  className="rounded-full data-[state=active]:bg-[#2c5530] data-[state=active]:text-white flex-1"
                >
                  Trending
                </TabsTrigger>
                <TabsTrigger 
                  value="following" 
                  className="rounded-full data-[state=active]:bg-[#2c5530] data-[state=active]:text-white flex-1"
                >
                  Following
                </TabsTrigger>
              </TabsList>

              <TabsContent value="all" className="space-y-4">
                {posts.map((post) => (
                  <Card key={post.id} className="overflow-hidden hover:shadow-md transition-shadow border border-[#d1e0d3] bg-white">
                    <div className="grid grid-cols-[1fr_250px] gap-6">
                      <div className="p-6">
                        {/* Tags - Moved above title */}
                        <div className="flex flex-wrap items-center gap-2">
                          {renderTags(post.tags)}
                          {post.is_trending && (
                            <Badge 
                              variant="secondary"
                              className="flex items-center gap-1 bg-[#e76f51] text-white hover:bg-[#e25b3a]"
                            >
                              <TrendingUp className="h-3 w-3" />
                              <span>Trending</span>
                            </Badge>
                          )}
                        </div>

                        {/* Title and Excerpt */}
                        <Link href={`/blog/${post.id}`}>
                          <h2 className="mt-4 text-2xl font-bold text-[#2c5530] hover:text-[#1e3c21]">
                            {post.title}
                          </h2>
                        </Link>
                        <p className="mt-2 text-[#5a7d61] leading-relaxed line-clamp-2">
                          {post.excerpt}
                        </p>

                        {/* Author and Date */}
                        <div className="mt-6 flex items-center gap-3">
                          <Avatar className="h-8 w-8 border border-[#d1e0d3]">
                            <AvatarImage
                              src= {post.author_avatar_url || "/placeholder.svg?height=32&width=32"}
                              alt={post.author_name}
                              className="h-8 w-8 rounded-full"
                            />
                          </Avatar>
                          <span className="font-medium text-[#2c5530]">{post.author_name}</span>
                          <span className="text-[#5a7d61]">{formatDate(post.created_at)}</span>
                        </div>

                        {/* Engagement Bar */}
                        <div className="mt-6 flex items-center gap-6">
                          <div className="flex items-center gap-6">
                            <Button
                              variant="ghost"
                              onClick={(e) => {
                                e.preventDefault()
                                handleLike(post.id)
                              }} 
                              className={cn(
                                "flex items-center gap-2 p-0 h-auto",
                                likedPosts.includes(post.id)
                                  ? "text-[#2c5530] hover:text-[#1e3c21]"
                                  : "text-[#5a7d61] hover:text-[#2c5530]"
                              )}
                            >
                              <ThumbsUp className="h-4 w-4" />
                              <span>{post.likes_count}</span>
                            </Button>
                            <button className="flex items-center gap-2 text-[#5a7d61] hover:text-[#2c5530]">
                              <MessageCircle className="h-4 w-4" />
                              <span>{post.comments_count}</span>
                            </button>
                          </div>
                          <div className="ml-auto">
                            <button className="text-[#5a7d61] hover:text-[#2c5530]">
                              <Bookmark className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Featured Image */}
                      <div className="relative">
                        <img
                          src={post.featured_image_url || "https://thinkzone.vn/uploads/2022_01/anatomy-of-a-blog-post-deconstructed-open-graph-1641376129.jpg"}
                          alt={post.title}
                          className="h-full w-full object-cover"
                        />
                      </div>
                    </div>
                  </Card>
                ))}
              </TabsContent>
            </Tabs>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="mt-8 flex justify-center gap-2">
                <Button
                  variant="outline"
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="border-[#d1e0d3] text-[#2c5530] hover:bg-[#e9f0e6] hover:text-[#1e3c21]"
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="border-[#d1e0d3] text-[#2c5530] hover:bg-[#e9f0e6] hover:text-[#1e3c21]"
                >
                  Next
                </Button>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {user && (
              <Card className="bg-[#f0f4e9] border-[#d1e0d3]">
                <CardContent className="pt-6">
                  <Link href="/blog/create">
                    <Button className="w-full bg-[#e76f51] hover:bg-[#e25b3a] text-white border-none shadow-md">
                      <Plus className="mr-2 h-4 w-4" />
                      Create New Post
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            )}

            {/* Trending Tags */}
            <Card className="border-[#d1e0d3] bg-white">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-[#2c5530]">
                  <Flame className="h-5 w-5 text-[#e76f51]" />
                  Trending Tags
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {trendingTags.map((tag) => (
                    <Badge
                      key={tag.id}
                      variant="secondary"
                      className={cn(
                        "cursor-pointer bg-[#e9f0e6] text-[#5a7d61] hover:bg-[#d1e0d3] hover:text-[#2c5530]",
                        selectedTag === tag.id && "bg-[#d1e0d3] text-[#2c5530]"
                      )}
                      onClick={() => setSelectedTag(selectedTag === tag.id ? null : tag.id)}
                    >
                      {tag.name}
                      <span className="ml-1 text-xs text-[#5a7d61]">
                        ({tag.post_count} posts • {tag.total_views} views)
                      </span>
                    </Badge>
                  ))}
                  {trendingTags.length === 0 && (
                    <p className="text-sm text-[#5a7d61]">No trending tags in the last 24 hours</p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* All Tags */}
            <Card className="border-[#d1e0d3] bg-white">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-[#2c5530]">
                  <Hash className="h-5 w-5" />
                  All Tags
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {tags.map((tag) => (
                    <Badge
                      key={tag.id}
                      variant="secondary"
                      className={cn(
                        "cursor-pointer bg-[#e9f0e6] text-[#5a7d61] hover:bg-[#d1e0d3] hover:text-[#2c5530]",
                        selectedTag === tag.id && "bg-[#d1e0d3] text-[#2c5530]"
                      )}
                      onClick={() => setSelectedTag(selectedTag === tag.id ? null : tag.id)}
                    >
                      {tag.name}
                      <span className="ml-1 text-xs text-[#5a7d61]">({tag.post_count})</span>
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Top Authors */}
            <Card className="border-[#d1e0d3] bg-white">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-[#2c5530]">
                  <User className="h-5 w-5" />
                  Top Authors
                </CardTitle>
              </CardHeader>
              <CardContent>
                {topAuthors.length === 0 ? (
                  <div className="text-center py-4">
                    <Spinner className="mx-auto h-8 w-8 text-[#2c5530] opacity-50" />
                    <p className="mt-2 text-sm text-[#5a7d61]">Loading authors...</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {topAuthors.map((author, index) => (
                      <div key={author.author_id} className="flex items-center gap-3 relative">
                        <Avatar className="h-10 w-10 border border-[#d1e0d3]">
                          <AvatarImage
                            src={author.author_avatar_url || "/placeholder.svg?height=40&width=40"}
                            alt={author.author_name}
                          />
                        </Avatar>
                        <div className="flex-1">
                          <p className="font-medium text-[#2c5530]">{author.author_name}</p>
                          <div className="flex items-center gap-3 text-xs text-[#5a7d61]">
                            <span>{author.post_count} posts</span>
                            <div className="flex items-center gap-1">
                              <ThumbsUp className="h-3 w-3" />
                              <span>{author.likes_count}</span>
                            </div>
                          </div>
                        </div>
                        {user && user.id !== author.author_id && (
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="border-[#d1e0d3] text-[#2c5530] hover:bg-[#e9f0e6] hover:text-[#1e3c21]"
                            onClick={() => handleFollow(author.author_id)}
                          >
                            {followingAuthors.includes(author.author_id) ? 'Unfollow' : 'Follow'}
                          </Button>
                        )}
                        {index === 0 && (
                          <Badge variant="secondary" className="absolute -top-2 -right-2 bg-[#e76f51] text-white">
                            Top
                          </Badge>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  )
}

