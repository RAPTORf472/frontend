"use client"

import { ThumbsUp, MessageCircle, Clock, Eye } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

interface ContentLayoutProps {
  title: string
  category: string
  author: {
    name: string
    avatar: string
  }
  date: string
  metrics: {
    duration?: string
    views?: number
    likes: number
    comments: number
  }
  children: React.ReactNode
}

export function ContentLayout({
  title,
  category,
  author,
  date,
  metrics,
  children,
}: ContentLayoutProps) {
  return (
    <div className="container py-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Badge variant="outline" className="mb-4">
            {category}
          </Badge>
          <h1 className="text-4xl font-bold mb-4">{title}</h1>
          
          {/* Author and date */}
          <div className="flex items-center gap-4 text-muted-foreground">
            <img
              src={author.avatar}
              alt={author.name}
              className="w-8 h-8 rounded-full"
            />
            <span>{author.name}</span>
            <span>•</span>
            <span>{date}</span>
          </div>
          
          {/* Metrics */}
          <div className="flex items-center gap-6 mt-4">
            {metrics.duration && (
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                <span>{metrics.duration}</span>
              </div>
            )}
            {metrics.views && (
              <div className="flex items-center gap-2">
                <Eye className="h-4 w-4" />
                <span>{metrics.views} views</span>
              </div>
            )}
            <div className="flex items-center gap-2">
              <ThumbsUp className="h-4 w-4" />
              <span>{metrics.likes}</span>
            </div>
            <div className="flex items-center gap-2">
              <MessageCircle className="h-4 w-4" />
              <span>{metrics.comments}</span>
            </div>
          </div>
        </div>

        {/* Main content */}
        {children}
      </div>
    </div>
  )
} 