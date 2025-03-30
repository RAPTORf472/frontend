import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { BookOpen, Calendar, Clock, Tag, User } from "lucide-react"
import { isValid, format } from "date-fns"
import { motion } from "framer-motion"

export interface MaterialInfoProps {
  createdAt: string
  duration?: string | null
  category?: string
  categoryPath?: string
  authorName: string
  authorId: number
  tags?: string[]
  className?: string
}

export function MaterialInfo({
  createdAt,
  duration,
  category,
  categoryPath,
  authorName,
  authorId,
  tags,
  className
}: MaterialInfoProps) {
  return (
    <Card className={`bg-white border-none shadow-sm ${className}`}>
      <CardHeader className="pb-2">
        <CardTitle className="text-[#2c5530]">Material Info</CardTitle>
      </CardHeader>
      <CardContent className="p-4 space-y-3">
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-gray-500" />
          <span className="text-sm text-gray-600">
            Published: {createdAt && isValid(new Date(createdAt)) 
              ? format(new Date(createdAt), 'MMMM d, yyyy')
              : 'Unknown date'
            }
          </span>
        </div>
        
        {duration && (
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-gray-500" />
            <span className="text-sm text-gray-600">{duration}</span>
          </div>
        )}
        
        {category && (
          <div className="flex items-center gap-2">
            <BookOpen className="h-4 w-4 text-gray-500" />
            <span className="text-sm text-gray-600">{category}</span>
          </div>
        )}
        
        <div className="flex items-center gap-2">
          <User className="h-4 w-4 text-gray-500" />
          <span className="text-sm text-gray-600">By {authorName}</span>
        </div>
        
        {tags && tags.length > 0 && (
          <>
            <Separator />
            <div className="flex items-center gap-2">
              <Tag className="h-4 w-4 text-gray-500" />
              <span className="text-sm text-gray-600">Tags:</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {tags.map((tag, index) => (
                <Badge 
                  key={index} 
                  variant="outline" 
                  className="bg-[#e8f2e8] text-[#2c5530]"
                >
                  {tag}
                </Badge>
              ))}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
}

export function AnimatedMaterialInfo(props: MaterialInfoProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <MaterialInfo {...props} />
    </motion.div>
  )
} 