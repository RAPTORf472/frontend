import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Spinner } from "@/components/ui/spinner"
import { Badge } from "@/components/ui/badge"
import { ArrowRight, Book, Clock, MessageSquare, Play, User, Film, Eye, Calendar, PlaySquare, ChevronRight, Globe, Leaf, TreePine, BookOpen } from "lucide-react"
import { motion } from "framer-motion"
import Image from "next/image"
import Link from "next/link"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { format, isValid } from "date-fns"
import { cn } from "@/lib/utils"
import { Material, Video } from "@/types/learning"
import { RelatedMaterial } from "."

export interface RelatedMaterialsProps {
  material: Material
  isLoading: boolean
  title?: string
  maxItems?: number
  className?: string
  showViewAll?: boolean
  onViewAll?: () => void
  cardVariant?: "default" | "sidebar" | "compact" | "icon"
  useBoxContainer?: boolean
  boxTitle?: string
  showViewAllButtonInBox?: boolean
  viewAllUrl?: string
  sameTypeForRelatedMaterials?: boolean
}

export function RelatedMaterials({
  material,
  isLoading,
  title = "Related Materials",
  maxItems = 3,
  className,
  showViewAll = true,
  onViewAll,
  cardVariant = "default",
  useBoxContainer = true,
  boxTitle,
  showViewAllButtonInBox = true,
  viewAllUrl,
  sameTypeForRelatedMaterials = false
}: RelatedMaterialsProps) {

  const [relatedMaterials, setrelatedMaterials] = useState<Material[]>([])
  const [isLoadingRelated, setIsLoadingRelated] = useState(false)

  // Fetch related articles
  const fetchrelatedMaterials = async () => {
    if (!material) return;
    setIsLoadingRelated(true);
    try {
      const response = await fetch(`/api/learning/materials/${material.id}/related?sameType=${sameTypeForRelatedMaterials ? 'true' : 'false'}&limit=5`);
      
      if (response.ok) {
        const data = await response.json();
                setrelatedMaterials(data.materials || []);
      }
    } catch (error) {
      console.error('Error fetching related materials:', error);
    } finally {
      setIsLoadingRelated(false);
    }
  };

  useEffect(() => {
    if (material?.id) {
      fetchrelatedMaterials()
    }
  }, [material?.id, material?.author_id])
  
  const displayedMaterials = relatedMaterials.slice(0, maxItems)

  const container = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  }
  
  const item = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  }
  
  const getTypeIcon = (type: Material["type"]) => {
    switch (type) {
      case "article":
        return <Book className="h-4 w-4" />
      case "video":
        return <Film className="h-4 w-4" />
      case "wiki":
        return <Book className="h-4 w-4" />
      default:
        return <Book className="h-4 w-4" />
    }
  }

  // Get wiki icon based on subtype or category
  const getWikiIcon = (material: Material) => {
    // Default icon is TreePine
    let Icon = TreePine;
    
    // Check category or title for keywords that might indicate the type
    const categoryText = material.type?.toLowerCase() || '';
    const titleText = material.title?.toLowerCase() || '';
    
    if (categoryText.includes('maintenance') || titleText.includes('maintenance')) return Leaf;
    if (categoryText.includes('environmental') || titleText.includes('environmental')) return Globe;
    if (categoryText.includes('guide') || titleText.includes('guide')) return BookOpen;
    
    return Icon;
  }
  
  const formatDuration = (duration: string) => {
    // If duration is already in minutes or hours format, return as is
    if (duration?.includes("min") || duration?.includes("h")) {
      return duration;
    }
    
    // If it's a video duration like "10:23"
    if (duration?.includes(":")) {
      return duration;
    }
    
    // Try to parse as minutes
    const minutes = parseInt(duration);
    if (isNaN(minutes)) return duration;
    
    if (minutes < 60) {
      return `${minutes} min read`
    } else {
      const hours = Math.floor(minutes / 60)
      const mins = minutes % 60
      return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`
    }
  }
  
  // Default article card with image, title, excerpt and metadata
  const renderDefaultArticleCard = (material: Material) => {
    return (
      <div className="group block hover:bg-[#f8f9f3] rounded-lg p-2 transition-colors">
        {material.thumbnail_url && (
          <div className="aspect-video relative rounded-md overflow-hidden mb-2">
            <img
              src={material.thumbnail_url || "/placeholder.svg"}
              alt={material.title}
              className="absolute inset-0 h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
            />
          </div>
        )}
        <Badge className="mb-1 bg-[#e8f2e8] text-[#2c5530]">{material.type}</Badge>
        <h3 className="line-clamp-2 text-sm font-semibold group-hover:text-[#2c5530]">
          {material.title}
        </h3>
        <p className="mt-1 text-xs text-gray-500">{material.author_name}</p>
      </div>
    )
  }
  
  // Default video card with play button overlay
  const renderDefaultVideoCard = (material: Video) => {
    return (
      <Card className="h-full border border-gray-100 shadow-sm hover:shadow bg-white overflow-hidden">
        <div className="relative aspect-video overflow-hidden">
          <img
            src={material.thumbnail_url || "/placeholder.svg?height=200&width=300"}
            alt={material.title}
            className="h-full w-full object-cover"
          />
          <div className="absolute inset-0 flex items-center justify-center bg-black/20 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
            <Button variant="outline" className="rounded-full h-12 w-12 p-0 border-2 border-white bg-black/30 hover:bg-black/50">
              <Play className="h-6 w-6 text-white" />
            </Button>
          </div>
          <Badge className="absolute top-2 left-2 bg-[#2c5530] text-white">
            {material.category_title}
          </Badge>
          {material.duration && (
            <div className="absolute bottom-2 right-2 bg-black/60 text-white text-xs px-2 py-1 rounded-md backdrop-blur-sm">
              {material.duration}
            </div>
          )}
        </div>
        
        <CardHeader className="pb-2">
          <CardTitle className="text-base line-clamp-2">{material.title}</CardTitle>
        </CardHeader>
        
        <CardFooter className="flex flex-wrap items-center justify-between">
          <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500">
            {material.author_name && (
              <div className="flex items-center gap-1">
                <User className="h-3 w-3" />
                <span>{material.author_name}</span>
              </div>
            )}
            {material.views_count !== undefined && (
              <div className="flex items-center gap-1">
                <Eye className="h-3 w-3" />
                <span>{material.views_count} views</span>
              </div>
            )}
            {material.comments_count !== undefined && (
              <div className="flex items-center gap-1">
                <MessageSquare className="h-3 w-3" />
                <span>{material.comments_count}</span>
              </div>
            )}
          </div>
        </CardFooter>
      </Card>
    )
  }
  
  // Sidebar video card with horizontal layout
  const renderSidebarVideoCard = (material: Video) => {
    return (
      <div className="group flex cursor-pointer gap-4 rounded-lg p-2 hover:bg-gray-100">
        <div className="relative aspect-video w-40 overflow-hidden rounded-lg">
          <img
            src={material.thumbnail_url || "/placeholder.svg"}
            alt={material.title}
            className="absolute inset-0 h-full w-full object-cover"
          />
          <div className="absolute inset-0 flex items-center justify-center bg-black/20 opacity-0 transition-opacity group-hover:opacity-100">
            <PlaySquare className="h-8 w-8 text-white" />
          </div>
          {material.duration && (
            <Badge
              variant="secondary"
              className="absolute bottom-1 right-1 bg-black/60 text-white backdrop-blur-sm"
            >
              {material.duration}
            </Badge>
          )}
        </div>
        <div className="flex-1">
          <h3 className="line-clamp-2 font-medium group-hover:text-green-600">
            {material.title}
          </h3>
          <p className="mt-1 text-sm text-gray-500">{material.author_name}</p>
          <p className="mt-1 text-sm text-gray-500">{material.views_count} views</p>
        </div>
      </div>
    )
  }

  // Wiki card with icon design
  const renderWikiIconCard = (material: Material) => {
    const Icon = getWikiIcon(material);
    
    return (
      <div className="group flex cursor-pointer items-center gap-3 rounded-lg p-2 hover:bg-gray-100">
        <div className="rounded-full bg-green-100 p-2">
          <Icon className="h-4 w-4 text-green-600" />
        </div>
        <div className="flex-1">
          <h3 className="font-medium group-hover:text-green-600">{material.title}</h3>
          <p className="text-sm text-gray-500">{material.category_title}</p>
        </div>
        <ChevronRight className="h-4 w-4 text-gray-400" />
      </div>
    )
  }
  
  // Render the appropriate card based on type and variant
  const renderCard = (material: RelatedMaterial) => {
    
    // Handle other types
    if (material.type === 'video') {
      return cardVariant === 'sidebar' 
        ? renderSidebarVideoCard(material) 
        : renderDefaultVideoCard(material);
    } else if (material.type === 'wiki') {
      return renderWikiIconCard(material);
    } else {
      // Always use the default article card design for articles and wikis (unless icon variant for wikis)
      return renderDefaultArticleCard(material);
    }
  }
  
  // Content of the component
  const renderContent = () => {
    if (isLoading || isLoadingRelated) {
      return (
        <div className="flex justify-center py-8">
          <Spinner />
        </div>
      );
    }
    
    if (displayedMaterials.length === 0) {
      return (
        <p className="text-center py-8 text-gray-500">No related materials found.</p>
      );
    }
    
    return (
      <>
        <motion.div 
          variants={container}
          initial="hidden"
          animate="visible"
          className="space-y-4"
        >
          {displayedMaterials.map((material) => (
            <motion.div key={material.id} variants={item}>
              <Link 
                href={`/learning/${material.type}/${material.id}`} 
                className={cn(
                  "block transition-colors",
                  cardVariant !== "sidebar" && cardVariant !== "icon" && "hover:scale-[1.02] group"
                )}
              >
                {renderCard(material)}
              </Link>
            </motion.div>
          ))}
        </motion.div>
      </>
    );
  };
  
  // When using box container
  if (useBoxContainer) {
    return (
      <Card className={cn("bg-white border-none shadow-sm", className)}>
        <CardHeader className="pb-2">
          <CardTitle className="text-[#2c5530]">{boxTitle || title}</CardTitle>
        </CardHeader>
        <CardContent className="p-4">
          <div className="space-y-4">
            {renderContent()}
          </div>
        </CardContent>
      </Card>
    );
  }
  
  // Original rendering without box container
  return (
    <div className={className}>
      {title && <h2 className="text-xl font-bold text-[#2c5530] mb-4">{title}</h2>}
      {renderContent()}
    </div>
  );
} 
