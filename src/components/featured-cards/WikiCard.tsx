import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Eye, ThumbsUp, MessageSquare, BookOpen, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import Link from 'next/link'
import { FeaturedItem } from '@/types/learning'

interface WikiCardProps {
  item: FeaturedItem
}

export function WikiCard({ item }: WikiCardProps) {
  return (
    <Link href={`/learning/wiki/${item.content.id}`}>
      <Card className="overflow-hidden h-[300px] border-none shadow-md bg-gradient-to-r from-[#2c5530] to-[#1a3a1a] text-white">
        <div className="h-full p-6 flex flex-col">
          <div className="flex items-center gap-4 mb-4">
            <div className="rounded-full bg-white/20 p-4">
              <BookOpen className="h-8 w-8 text-white" />
            </div>
            <div>
              <Badge className="bg-white/20 text-white hover:bg-white/30">
                {item.featured_for}
              </Badge>
              <h3 className="text-2xl font-bold mt-2">
                {item.content.title}
              </h3>
            </div>
          </div>

          <p className="text-green-100 line-clamp-4 flex-1">
            {item.content.excerpt}
          </p>

          <div className="mt-6 border-t border-white/20 pt-4">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Avatar>
                  <AvatarImage src={`https://api.dicebear.com/7.x/initials/svg?seed=${item.content.author_name}`} />
                  <AvatarFallback>{item.content.author_name[0]}</AvatarFallback>
                </Avatar>
                <div>
                  <div className="font-medium">{item.content.author_name}</div>
                  <div className="text-sm text-green-100">{item.content.category_title}</div>
                </div>
              </div>
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
              Read Wiki Article
              <ChevronRight className="h-4 w-4 ml-2" />
            </Button>
          </div>
        </div>
      </Card>
    </Link>
  )
} 