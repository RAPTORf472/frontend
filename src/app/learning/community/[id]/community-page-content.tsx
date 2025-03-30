"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Edit,
  History,
  MessageSquare,
  FileText,
  CheckCircle2,
} from "lucide-react"
import Link from "next/link"
import { useAuth } from "@/contexts/auth-context"
import { Spinner } from "@/components/ui/spinner"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useLearningPage } from "@/app/learning/learning-page-base"
import { AuthorBio, Comments, EngagementBar, MaterialHeader, TableOfContents } from "@/components/learning"
import { RelatedMaterials } from "@/components/learning/related-materials"
import { Community } from "@/types/learning"
import { ContentRenderer } from "@/components/learning/content-renderer"

// Define interfaces for the history entries and contributors
interface HistoryEntry {
  date: string;
  action: string;
  username: string;
}

// Define local Contributor interface matching the one in the codebase
interface Contributor {
  username: string;
  avatar?: string;
  contributions: number;
}

interface CommunityPageContentProps {
  params: {
    id: string
  }
}

export function CommunityPageContent({ params }: CommunityPageContentProps) {
  const { isAuthenticated, user } = useAuth();
  const [activeTab, setActiveTab] = useState("article");
  const [isBookmarked, setIsBookmarked] = useState(false);
  
  // Use the shared learning page hooks
  const {
    material,
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
  
  // Cast material to Community type for community-specific properties
  const community = material as Community;
  
  
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

  if (!community) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Alert>
          <AlertDescription>Community article not found</AlertDescription>
        </Alert>
      </div>
    )
  }

  // Check if the current user can edit this community content
  const canEdit = isAuthenticated && (
    user?.roles?.includes('admin') || 
    user?.roles?.includes('moderator') || 
    (user?.id === community.author_id)
  );

  return (
    <div className="min-h-screen bg-[#f8f9f3]">
      {/* Article Header */}
      <div className="relative shadow-sm pb-6">
        <div
          className="absolute inset-0 z-0"
          style={{
            backgroundImage: "url('https://4kwallpapers.com/images/walls/thumbs_3t/2445.jpg')",
            backgroundAttachment: "fixed",
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        />
        <div className="absolute inset-0 bg-black/50 z-0" />
        <MaterialHeader
          material={community}
          category={community.category_title}
          backLink="/learning"
          backLabel="Back to Learning"
        />
        
        <div className="container px-4 relative z-10">
          <div className="mx-auto max-w-4xl">
            <div className="flex gap-2 mt-2">
              {community.status === "verified" && (
                <Badge
                  variant="outline"
                  className="bg-white/20 text-white border-white/30 backdrop-blur-sm flex items-center gap-1"
                >
                  <CheckCircle2 className="h-3 w-3" />
                  Verified
                </Badge>
              )}
            </div>
          </div>
        </div>
      </div>

      <main className="container px-4 py-8">
        <div className="mx-auto max-w-5xl">
          <div className="grid gap-8 lg:grid-cols-[250px_1fr_250px]">
            {/* Left Sidebar */}
            <div className="space-y-6">
              {/* Table of Contents */}
              <div className="top-24 space-y-6">
                <TableOfContents items={tableOfContents} isSticky={false} />
              </div>

              {/* Contributors - if API supports it */}
              {community.contributors && community.contributors.length > 0 && (
                <Card className="border-[#d1e0d3] overflow-hidden">
                  <CardHeader className="bg-[#f0f4e9] border-b border-[#d1e0d3] pb-3">
                    <CardTitle className="text-[#2c5530] text-lg">Contributors</CardTitle>
                  </CardHeader>
                  <CardContent className="p-4">
                    <div className="space-y-4">
                      {community.contributors.map((contributor, index) => (
                        <div key={index} className="flex items-center gap-3">
                          <Avatar>
                            <AvatarImage src={contributor.avatar} />
                            <AvatarFallback>{contributor.username[0]}</AvatarFallback>
                          </Avatar>
                          <div className="flex-1">
                            <div className="font-medium text-gray-900">{contributor.username}</div>
                            <div className="text-sm text-gray-500">{contributor.contributions} edits</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Main Content - Center */}
            <div className="space-y-6">
              {/* Featured Image */}
              {community.thumbnail_url && (
                <div className="relative rounded-xl overflow-hidden shadow-md mb-8">
                  <img
                    src={community.thumbnail_url}
                    alt={community.title}
                    className="w-full h-auto object-cover"
                  />
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-4">
                    <div className="flex flex-wrap gap-2">
                      {community.tags?.map((tag, index) => (
                        <Badge key={index} className="bg-white/20 text-white hover:bg-white/30 backdrop-blur-sm">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
              )}

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
                    Discussion ({community.comments_count})
                  </TabsTrigger>
                </TabsList>

                {/* Article Content */}
                <TabsContent value="article" className="space-y-8 mt-6">
                  <ContentRenderer 
                    content={community.content} onHeadingsFound={handleHeadingsFound}
                  />

                  {/* Article Actions */}
                  <EngagementBar
                    isLiked={isLiked}
                    likesCount={likesCount}
                    commentsCount={community.comments_count}
                    onLike={toggleLike}
                    onComment={() => setActiveTab('discussion')}
                    onShare={handleShare}
                    isAuthenticated={isAuthenticated}
                  />
                  
                  {/* Author Bio - Moved from sidebar to bottom of content */}
                  <Card className="overflow-hidden border-[#d1e0d3]">
                    <CardHeader className="bg-[#f0f4e9] border-b border-[#d1e0d3] pb-3">
                      <CardTitle className="text-[#2c5530] text-lg">About the Author</CardTitle>
                    </CardHeader>
                    <CardContent className="p-4">
                      <AuthorBio
                        authorId={community.author_id}
                        authorName={community.author_name}
                        authorAvatar={community.author_avatar_url}
                        authorBio={community.author_bio}
                        className="m-0"
                      />
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Discussion Tab */}
                <TabsContent value="discussion" className="space-y-6 mt-6">
                  <EngagementBar
                    isLiked={isLiked}
                    likesCount={likesCount}
                    commentsCount={community.comments_count}
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
            
            {/* Right Sidebar - Related Articles */}
            <div className="space-y-6">
              <Card className="overflow-hidden border-[#d1e0d3]">
                <CardHeader className="bg-[#f0f4e9] border-b border-[#d1e0d3] pb-3">
                  <CardTitle className="text-[#2c5530] text-lg">Related Articles</CardTitle>
                </CardHeader>
                <CardContent className="p-4">
                  <RelatedMaterials
                    material={community}
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
  );
} 