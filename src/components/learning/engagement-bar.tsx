import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { motion } from "framer-motion"
import {
  Bookmark,
  Heart,
  MessageSquare,
  Share2
} from "lucide-react"

export interface EngagementBarProps {
  isLiked: boolean
  likesCount: number
  commentsCount: number
  isBookmarked?: boolean
  onLike: () => void
  onComment: () => void
  onBookmark?: () => void
  onShare: () => void
  likeLoading?: boolean
  isAuthenticated?: boolean
  className?: string
}

export function EngagementBar({
  isLiked,
  likesCount,
  commentsCount,
  isBookmarked = false,
  onLike,
  onComment,
  onBookmark = () => alert('Bookmark feature not implemented yet'),
  onShare,
  likeLoading = false,
  isAuthenticated = false,
  className
}: EngagementBarProps) {
  return (
    <motion.div 
      variants={{
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0 }
      }}
      className={cn(
        "flex items-center gap-6 border-y py-4",
        className
      )}
    >
      <Button 
        variant="ghost" 
        className={cn(
          "text-gray-600 hover:text-[#e76f51]",
          isLiked ? "text-[#e76f51]" : ""
        )}
        onClick={onLike}
        disabled={likeLoading || !isAuthenticated}
      >
        <Heart className={cn(
          "mr-2 h-4 w-4",
          isLiked ? "fill-current" : ""
        )} />
        {likesCount} Likes
      </Button>
      
      <Button 
        variant="ghost" 
        className="text-gray-600 hover:text-[#2c5530]"
        onClick={onComment}
      >
        <MessageSquare className="mr-2 h-4 w-4" />
        {commentsCount} Comments
      </Button>
      
      <div className="ml-auto flex items-center gap-2">
        <Button 
          variant="ghost" 
          className={cn(
            "text-gray-600 hover:text-[#2c5530]",
            isBookmarked ? "text-[#2c5530]" : ""
          )}
          onClick={onBookmark}
          disabled={!isAuthenticated}
        >
          <Bookmark className={cn(
            "h-4 w-4",
            isBookmarked ? "fill-current" : ""
          )} />
        </Button>
        
        <Button 
          variant="ghost" 
          className="text-gray-600 hover:text-[#2c5530]"
          onClick={onShare}
        >
          <Share2 className="h-4 w-4" />
        </Button>
      </div>
    </motion.div>
  )
} 