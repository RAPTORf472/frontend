"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Spinner } from "@/components/ui/spinner"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  ChevronLeft,
  Share2,
  Bookmark,
  ThumbsUp,
  MessageSquare,
  Clock,
  BookOpen,
  ChevronRight,
  TreePine,
  Leaf,
  Globe,
  FileText,
} from "lucide-react"
import Link from "next/link"
import { useAuth } from "@/contexts/auth-context"
import { cn } from "@/lib/utils"
import { Textarea } from "@/components/ui/textarea"
import { AuthorBio, Comments, EngagementBar, MaterialHeader, TableOfContents } from "@/components/learning"
import { Material } from "@/types/learning"
import { useLearningPage } from "@/app/learning/learning-page-base"
import { RelatedMaterials } from "@/components/learning/related-materials"
import { ContentRenderer } from "@/components/learning/content-renderer"
import { useState } from "react"

interface WikiPageContentProps {
  params: {
    id: string
  }
}

export function WikiPageContent({ params }: WikiPageContentProps) {

  // Use the same hooks as articles and videos
  const { isAuthenticated } = useAuth();
  const [activeTab, setActiveTab] = useState("article");

  const {
    material: wiki,
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

  if (!wiki) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Alert>
          <AlertDescription>Wiki article not found</AlertDescription>
        </Alert>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#f8f9f3]">
      {/* Wiki Article Header */}
      <MaterialHeader
        material={wiki}
        category={wiki.category_title}
        backLink="/learning"
        backLabel="Back to Learning"
      />

      <main className="container px-4 py-8">
        <div className="mx-auto max-w-4xl">
          <div className="grid gap-8 lg:grid-cols-[1fr_300px]">
            {/* Main Content */}
            <div className="space-y-8">
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
                    Discussion ({wiki.comments_count})
                  </TabsTrigger>
                </TabsList>

                {/* Article Content Tab */}
                <TabsContent value="article" className="space-y-8 mt-6">
                  {/* Table of Contents */}
                  <Card className="overflow-hidden border-[#d1e0d3]">
                    <CardHeader className="bg-[#f0f4e9] border-b border-[#d1e0d3] pb-3">
                      <CardTitle className="text-[#2c5530] text-lg">Table of Contents</CardTitle>
                    </CardHeader>
                    <CardContent className="p-4">
                      <TableOfContents items={tableOfContents} isSticky={false} />
                    </CardContent>
                  </Card>

                  {/* Article Content */}
                  <ContentRenderer
                    content={wiki.content} onHeadingsFound={handleHeadingsFound}
                  />

                  {/* Wiki Actions */}
                  <Card className="overflow-hidden border-[#d1e0d3]">
                    <CardContent className="p-4">
                      <EngagementBar
                        isLiked={isLiked}
                        likesCount={likesCount}
                        commentsCount={wiki.comments_count}
                        onLike={toggleLike}
                        onComment={() => setActiveTab('discussion')}
                        onShare={handleShare}
                        isAuthenticated={isAuthenticated}
                      />
                    </CardContent>
                  </Card>

                  <Card className="overflow-hidden border-[#d1e0d3]">
                    <CardHeader className="bg-[#f0f4e9] border-b border-[#d1e0d3] pb-3">
                      <CardTitle className="text-[#2c5530] text-lg">Author</CardTitle>
                    </CardHeader>
                    <CardContent className="p-4">
                      <AuthorBio
                        authorId={wiki.author_id}
                        authorName={wiki.author_name}
                        authorAvatar={wiki.author_avatar_url}
                        authorBio={wiki.author_bio}
                      />
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Discussion Tab */}
                <TabsContent value="discussion" className="space-y-6 mt-6">
                  <Card className="overflow-hidden border-[#d1e0d3]">
                    <CardContent className="p-4">
                      <EngagementBar
                        isLiked={isLiked}
                        likesCount={likesCount}
                        commentsCount={wiki.comments_count}
                        onLike={toggleLike}
                        onComment={() => setActiveTab("discussion")}
                        onShare={handleShare}
                        isAuthenticated={isAuthenticated}
                      />
                    </CardContent>
                  </Card>
                
                  <Card className="overflow-hidden border-[#d1e0d3]">
                    <CardHeader className="bg-[#f0f4e9] border-b border-[#d1e0d3] pb-3">
                      <CardTitle className="text-[#2c5530] text-lg">Comments</CardTitle>
                    </CardHeader>
                    <CardContent className="p-4">
                      <Comments
                        materialId={params.id}
                        className="mt-0"
                      />
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Related Articles */}
              <Card className="overflow-hidden border-[#d1e0d3]">
                <CardHeader className="bg-[#f0f4e9] border-b border-[#d1e0d3] pb-3">
                  <CardTitle className="text-[#2c5530] text-lg">Related Articles</CardTitle>
                </CardHeader>
                <CardContent className="p-4">
                  <RelatedMaterials
                    material={wiki}
                    isLoading={isLoadingRelated}
                    title=""
                    sameTypeForRelatedMaterials={true}
                  />
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
} 