"use client"

import { useState, useEffect, useRef, useMemo } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  ThumbsUp,
  MessageCircle,
  Share2,
  Bookmark,
  Clock,
  Calendar,
  Eye,
  ChevronLeft,
  Flag,
  Heart,
  Sparkles,
  MessageSquare,
  TrendingUp,
  Leaf,
  BookmarkCheck,
  Send,
  MoreHorizontal,
  ChevronRight,
  Tag,
  Check,
  AlertCircle,
  Trash2,
  Shield,
} from "lucide-react"
import { Spinner } from "@/components/ui/spinner"
import Link from "next/link"
import { cn } from "@/lib/utils"
import { motion, AnimatePresence } from "framer-motion"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { renderTags } from "../page"

interface Post {
  id: number
  title: string
  content: string
  author_id: number
  author_name: string
  featured_image_url: string
  views_count: number
  likes_count: number
  comments_count: number
  tags: string
  created_at: string
  is_liked: boolean
  category?: string
}

interface Comment {
  id: number
  content: string
  user_id: number
  author_name: string
  likes_count: number
  created_at: string
  parent_id: number | null
  is_liked: boolean
  author_avatar_url: string | null
}

interface TopContributor {
  author_id: number
  author_name: string
  likes_count: number
}

interface RelatedPost {
  id: number
  title: string
  featured_image_url: string
  content: string
  excerpt: string
  created_at: string
  comments_count: number
  likes_count: number
  views_count: number
  author_name: string
  tags: Array<{ id: number, name: string }>
  is_liked: boolean
}

