import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Eye, ThumbsUp, MessageSquare, Users, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import Link from 'next/link'
import { FeaturedItem } from '@/types/learning'

interface CommunityCardProps {
  item: FeaturedItem
}

export function CommunityCard({ item }: CommunityCardProps) {
  return (
    <Link href={`/learning/community/${item.content.id}`}>
      <Card className="overflow-hidden h-[300px] border-none shadow-md bg-gradient-to-r from-[#2c5530] to-[#1a3a1a] text-white">
        <div className="h-full p-6 flex flex-col">
          <div>
            <div className="flex items-center justify-between mb-4">
              <Badge className="bg-white/20 text-white hover:bg-white/30">
                {item.featured_for}
              </Badge>
              <Badge variant="outline" className="border-green-100 text-green-100">
                Community Content
              </Badge>
            </div>
            <h3 className="text-2xl font-bold mb-3 line-clamp-2">
              {item.content.title}
            </h3>
            <p className="text-green-100 line-clamp-3">
              {item.content.excerpt}
            </p>
          </div>

          <div className="flex items-center gap-3 mt-6">
            <Avatar>
              <AvatarImage src={item.content.author_avatar_url || "/placeholder.svg?height=32&width=32"} />
              <AvatarFallback>{item.content.author_name[0]}</AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <div className="font-medium">{item.content.author_name}</div>
              <div className="text-sm text-green-100">{item.content.category_title}</div>
            </div>
            <div className="flex items-center gap-1 text-green-100 text-sm">
              <Users className="h-4 w-4" />
              <span>Community Contributor</span>
            </div>
          </div>

          <div className="mt-auto pt-4 border-t border-white/20">
            <div className="flex items-center justify-between mb-4">
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
            </div>
            <Button className="w-full bg-white text-[#2c5530] hover:bg-green-50">
              Read Community Article
              <ChevronRight className="h-4 w-4 ml-2" />
            </Button>
          </div>
        </div>
      </Card>
    </Link>
  )
} 