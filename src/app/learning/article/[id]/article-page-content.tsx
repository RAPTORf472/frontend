"use client"

import { useState, useEffect, useMemo, useRef, useCallback } from "react"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Heart,
  MessageSquare,
  Share2,
  Bookmark,
  ChevronLeft,
  Clock,
  Eye,
  ThumbsUp,
  ThumbsDown,
  Calendar,
  BookOpen,
  User,
  Tag,
  FileText,
} from "lucide-react"
import Link from "next/link"
import { useMediaQuery } from "@/hooks/use-media-query"
import { Spinner } from "@/components/ui/spinner"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useAuth } from "@/contexts/auth-context"
import { cn } from "@/lib/utils"
import { format, isValid } from "date-fns"
import { ContentRenderer } from "@/components/learning/content-renderer"
import { useLearningPage } from "../../learning-page-base"
import { useRouter } from "next/navigation"
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/components/ui/pagination"
import { AuthorBio, Comments, EngagementBar, MaterialHeader, MaterialInfo, RelatedMaterials, TableOfContents } from "@/components/learning"

// Define interfaces for our data structures

interface Comment {
  id: number
  content: string
  created_at: string
  username: string
  likes_count: number
  replies?: Comment[]
}

interface Article {
  id: number
  title: string
  content: string
  thumbnail_url: string | null
  created_at: string
  author_name: string
}

interface ArticlePageContentProps {
  params: {
    id: string
  }
}