// Blog content renderer component
function BlogContentRenderer({ content }: { content: string }) {
  // Process content to determine if it's HTML or plain text
  const processedContent = useMemo(() => {
    // Check if the content appears to be HTML
    const isHtml = /<[a-z][\s\S]*>/i.test(content);
    
    if (isHtml) {
      // It's HTML, return it directly
      return { html: content, isHtml: true };
    } else {
      // It's plain text, convert newlines to paragraphs
      const paragraphs = content.split('\n').filter(line => line.trim() !== '');
      let html = '';
      
      for (const paragraph of paragraphs) {
        if (paragraph.includes(':')) {
          // This might be a section header
          const [title] = paragraph.split(':');
          html += `
            <div class="mt-12 mb-6">
              <h2 class="text-2xl font-bold text-[#2c5530] mb-4 flex items-center">
                <div class="bg-[#e9f0e6] p-1 rounded-md mr-2">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="h-5 w-5 text-[#2c5530]">
                    <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z"></path>
                    <path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12"></path>
                  </svg>
                </div>
                ${title.trim()}
              </h2>
              <div class="h-1 w-16 bg-[#2c5530] rounded-full mb-6"></div>
            </div>
          `;
        } else {
          // Regular paragraph
          html += `<p class="text-[#2c5530] leading-relaxed text-lg mb-4">${paragraph.trim()}</p>`;
        }
      }
      
      return { html, isHtml: false };
    }
  }, [content]);

  return (
    <div 
      className="prose prose-green max-w-none text-[#2c5530]
        prose-headings:text-[#2c5530] prose-headings:font-bold 
        prose-p:text-[#2c5530] prose-p:leading-relaxed 
        prose-a:text-[#3a6b3e] prose-a:hover:underline
        prose-strong:text-[#2c5530] prose-strong:font-semibold
        prose-ul:list-disc prose-ul:pl-5 
        prose-ol:list-decimal prose-ol:pl-5" 
      dangerouslySetInnerHTML={{ __html: processedContent.html }}
    />
  );
}

export default function BlogPostPage({ params }: { params: { id: string } }) {
  const { user } = useAuth()
  const router = useRouter()
  const [post, setPost] = useState<Post | null>(null)
  const [comments, setComments] = useState<Comment[]>([])
  const [topContributors, setTopContributors] = useState<TopContributor[]>([])
  const [relatedPosts, setRelatedPosts] = useState<RelatedPost[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [commentContent, setCommentContent] = useState("")
  const [replyTo, setReplyTo] = useState<number | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isLiked, setIsLiked] = useState(false)
  const [isBookmarked, setIsBookmarked] = useState(false)
  const [likedComments, setLikedComments] = useState<number[]>([])
  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState("all")
  const [showCommentForm, setShowCommentForm] = useState(false)
  const commentInputRef = useRef<HTMLDivElement>(null)
  const hasIncrementedView = useRef(false)
  const [readingProgress, setReadingProgress] = useState(0)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  useEffect(() => {
    fetchPost()
    fetchComments()
    fetchRelatedPosts()
    // Reset the ref when the post ID changes
    hasIncrementedView.current = false

    // Add scroll event listener for reading progress
    const handleScroll = () => {
      const totalHeight = document.body.scrollHeight - window.innerHeight
      const progress = (window.scrollY / totalHeight) * 100
      setReadingProgress(progress)
    }

    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [params.id])

  useEffect(() => {
    if (post && !hasIncrementedView.current) {
      setIsLiked(post.is_liked)
      incrementView()
      hasIncrementedView.current = true
    }
  }, [post])

  const showSuccessMessage = (message: string) => {
    setSuccessMessage(message)
    setTimeout(() => setSuccessMessage(null), 3000)
  }

  const showErrorMessage = (message: string) => {
    setError(message)
    setTimeout(() => setError(null), 3000)
  }

  const incrementView = async () => {
    try {
      await fetch(`/api/blog/${params.id}/increment-view`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      })
    } catch (error) {
      console.error("Error incrementing view:", error)
    }
  }

  const fetchPost = async () => {
    try {
      const response = await fetch(`/api/blog/${params.id}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      })
      if (!response.ok) throw new Error("Post not found")
      const data = await response.json()
      setPost(data)

      // After getting post, fetch top contributors
      fetchTopContributors()
    } catch (error) {
      console.error("Error fetching post:", error)
      showErrorMessage("Failed to load blog post")
      router.push("/blog")
    } finally {
      setIsLoading(false)
    }
  }

  const fetchComments = async () => {
    try {
      const response = await fetch(`/api/blog/${params.id}/comments`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      })
      const data = await response.json()
      setComments(data)
      setLikedComments(data.filter((comment: Comment) => comment.is_liked).map((comment: Comment) => comment.id))
    } catch (error) {
      console.error("Error fetching comments:", error)
      showErrorMessage("Failed to load comments")
    }
  }

  const fetchTopContributors = async () => {
    try {
      // This is a placeholder - implement the actual endpoint later
      const topUsers = [
        { author_id: 1, author_name: "Emma Green", likes_count: 245 },
        { author_id: 2, author_name: "John Nature", likes_count: 189 },
        { author_id: 3, author_name: "Zoe Earth", likes_count: 156 },
      ]
      setTopContributors(topUsers)
    } catch (error) {
      console.error("Error fetching top contributors:", error)
    }
  }

  const fetchRelatedPosts = async () => {
    try {
      const response = await fetch(`/api/blog/${params.id}/related?limit=3`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });
      
      if (!response.ok) {
        throw new Error("Failed to fetch related posts");
      }
      
      const data = await response.json();
      setRelatedPosts(data.posts || []);
    } catch (error) {
      console.error("Error fetching related posts:", error);
      // Fallback to empty array in case of error
      setRelatedPosts([]);
    }
  }

  const handleLike = async () => {
    if (!user) {
      router.push("/auth/login")
      return
    }

    const newIsLiked = !isLiked
    setIsLiked(newIsLiked)
    if (post) {
      setPost({
        ...post,
        likes_count: post.likes_count + (newIsLiked ? 1 : -1),
        is_liked: newIsLiked,
      })
    }

    try {
      const response = await fetch(`/api/blog/${params.id}/${newIsLiked ? "like" : "unlike"}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      })

      if (!response.ok) {
        // Revert optimistic update if request fails
        setIsLiked(!newIsLiked)
        if (post) {
          setPost({
            ...post,
            likes_count: post.likes_count + (newIsLiked ? -1 : 1),
            is_liked: !newIsLiked,
          })
        }
        showErrorMessage("Failed to update like status")
      } else {
        if (newIsLiked) {
          showSuccessMessage("Added to your liked posts")
        }
      }
    } catch (error) {
      console.error("Error toggling like:", error)
      // Revert optimistic update on error
      setIsLiked(!newIsLiked)
      if (post) {
        setPost({
          ...post,
          likes_count: post.likes_count + (newIsLiked ? -1 : 1),
          is_liked: !newIsLiked,
        })
      }
      showErrorMessage("Failed to update like status")
    }
  }

  const handleBookmark = () => {
    if (!user) {
      router.push("/auth/login")
      return
    }
    setIsBookmarked(!isBookmarked)
    showSuccessMessage(isBookmarked ? "Removed from bookmarks" : "Added to your bookmarks")
  }

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: post?.title || "Blog post",
        text: `Check out this blog post: ${post?.title}`,
        url: window.location.href,
      })
    } else {
      navigator.clipboard.writeText(window.location.href)
      showSuccessMessage("Link copied to clipboard")
    }
  }

  const scrollToComment = () => {
    commentInputRef.current?.scrollIntoView({ behavior: "smooth" })
    setShowCommentForm(true)
  }

  const handleComment = async () => {
    if (!user) {
      router.push("/auth/login")
      return
    }

    if (!commentContent.trim()) return

    setIsSubmitting(true)
    try {
      const response = await fetch(`/api/blog/${params.id}/comments`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({
          content: commentContent,
          parent_id: replyTo,
        }),
      })

      if (response.ok) {
        setCommentContent("")
        setReplyTo(null)
        showSuccessMessage("Comment posted successfully")
        fetchComments()
        fetchPost()
      } else {
        showErrorMessage("Failed to post comment")
      }
    } catch (error) {
      console.error("Error posting comment:", error)
      showErrorMessage("Failed to post comment")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleCommentLike = async (commentId: number) => {
    if (!user) {
      router.push("/auth/login")
      return
    }

    const isCurrentlyLiked = likedComments.includes(commentId)
    const newLikedState = !isCurrentlyLiked

    // Optimistically update UI
    setComments(
      comments.map((comment: Comment) =>
        comment.id === commentId
          ? { ...comment, likes_count: comment.likes_count + (newLikedState ? 1 : -1) }
          : comment,
      ),
    )
    setLikedComments(newLikedState ? [...likedComments, commentId] : likedComments.filter((id) => id !== commentId))

    try {
      const response = await fetch(`/api/blog/comments/${commentId}/${newLikedState ? "like" : "unlike"}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      })

      if (!response.ok) {
        // Revert optimistic update if request fails
        setComments(
          comments.map((comment: Comment) =>
            comment.id === commentId
              ? { ...comment, likes_count: comment.likes_count + (newLikedState ? -1 : 1) }
              : comment,
          ),
        )
        setLikedComments(
          isCurrentlyLiked ? [...likedComments, commentId] : likedComments.filter((id) => id !== commentId),
        )
        showErrorMessage("Failed to update like status")
      }
    } catch (error) {
      console.error("Error toggling comment like:", error)
      // Revert optimistic update on error
      setComments(
        comments.map((comment: Comment) =>
          comment.id === commentId
            ? { ...comment, likes_count: comment.likes_count + (newLikedState ? -1 : 1) }
            : comment,
        ),
      )
      setLikedComments(
        isCurrentlyLiked ? [...likedComments, commentId] : likedComments.filter((id) => id !== commentId),
      )
      showErrorMessage("Failed to update like status")
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    })
  }

  const getTimeAgo = (dateString: string) => {
    const now = new Date()
    const date = new Date(dateString)
    const diffMs = now.getTime() - date.getTime()
    const diffSec = Math.floor(diffMs / 1000)
    const diffMin = Math.floor(diffSec / 60)
    const diffHour = Math.floor(diffMin / 60)
    const diffDay = Math.floor(diffHour / 24)
    const diffMonth = Math.floor(diffDay / 30)
    const diffYear = Math.floor(diffMonth / 12)

    if (diffSec < 60) return "just now"
    if (diffMin < 60) return `${diffMin} minute${diffMin > 1 ? "s" : ""} ago`
    if (diffHour < 24) return `${diffHour} hour${diffHour > 1 ? "s" : ""} ago`
    if (diffDay < 30) return `${diffDay} day${diffDay > 1 ? "s" : ""} ago`
    if (diffMonth < 12) return `${diffMonth} month${diffMonth > 1 ? "s" : ""} ago`
    return `${diffYear} year${diffYear > 1 ? "s" : ""} ago`
  }

  const filteredComments = () => {
    if (activeTab === "all") return comments
    // Add more filters if needed in the future
    return comments
  }

  // Check if user is admin
  const isAdmin = useMemo(() => {
    return user?.roles?.includes('admin') || false
  }, [user])

  // Function to handle post deletion
  const handleDeletePost = async () => {
    if (!isAdmin) return
    
    try {
      setIsDeleting(true)
      const token = localStorage.getItem('token')
      
      const response = await fetch(`/api/blog/${params.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      
      if (response.ok) {
        router.push('/blog')
        showSuccessMessage('Post deleted successfully')
      } else {
        const error = await response.json()
        showErrorMessage(error.message || 'Failed to delete post')
      }
    } catch (error) {
      console.error('Error deleting post:', error)
      showErrorMessage('An error occurred while deleting the post')
    } finally {
      setIsDeleting(false)
      setShowDeleteConfirm(false)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f8f9f3]">
        <div className="flex flex-col items-center gap-4">
          <Spinner size="lg" className="text-[#2c5530]" />
          <p className="text-[#2c5530] font-medium">Loading article...</p>
        </div>
      </div>
    )
  }

  if (!post) {
    return (
      <div className="min-h-screen bg-[#f8f9f3] flex items-center justify-center">
        <div className="text-center max-w-md p-8 bg-white rounded-xl shadow-md">
          <div className="bg-[#f0f4e9] rounded-full p-4 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
            <Leaf className="h-8 w-8 text-[#2c5530]" />
          </div>
          <h1 className="text-2xl font-bold text-[#2c5530] mb-4">Post not found</h1>
          <p className="text-[#5a7d61] mb-6">
            The article you're looking for might have been removed or is temporarily unavailable.
          </p>
          <Link href="/blog">
            <Button className="bg-[#2c5530] hover:bg-[#3a6b3e] text-white">
              <ChevronLeft className="h-4 w-4 mr-2" />
              Back to Blog
            </Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#f8f9f3]">
      {/* Reading Progress Bar */}
      <div className="fixed top-0 left-0 right-0 h-1 bg-gray-200 z-50">
        <div
          className="h-full bg-[#2c5530] transition-all duration-300"
          style={{ width: `${readingProgress}%` }}
        ></div>
      </div>

      {error && (
        <div className="fixed top-4 right-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded z-50 flex items-center shadow-md">
          <AlertCircle className="h-5 w-5 mr-2" />
          <span>{error}</span>
        </div>
      )}

      {successMessage && (
        <div className="fixed top-4 right-4 bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded z-50 flex items-center shadow-md">
          <Check className="h-5 w-5 mr-2" />
          <span>{successMessage}</span>
        </div>
      )}

      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
              <Shield className="h-5 w-5 text-red-500 mr-2" />
              Confirm Delete
            </h3>
            <p className="text-gray-700 mb-6">
              Are you sure you want to delete this blog post? This action cannot be undone.
            </p>
            <div className="flex justify-end space-x-3">
              <Button 
                variant="outline" 
                onClick={() => setShowDeleteConfirm(false)}
                disabled={isDeleting}
              >
                Cancel
              </Button>
              <Button 
                variant="destructive" 
                className="bg-red-600 hover:bg-red-700 flex items-center"
                onClick={handleDeletePost}
                disabled={isDeleting}
              >
                {isDeleting ? (
                  <>
                    <Spinner className="mr-2 h-4 w-4" />
                    Deleting...
                  </>
                ) : (
                  <>
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete Post
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      )}

      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Back to Blog Link */}
        <motion.div
          className="mb-8"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Link
            href="/blog"
            className="inline-flex items-center text-sm font-medium text-[#2c5530] hover:text-[#3a6b3e] transition-colors bg-[#e9f0e6] px-4 py-2 rounded-full"
          >
            <ChevronLeft className="mr-2 h-4 w-4" />
            Back to Blog
          </Link>
        </motion.div>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Main Content */}
          <div className="flex-1 order-2 lg:order-1">
            {/* Post Header */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="mb-6"
            >
              {post.category && (
                <Badge variant="secondary" className="bg-[#e9f0e6] text-[#2c5530] mb-4">
                  {post.category}
                </Badge>
              )}

              <h1 className="text-3xl md:text-4xl font-bold text-[#2c5530] mb-6 leading-tight">
                {post?.title || "Loading..."}
              </h1>

              <div className="flex items-center gap-4 mb-8">
                <Avatar className="h-12 w-12 border-2 border-[#d1e0d3]">
                  <AvatarImage src={user?.avatar_url || "/placeholder.svg?height=48&width=48"} />
                  <AvatarFallback className="bg-[#e9f0e6] text-[#2c5530]">
                    {post?.author_name?.[0] || "U"}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <div className="font-medium text-[#2c5530]">{post?.author_name}</div>
                  <div className="text-sm text-[#5a7d61] flex items-center gap-2">
                    <Calendar className="h-3 w-3" />
                    <span>{formatDate(post?.created_at || "")}</span>
                    <span className="inline-block w-1 h-1 rounded-full bg-[#5a7d61]"></span>
                    <span>{post?.views_count || 0} views</span>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Featured Image */}
            {post.featured_image_url && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1, duration: 0.5 }}
                className="mb-8 rounded-2xl overflow-hidden shadow-lg"
              >
                <img
                  src={
                    post.featured_image_url ||
                    "https://thinkzone.vn/uploads/2022_01/anatomy-of-a-blog-post-deconstructed-open-graph-1641376129.jpg"
                  }
                  alt={post.title}
                  className="w-full h-auto object-cover max-h-[500px]"
                />
              </motion.div>
            )}

            {/* Post Content */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.5 }}
            >
              <Card className="mb-8 border-[#d1e0d3] overflow-hidden shadow-md">
                <CardContent className="p-6 md:p-8">
                  <div className="prose prose-green max-w-none">
                    <div className="text-[#2c5530]">
                      {post.content && (
                        <BlogContentRenderer content={post.content} />
                      )}
                    </div>
                  </div>

                  {/* Tags */}
                  <div className="mt-8 pt-6 border-t border-[#d1e0d3]">
                    <div className="flex flex-wrap items-center gap-2">
                      <Tag className="h-4 w-4 text-[#5a7d61]" />
                      {renderTags(post.tags)}
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                        <Button
                          variant={isLiked ? "default" : "outline"}
                          size="sm"
                          className={
                            isLiked
                              ? "bg-[#2c5530] hover:bg-[#3a6b3e] text-white"
                              : "border-[#d1e0d3] text-[#2c5530] hover:bg-[#f0f4e9] hover:text-[#2c5530]"
                          }
                          onClick={handleLike}
                        >
                          <ThumbsUp className="mr-2 h-4 w-4" />
                          Helpful ({post?.likes_count || 0})
                        </Button>
                      </motion.div>
                      <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                        <Button
                          variant="outline"
                          size="sm"
                          className="border-[#d1e0d3] text-[#2c5530] hover:bg-[#f0f4e9] hover:text-[#2c5530]"
                          onClick={scrollToComment}
                        >
                          <MessageCircle className="mr-2 h-4 w-4" />
                          Comment ({post?.comments_count || 0})
                        </Button>
                      </motion.div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                        <Button
                          variant="outline"
                          size="sm"
                          className={`border-[#d1e0d3] text-[#2c5530] hover:bg-[#f0f4e9] hover:text-[#2c5530] ${isBookmarked ? "bg-[#f0f4e9]" : ""}`}
                          onClick={handleBookmark}
                        >
                          {isBookmarked ? (
                            <BookmarkCheck className="mr-2 h-4 w-4" />
                          ) : (
                            <Bookmark className="mr-2 h-4 w-4" />
                          )}
                          {isBookmarked ? "Saved" : "Save"}
                        </Button>
                      </motion.div>
                      <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                        <Button
                          variant="outline"
                          size="sm"
                          className="border-[#d1e0d3] text-[#2c5530] hover:bg-[#f0f4e9] hover:text-[#2c5530]"
                          onClick={handleShare}
                        >
                          <Share2 className="mr-2 h-4 w-4" />
                          Share
                        </Button>
                      </motion.div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-[#5a7d61] hover:text-[#2c5530] hover:bg-[#f0f4e9]"
                          >
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem className="flex items-center gap-2">
                            <Flag className="h-4 w-4" />
                            Report
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Author Bio */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.5 }}
            >
              <Card className="bg-[#f0f4e9] border-[#d1e0d3] mb-8 shadow-md">
                <CardContent className="p-6 md:p-8">
                  <div className="flex flex-col md:flex-row gap-6 items-center md:items-start">
                    <Avatar className="h-24 w-24 border-4 border-white shadow-md">
                      <AvatarImage src={user?.avatar_url || "/placeholder.svg?height=96&width=96"} alt={post.author_name} />
                      <AvatarFallback className="bg-white text-[#2c5530] text-2xl">
                        {post.author_name
                          .split(" ")
                          .map((n) => n[0])
                          .join("")}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 text-center md:text-left">
                      <h3 className="text-xl font-bold text-[#2c5530] mb-1">{post.author_name}</h3>
                      <p className="text-[#5a7d61] mb-4 flex items-center gap-2 justify-center md:justify-start">
                        <Leaf className="h-4 w-4" />
                        Environmental Enthusiast
                      </p>
                      <p className="text-[#2c5530] mb-4">
                        {user?.bio || "No bio available"}
                      </p>
                      <div className="flex flex-wrap gap-3 justify-center md:justify-start">
                        <Link href={`/profile/${post.author_id}`}>
                          <Button variant="outline" className="border-[#d1e0d3] text-[#2c5530] hover:bg-[#e9f0e6]">
                            View Profile
                          </Button>
                        </Link>
                        {user && user.id !== post.author_id && (
                          <Button className="bg-[#2c5530] hover:bg-[#3a6b3e] text-white">Follow</Button>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Comments Section */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.5 }}
              id="comments"
            >
              <div className="mb-6 flex items-center justify-between">
                <h2 className="text-2xl font-bold text-[#2c5530] flex items-center gap-2">
                  <MessageSquare className="h-5 w-5" />
                  Comments ({post.comments_count})
                </h2>
                <Tabs defaultValue="all" className="w-auto" onValueChange={setActiveTab}>
                  <TabsList className="bg-[#e9f0e6]">
                    <TabsTrigger
                      value="all"
                      className="data-[state=active]:bg-white data-[state=active]:text-[#2c5530]"
                    >
                      All Comments
                    </TabsTrigger>
                    <TabsTrigger
                      value="latest"
                      className="data-[state=active]:bg-white data-[state=active]:text-[#2c5530]"
                    >
                      Latest
                    </TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>
            </motion.div>

            {/* Comment Form */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, duration: 0.5 }}
              ref={commentInputRef}
            >
              {user ? (
                <Card className="mb-8 border-[#d1e0d3] bg-[#f0f4e9] shadow-md">
                  <CardContent className="p-6">
                    {replyTo && (
                      <div className="flex items-center justify-between bg-white p-3 rounded-lg mb-4">
                        <span className="text-sm text-[#5a7d61]">Replying to comment</span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setReplyTo(null)}
                          className="text-[#5a7d61] hover:text-red-600"
                        >
                          Cancel
                        </Button>
                      </div>
                    )}
                    <textarea
                      placeholder="Share your thoughts..."
                      value={commentContent}
                      onChange={(e) => setCommentContent(e.target.value)}
                      className="w-full min-h-[120px] p-4 rounded-lg border-0 bg-white focus:ring-2 focus:ring-[#2c5530] resize-none shadow-sm"
                    />
                    <div className="flex justify-between mt-4">
                      <div className="flex items-center text-[#5a7d61]">
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button variant="ghost" size="sm" className="text-[#5a7d61] hover:text-[#2c5530]">
                                <Sparkles className="h-4 w-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Add formatting</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </div>
                      <Button
                        onClick={handleComment}
                        disabled={isSubmitting || !commentContent.trim()}
                        className="bg-[#2c5530] hover:bg-[#3a6b3e] text-white"
                      >
                        {isSubmitting ? (
                          <>
                            <Spinner size="sm" className="mr-2" />
                            <span>Posting...</span>
                          </>
                        ) : (
                          <>
                            <Send className="h-4 w-4 mr-2" />
                            Post Comment
                          </>
                        )}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <Card className="mb-8 bg-[#f0f4e9] border-[#d1e0d3] shadow-md">
                  <CardContent className="p-8 text-center">
                    <Leaf className="h-12 w-12 mx-auto mb-4 text-[#2c5530] opacity-70" />
                    <h3 className="text-lg font-semibold text-[#2c5530] mb-2">Join the conversation</h3>
                    <p className="text-[#5a7d61] mb-6">Sign in to share your thoughts and engage with our community</p>
                    <Link href="/auth/login">
                      <Button className="bg-[#2c5530] hover:bg-[#3a6b3e] text-white">Sign In</Button>
                    </Link>
                  </CardContent>
                </Card>
              )}
            </motion.div>

            {/* Comments List */}
            <motion.div
              variants={{
                hidden: { opacity: 0 },
                visible: {
                  opacity: 1,
                  transition: {
                    staggerChildren: 0.1,
                  },
                },
              }}
              initial="hidden"
              animate="visible"
            >
              {filteredComments().length === 0 ? (
                <Card className="p-8 text-center text-[#5a7d61] border border-dashed border-[#d1e0d3] shadow-sm">
                  <MessageSquare className="h-12 w-12 mx-auto mb-4 text-[#d1e0d3]" />
                  <p className="text-lg font-medium mb-2 text-[#2c5530]">No comments yet</p>
                  <p className="mb-4">Be the first to share your thoughts!</p>
                  <Button onClick={scrollToComment} className="bg-[#2c5530] hover:bg-[#3a6b3e] text-white">
                    Add a Comment
                  </Button>
                </Card>
              ) : (
                <div className="space-y-6">
                  {filteredComments().map((comment) => (
                    <motion.div
                      key={comment.id}
                      variants={{
                        hidden: { opacity: 0, y: 20 },
                        visible: { opacity: 1, y: 0 },
                      }}
                    >
                      <Card
                        className={cn(
                          "border-[#d1e0d3] bg-white shadow-sm hover:shadow-md transition-shadow",
                          comment.parent_id && "ml-12",
                        )}
                      >
                        <CardContent className="p-6">
                          <div className="flex gap-4">
                            <Avatar className="h-10 w-10 border border-[#d1e0d3]">
                              <AvatarImage src={comment.author_avatar_url || "/placeholder.svg?height=40&width=40"} alt={comment.author_name} />
                              <AvatarFallback className="bg-[#e9f0e6] text-[#2c5530]">
                                {comment.author_name
                                  .split(" ")
                                  .map((n) => n[0])
                                  .join("")}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1">
                              <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-2">
                                  <span className="font-semibold text-[#2c5530]">{comment.author_name}</span>
                                  <span className="text-sm text-[#5a7d61]">{getTimeAgo(comment.created_at)}</span>
                                </div>
                                {user && (
                                  <div className="flex items-center gap-2">
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => setReplyTo(comment.id)}
                                      className="text-[#5a7d61] hover:text-[#2c5530] text-xs"
                                    >
                                      Reply
                                    </Button>
                                  </div>
                                )}
                              </div>
                              <p className="text-[#2c5530] mb-4">{comment.content}</p>
                              <div className="flex items-center gap-4">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleCommentLike(comment.id)}
                                  className={cn(
                                    "text-[#5a7d61] hover:text-[#2c5530] text-xs",
                                    likedComments.includes(comment.id) && "text-[#2c5530] bg-[#e9f0e6]",
                                  )}
                                >
                                  <ThumbsUp className="h-4 w-4 mr-1" />
                                  Helpful ({comment.likes_count})
                                </Button>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))}
                </div>
              )}
            </motion.div>
          </div>

          {/* Right Sidebar */}
          <div className="lg:w-80 shrink-0 order-1 lg:order-2">
            <div className="sticky top-20 space-y-8">
              {/* Admin Controls */}
              {isAdmin && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2, duration: 0.5 }}
                  className="p-6 bg-white rounded-xl border border-red-200 shadow-md"
                >
                  <h3 className="font-medium text-red-600 mb-4 flex items-center gap-2">
                    <Shield className="h-4 w-4" />
                    Admin Controls
                  </h3>
                  <Button 
                    variant="destructive" 
                    className="w-full bg-red-600 hover:bg-red-700 text-white"
                    onClick={() => setShowDeleteConfirm(true)}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete Post
                  </Button>
                </motion.div>
              )}
              
              {/* Post Stats */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3, duration: 0.5 }}
                className="p-6 bg-white rounded-xl border border-[#d1e0d3] shadow-md"
              >
                <h3 className="font-medium text-[#2c5530] mb-4 flex items-center gap-2">
                  <TrendingUp className="h-4 w-4" />
                  Post Stats
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-[#f0f4e9] rounded-lg p-3 text-center">
                    <div className="text-xl font-bold text-[#2c5530]">{post?.comments_count || 0}</div>
                    <div className="text-xs text-[#5a7d61] flex items-center justify-center gap-1">
                      <MessageSquare className="h-3 w-3" />
                      <span>Comments</span>
                    </div>
                  </div>
                  <div className="bg-[#f0f4e9] rounded-lg p-3 text-center">
                    <div className="text-xl font-bold text-[#2c5530]">{post?.views_count || 0}</div>
                    <div className="text-xs text-[#5a7d61] flex items-center justify-center gap-1">
                      <Eye className="h-3 w-3" />
                      <span>Views</span>
                    </div>
                  </div>
                  <div className="bg-[#f0f4e9] rounded-lg p-3 text-center">
                    <div className="text-xl font-bold text-[#2c5530]">{post?.likes_count || 0}</div>
                    <div className="text-xs text-[#5a7d61] flex items-center justify-center gap-1">
                      <ThumbsUp className="h-3 w-3" />
                      <span>Likes</span>
                    </div>
                  </div>
                  <div className="bg-[#f0f4e9] rounded-lg p-3 text-center">
                    <div className="text-xl font-bold text-[#2c5530]">{getTimeAgo(post?.created_at || "")}</div>
                    <div className="text-xs text-[#5a7d61] flex items-center justify-center gap-1">
                      <Clock className="h-3 w-3" />
                      <span>Posted</span>
                    </div>
                  </div>
                </div>
              </motion.div>

              {/* Related Posts */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5, duration: 0.5 }}
                className="p-6 bg-white rounded-xl border border-[#d1e0d3] shadow-md"
              >
                <h3 className="font-medium text-[#2c5530] mb-4 flex items-center gap-2">
                  <Leaf className="h-4 w-4" />
                  Related Posts
                </h3>
                <div className="space-y-4">
                  {relatedPosts.map((relatedPost) => (
                    <Link href={`/blog/${relatedPost.id}`} key={relatedPost.id}>
                      <div className="group cursor-pointer">
                        <div className="h-32 rounded-lg overflow-hidden mb-2">
                          <img
                            src={relatedPost.featured_image_url || "https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80"}
                            alt={relatedPost.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                        </div>
                        <h4 className="font-medium text-[#2c5530] group-hover:text-[#3a6b3e] line-clamp-2">
                          {relatedPost.title}
                        </h4>
                        <div className="flex items-center gap-3 mt-1 text-xs text-[#5a7d61]">
                          <div className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            <span>{getTimeAgo(relatedPost.created_at)}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <MessageSquare className="h-3 w-3" />
                            <span>{relatedPost.comments_count}</span>
                          </div>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
                <div className="mt-4 pt-4 border-t border-[#d1e0d3]">
                  <Link href="/blog">
                    <Button variant="link" className="text-[#2c5530] hover:text-[#3a6b3e] p-0 h-auto flex items-center">
                      View all posts
                      <ChevronRight className="h-4 w-4 ml-1" />
                    </Button>
                  </Link>
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}


