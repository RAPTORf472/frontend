"use client"

import { useState, useEffect } from "react"

/**
 * A hook that returns whether a media query matches the current viewport
 * @param query The media query to check
 * @returns True if the media query matches, false otherwise
 */
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(false)
  
  useEffect(() => {
    const media = window.matchMedia(query)
    
    // Initial check
    const updateMatches = () => {
      setMatches(media.matches)
    }
    
    // Set initial value
    updateMatches()
    
    // Listen for changes
    media.addEventListener("change", updateMatches)
    
    // Cleanup
    return () => {
      media.removeEventListener("change", updateMatches)
    }
  }, [query])
  
  return matches
} 