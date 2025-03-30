import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Eye, ThumbsUp, MessageSquare, Clock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import Link from 'next/link'
import { FeaturedItem } from '@/types/learning'

interface ArticleCardProps {
  item: FeaturedItem
}

export function ArticleCard({ item }: ArticleCardProps) {
  return (
    <Link href={`/learning/article/${item.content.id}`}>
      <Card className="overflow-hidden h-[300px] border-none shadow-md bg-gradient-to-r from-[#2c5530] to-[#1a3a1a] text-white">
        <div className="grid h-full md:grid-cols-[1.5fr_1fr]">
          <div className="p-6 flex flex-col justify-between">
            <div>
              <Badge className="bg-white/20 text-white hover:bg-white/30 mb-2">
                {item.featured_for}
              </Badge>
              <h3 className="text-2xl font-bold mb-3 line-clamp-2">
                {item.content.title}
              </h3>
              <p className="text-green-100 line-clamp-3">
                {item.content.excerpt}
              </p>
            </div>
            <div className="mt-4">
              <div className="flex items-center gap-4 mb-4">
                <Avatar>
                  <AvatarImage src={item.content.author_avatar_url || "/placeholder.svg?height=32&width=32"} />
                  <AvatarFallback>{item.content.author_name[0]}</AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <div className="font-medium">{item.content.author_name}</div>
                  <div className="flex items-center gap-2 text-sm text-green-100">
                    <span>{item.content.category_title}</span>
                    {item.content.duration && (
                      <>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {item.content.duration}
                        </span>
                      </>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4 text-green-100">
                  <span className="flex items-center gap-1">
                    <Eye className="h-4 w-4" />
                    {item.content.views_count}
                  </span>
                  <span className="flex items-center gap-1">
                    <ThumbsUp className="h-4 w-4" />
                    {item.content.likes_count}
                  </span>
                  <span className="flex items-center gap-1">
                    <MessageSquare className="h-4 w-4" />
                    {item.content.comments_count}
                  </span>
                </div>
                <Button className="bg-white text-[#2c5530] hover:bg-green-50">
                  Read Now
                </Button>
              </div>
            </div>
          </div>
          <div className="relative">
            <img
              src={item.content.thumbnail_url || "/placeholder.svg?height=400&width=300"}
              alt={item.content.title}
              className="absolute inset-0 h-full w-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-l from-black/60 to-transparent" />
          </div>
        </div>
      </Card>
    </Link>
  )
} 