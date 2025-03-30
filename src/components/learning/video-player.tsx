"use client"

import { useState } from "react"
import { Play } from "lucide-react"
import type { YouTubeProps, YouTubeEvent } from "react-youtube"

// Import YouTube component with type assertion
const YouTube = require("react-youtube").default

interface VideoPlayerProps {
  url: string
  thumbnail: string
}

export function VideoPlayer({ url, thumbnail }: VideoPlayerProps) {
  const [playing, setPlaying] = useState(false)
  
  // Extract YouTube video ID from URL if needed
  const getYouTubeId = (url: string) => {
    // If it's already just an ID, return it
    if (url.length === 11 && /^[A-Za-z0-9_-]{11}$/.test(url)) return url
    
    // Try to extract from various YouTube URL formats
    const patterns = [
      /(?:youtube\.com\/(?:[^\/\n\s]+\/\S+\/|(?:v|e(?:mbed)?)\/|\S*?[?&]v=)|youtu\.be\/)([a-zA-Z0-9_-]{11})/,
      /youtube\.com\/shorts\/([a-zA-Z0-9_-]{11})/
    ]
    
    for (const pattern of patterns) {
      const match = url.match(pattern)
      if (match && match[1]) return match[1]
    }
    
    return url
  }

  const videoId = getYouTubeId(url)
  
  // YouTube player options
  const opts: YouTubeProps['opts'] = {
    height: '100%',
    width: '100%',
    playerVars: {
      // https://developers.google.com/youtube/player_parameters
      autoplay: 1,
      rel: 0,
      modestbranding: 1,
    },
  }

  const handlePlay = () => {
    setPlaying(true)
  }

  return (
    <div className="aspect-video bg-black rounded-lg relative overflow-hidden">
      {!playing ? (
        <>
          {/* Thumbnail */}
          <img
            src={thumbnail}
            alt="Video thumbnail"
            className="absolute inset-0 w-full h-full object-cover"
          />
          
          {/* Play button */}
          <div className="absolute inset-0 flex items-center justify-center">
            <button 
              className="bg-white/20 hover:bg-white/30 rounded-full p-4 backdrop-blur-sm transition-colors"
              onClick={handlePlay}
            >
              <Play className="h-8 w-8 text-white" />
            </button>
          </div>
        </>
      ) : (
        <YouTube 
          videoId={videoId} 
          opts={opts} 
          className="absolute inset-0 w-full h-full"
        />
      )}
    </div>
  )
} 