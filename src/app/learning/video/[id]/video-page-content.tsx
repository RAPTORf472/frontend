"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { VideoPlayer } from "@/components/learning/video-player"
import { useLearningPage } from "../../learning-page-base"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  MessageSquare,
  Clock,
  Eye,
  Link,
  ChevronLeft,
  FileText,
} from "lucide-react"
import { useAuth } from "@/contexts/auth-context"
import { Comments } from "@/components/learning/comments-section"
import { EngagementBar } from "@/components/learning/engagement-bar"
import { AuthorBio } from "@/components/learning/author-bio"
import { RelatedMaterials } from "@/components/learning/related-materials"
import { MaterialHeader } from "@/components/learning/material-header"
import { motion } from "framer-motion"

interface Material {
  id: number
  title: string
  content: string
  excerpt: string
  category_title: string
  type: string
  duration: string | null
  thumbnail_url: string | null
  views_count: number
  likes_count: number
  comments_count: number
  author_id: number
  author_name: string
  status: string
  is_liked: boolean
  created_at: string
  category_path: string
  tags: string[]
}

interface Video {
  id: number
  title: string
  content: string // This will be the YouTube video ID
  excerpt: string
  category_title: string
  type: string
  duration: string | null
  thumbnail_url: string | null
  views_count: number
  likes_count: number
  comments_count: number
  author_id: number
  author_name: string
  status: string
  is_liked: boolean
  created_at: string
}

interface VideoPageContentProps {
  params: {
    id: string
  }
}

export function VideoPageContent({ params }: VideoPageContentProps) {

  const { isAuthenticated } = useAuth();
  const [activeTab, setActiveTab] = useState("video");

  const {
    material: video,
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

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <div className="flex flex-col items-center gap-2 text-center">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-[#2c5530] border-t-transparent" />
          <p className="text-lg font-medium text-[#2c5530]">Loading video...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="rounded-lg bg-red-50 p-4">
          <p className="text-red-700">Error: {error}</p>
        </div>
      </div>
    )
  }

  if (!video) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="rounded-lg bg-amber-50 p-4">
          <p className="text-amber-700">Video not found</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Back to Learning Link */}
      <div className="container px-4 py-8">
        <a 
          href="/learning" 
          className="inline-flex items-center text-sm text-gray-600 hover:text-[#2c5530]"
        >
          <ChevronLeft className="mr-2 h-4 w-4" />
          Back to Learning
        </a>
      </div>
      {/* Video Header */}
      <header className="bg-black">
          
          <div className="container px-4 py-4">
      
          {/* Video Player */}
          <div className="relative mx-auto aspect-video max-w-5xl overflow-hidden rounded-xl bg-black">
            <VideoPlayer
                url={video.content} // This is the YouTube video ID
                thumbnail={video.thumbnail_url || '/placeholder.svg'}
            />
          </div>
        </div>
      </header>

      <main className="container px-4 py-8">
        <div className="mx-auto max-w-5xl">
          <div className="grid gap-8 lg:grid-cols-[1fr_300px]">
            {/* Main Content */}
            <div className="space-y-8">
                            
              {/* Video Info */}
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="secondary" className="bg-green-100 text-green-700">
                    {video.category_title}
                  </Badge>
                </div>
                <h1 className="mt-2 text-2xl font-bold sm:text-3xl">{video.title}</h1>
                <div className="mt-4 flex flex-wrap items-center gap-6 text-gray-500">
                  <div className="flex items-center gap-2">
                    <Eye className="h-4 w-4" />
                    <span>{video.views_count} views</span>
                  </div>
                  {video.duration && (
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      <span>{video.duration}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <MessageSquare className="h-4 w-4" />
                    <span>{video.comments_count} comments</span>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Content Tabs */}
              <Tabs defaultValue="video" value={activeTab} onValueChange={setActiveTab} className="space-y-6">
                <TabsList className="bg-white p-1 shadow-sm rounded-lg w-full">
                  <TabsTrigger
                    value="video"
                    className="flex-1 data-[state=active]:bg-[#e8f2e8] data-[state=active]:text-[#2c5530] rounded-md"
                  >
                    <FileText className="mr-2 h-4 w-4" />
                    Video
                  </TabsTrigger>
                  <TabsTrigger
                    value="discussion"
                    className="flex-1 data-[state=active]:bg-[#e8f2e8] data-[state=active]:text-[#2c5530] rounded-md"
                  >
                    <MessageSquare className="mr-2 h-4 w-4" />
                    Discussion ({video.comments_count})
                  </TabsTrigger>
                </TabsList>

                {/* Video Content Tab */}
                <TabsContent value="video" className="space-y-8 mt-6">
                  {/* Author Info */}
                  <AuthorBio
                    authorId={video.author_id}
                    authorName={video.author_name}
                    authorAvatar={video.author_avatar_url}
                    authorBio={video.author_bio}
                  />

                  <Separator />

                  {/* Video Description */}
                  <CardContent className="p-6">
                    <div className="prose prose-green max-w-none">
                      <p>{video.excerpt}</p>
                    </div>
                  </CardContent>

                  {/* Video Actions */}
                  <EngagementBar
                    isLiked={isLiked}
                    likesCount={likesCount}
                    commentsCount={video.comments_count}
                    onLike={toggleLike}
                    onComment={() => setActiveTab('discussion')}
                    onShare={handleShare}
                    isAuthenticated={isAuthenticated}
                  />
                </TabsContent>

                {/* Discussion Tab */}
                <TabsContent value="discussion" className="space-y-6 mt-6">
                  <EngagementBar
                    isLiked={isLiked}
                    likesCount={likesCount}
                    commentsCount={video.comments_count}
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
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Up Next */}
              <RelatedMaterials
                material={video}
                title="Related Materials"
                isLoading={isLoadingRelated}
              />
            </div>
          </div>
        </div>
      </main>
    </div>
  )
} 