export function ArticlePageContent({ params }: ArticlePageContentProps) {
  const router = useRouter();
  const [authorArticlesLoading, setAuthorArticlesLoading] = useState(false);
  const [authorArticles, setAuthorArticles] = useState<Article[]>([]);
  const { isAuthenticated } = useAuth();
  const [activeTab, setActiveTab] = useState("article");

  const {
    material: article,
    loading,
    error,
    tableOfContents,
    handleHeadingsFound,
    isLiked,
    likesCount,
    likeLoading,
    toggleLike,
    handleShare,
    copyToClipboard,
    prefersReducedMotion,
    hasCompleted,
    relatedMaterials,
    isLoadingRelated
  } = useLearningPage({materialId: params.id});

  useEffect(() => {
    if (article) {
      article.type = "article";
    }
  }, [article]);
  
  // Keep only the fetchAuthorArticles function
  async function fetchAuthorArticles() {

    if (!article) return;
   
    try {
      
      setAuthorArticlesLoading(true);
      const response = await fetch(`/api/learning/articles/author/${article.author_id}`);
      
      if (!response.ok) {
        throw new Error("Failed to fetch author articles");
      }
      
      const data = await response.json();
      setAuthorArticles(data.articles.filter((filteringArticle: Article) => filteringArticle.id !== article.id));
    } catch (error) {
      console.error("Error fetching author articles:", error);
    } finally {
      setAuthorArticlesLoading(false);
    }
  }

  useEffect(() => {
      fetchAuthorArticles();
  }, [article]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Spinner size="lg" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    )
  }

  if (!article) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Alert>
          <AlertDescription>Article not found</AlertDescription>
        </Alert>
      </div>
    )
  }

  return (
    
    <div className="min-h-screen bg-[#f8f9f3]">
      {/* Article Header */}
      <MaterialHeader
        material={article}
        category={article.category_title}
        backLink="/learning"
        backLabel="Back to Learning"
      />

        {/* Featured Image */}
      <div className="bg-white pb-8 shadow-sm">
        <div className="container px-4">
          <div className="mx-auto max-w-4xl">
            {article.thumbnail_url && (
              <motion.div
                className="relative aspect-[2/1] overflow-hidden rounded-xl"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, delay: 0.3 }}
              >
                <img
                  src={article.thumbnail_url}
                  alt={article.title}
                  className="h-full w-full object-cover"
                />
              </motion.div>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="container px-4 py-8">
        <div className="mx-auto max-w-6xl">
          <div className="grid grid-cols-1 lg:grid-cols-[240px_1fr_300px] gap-8">
            {/* Left Sidebar */}
            <motion.aside
              className="hidden lg:block"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
            >
              <div className="sticky top-24 space-y-6">
                <TableOfContents items={tableOfContents} />
                <MaterialInfo
                  createdAt={article.created_at}
                  duration={article.duration}
                  category={article.category_title}
                  authorName={article.author_name}
                  authorId={article.author_id}
                />
              </div>
            </motion.aside>
            
            {/* Main article content */}
            <motion.article
              className="max-w-none"
              variants={{
                hidden: { opacity: 0 },
                visible: {
                  opacity: 1,
                  transition: {
                    staggerChildren: prefersReducedMotion ? 0 : 0.1,
                    duration: prefersReducedMotion ? 0 : 0.3,
                  },
                },
              }}
              initial="hidden"
              animate="visible"
            >
              {/* Content Tabs */}
              <Tabs defaultValue="article" value={activeTab} onValueChange={setActiveTab} className="space-y-6">
                <TabsList className="bg-white p-1 shadow-sm rounded-lg w-full">
                  <TabsTrigger
                    value="article"
                    className="flex-1 data-[state=active]:bg-[#e8f2e8] data-[state=active]:text-[#2c5530] rounded-md"
                  >
                    <FileText className="mr-2 h-4 w-4" />
                    Article
                  </TabsTrigger>
                  <TabsTrigger
                    value="discussion"
                    className="flex-1 data-[state=active]:bg-[#e8f2e8] data-[state=active]:text-[#2c5530] rounded-md"
                  >
                    <MessageSquare className="mr-2 h-4 w-4" />
                    Discussion ({article.comments_count})
                  </TabsTrigger>
                </TabsList>

                {/* Article Content Tab */}
                <TabsContent value="article" className="space-y-8 mt-6">
                  {/* Article content */}
                  <ContentRenderer 
                    content={article.content} 
                    onHeadingsFound={handleHeadingsFound}
                  />

                  {/* Completion indicator */}
                  {hasCompleted && (
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.5 }}
                      className="bg-green-50 border border-green-200 rounded-lg p-4 mb-8 text-center"
                    >
                      <p className="text-green-800 font-medium">
                        🎉 You've finished reading this article!
                      </p>
                    </motion.div>
                  )}
                  
                  {/* Article Actions */}
                  <motion.div 
                    variants={{
                      hidden: { opacity: 0, y: 20 },
                      visible: { opacity: 1, y: 0 }
                    }}
                    className="mt-8 flex items-center gap-6 border-y py-4"
                  >
                    <EngagementBar
                      isLiked={isLiked}
                      likesCount={likesCount}
                      commentsCount={article.comments_count}
                      onLike={toggleLike}
                      onComment={() => setActiveTab('discussion')}
                      onShare={handleShare}
                      isAuthenticated={isAuthenticated}
                    />
                  </motion.div>
                  
                  {/* Author Bio */}
                  <motion.div 
                    variants={{
                      hidden: { opacity: 0, y: 20 },
                      visible: { opacity: 1, y: 0 }
                    }}
                  >
                    <AuthorBio
                      authorId={article.author_id}
                      authorName={article.author_name}
                      authorAvatar={article.author_avatar_url}
                      authorBio={article.author_bio}
                    />
                  </motion.div>
                </TabsContent>

                {/* Discussion Tab */}
                <TabsContent value="discussion" className="space-y-6 mt-6">
                  <EngagementBar
                    isLiked={isLiked}
                    likesCount={likesCount}
                    commentsCount={article.comments_count}
                    onLike={toggleLike}
                    onComment={() => setActiveTab("discussion")}
                    onShare={handleShare}
                    isAuthenticated={isAuthenticated}
                  />
                
                  <Comments
                    materialId={params.id}
                    className="mt-6"
                  />
                </TabsContent>
              </Tabs>
            </motion.article>
            
            {/* Right sidebar */}
            <motion.aside
              className="hidden lg:block"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
            >
              <div className="sticky top-24 space-y-6">
                {/* Related Materials */}
                <RelatedMaterials
                  material={article}
                  title="Related Materials"
                  isLoading={isLoadingRelated}
                />
                
                {/* More from Author */}
                <Card className="bg-white border-none shadow-sm">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-[#2c5530]">More from {article.author_name}</CardTitle>
                  </CardHeader>
                  <CardContent className="p-4">
                    <div className="space-y-4">
                      {authorArticlesLoading ? (
                        <div className="flex justify-center py-4">
                          <Spinner size="sm" />
                        </div>
                      ) : authorArticles.length === 0 ? (
                        <p className="text-sm text-gray-500 text-center py-2">No other articles from this author</p>
                      ) : (
                        authorArticles.map((authorArticle) => (
                          <Link 
                            key={authorArticle.id} 
                            href={`/learning/article/${authorArticle.id}`}
                            className="group block hover:bg-[#f8f9f3] rounded-lg p-2 transition-colors"
                          >
                            {authorArticle.thumbnail_url && (
                              <div className="aspect-video relative rounded-md overflow-hidden mb-2">
                                <img
                                  src={authorArticle.thumbnail_url || "/placeholder.svg"}
                                  alt={authorArticle.title}
                                  className="absolute inset-0 h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                                />
                              </div>
                            )}
                            <Badge className="mb-1 bg-[#e8f2e8] text-[#2c5530]">Article</Badge>
                            <h3 className="line-clamp-2 text-sm font-semibold group-hover:text-[#2c5530]">
                              {authorArticle.title}
                            </h3>
                            <p className="mt-1 text-xs text-gray-500">{authorArticle.author_name}</p>
                          </Link>
                        ))
                      )}
                      <Button 
                        variant="outline" 
                        className="w-full mt-2 text-[#2c5530] hover:bg-[#e8f2e8]" 
                        asChild
                      >
                        <Link href={`/profile/${article.author_id}`}>
                          View All Articles
                        </Link>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </motion.aside>
          </div>
        </div>
      </main>
      </div>
  )
} 