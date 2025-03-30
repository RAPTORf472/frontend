import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { AnimatePresence, motion } from 'framer-motion'
import { VideoCard } from '../featured-cards/VideoCard'
import { ArticleCard } from '../featured-cards/ArticleCard'
import { WikiCard } from '../featured-cards/WikiCard'
import { CommunityCard } from '../featured-cards/CommunityCard'
import { FeaturedItem } from '@/types/learning'

export function FeaturedContent() {
  const [featured, setFeatured] = useState<FeaturedItem[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isHovered, setIsHovered] = useState(false)

  useEffect(() => {
    const fetchFeatured = async () => {
      try {
        const response = await fetch('/api/learning/materials/featured')
        if (!response.ok) {
          throw new Error('Failed to fetch featured content')
        }
        const data = await response.json()
        setFeatured(data)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred')
        console.error('Error fetching featured content:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchFeatured()
  }, [])

  const nextSlide = () => {
    setCurrentIndex((prev) => (prev + 1) % featured.length)
  }

  const prevSlide = () => {
    setCurrentIndex((prev) => (prev - 1 + featured.length) % featured.length)
  }

  // Auto-slide every 5 seconds if not hovered
  useEffect(() => {
    if (featured.length > 1 && !isHovered) {
      const timer = setInterval(nextSlide, 5000)
      return () => clearInterval(timer)
    }
  }, [featured.length, isHovered])

  if (loading) {
    return (
      <div className="w-full h-[300px] animate-pulse bg-gray-200 rounded-lg">
        <div className="h-full flex items-center justify-center">
          <p className="text-gray-400">Loading featured content...</p>
        </div>
      </div>
    )
  }

  if (error || featured.length === 0) {
    return null
  }

  const currentItem = featured[currentIndex]

  const renderCard = (item: FeaturedItem) => {
    switch (item.content.type) {
      case 'video':
        return <VideoCard item={item} />
      case 'article':
        return <ArticleCard item={item} />
      case 'wiki':
        return <WikiCard item={item} />
      case 'community':
        return <CommunityCard item={item} />
      default:
        return null
    }
  }

  return (
    <div 
      className="relative w-full h-[300px]"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <AnimatePresence mode="wait">
        <motion.div
          key={currentIndex}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3, ease: "easeInOut" }}
          className="h-full"
        >
          {renderCard(currentItem)}
        </motion.div>
      </AnimatePresence>

      {featured.length > 1 && (
        <>
          <Button
            variant="outline"
            size="icon"
            className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white shadow-md"
            onClick={(e) => {
              e.preventDefault()
              prevSlide()
            }}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white shadow-md"
            onClick={(e) => {
              e.preventDefault()
              nextSlide()
            }}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
          <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 flex gap-2 p-2">
            {featured.map((_, index) => (
              <button
                key={index}
                className={`w-2 h-2 rounded-full transition-colors ${
                  index === currentIndex ? 'bg-[#2c5530]' : 'bg-gray-300'
                }`}
                onClick={(e) => {
                  e.preventDefault()
                  setCurrentIndex(index)
                }}
              />
            ))}
          </div>
        </>
      )}
    </div>
  )
} 