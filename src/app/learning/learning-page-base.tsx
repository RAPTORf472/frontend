import { useState, useEffect, use, useRef, useCallback } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { useMediaQuery } from '@/hooks/use-media-query';
import { Article, Material } from '@/types/learning';

interface LearningPageResult {
  // Core data
  material: Material | null;
  loading: boolean;
  error: string | null;
  
  // Table of contents
  tableOfContents: { id: string; title: string; level: number }[];
  handleHeadingsFound: (headings: { id: string; text: string; level: number }[]) => void;
  
  // Like functionality
  isLiked: boolean;
  likesCount: number;
  likeLoading: boolean;
  toggleLike: () => Promise<void>;
  
  // Related content
  relatedMaterials: Material[];
  authorArticles: Article[];
  isLoadingRelated: boolean;
  isLoadingAuthor: boolean;
  
  // Completion tracking
  hasCompleted: boolean;
  completionSentRef: React.RefObject<boolean>;
  
  // Motion preferences
  prefersReducedMotion: boolean;
  
  // Additional methods
  handleShare: () => void;
  copyToClipboard: () => void;
}

export interface Category {
  id: number;
  title: string;
  slug: string;
  description?: string;
  icon_name?: string;
}

export interface Heading {
  id: string;
  text: string;
  level: number;
}

interface LearningPageContentProps {
  materialId: string
  sameTypeForRelatedMaterials?: boolean
}

// Base hooks
export function useLearningPage({materialId, sameTypeForRelatedMaterials = false}: LearningPageContentProps) : LearningPageResult {  

  const { user, isAuthenticated } = useAuth()
  const [material, setMaterial] = useState<Material | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [tableOfContents, setTableOfContents] = useState<{ id: string; title: string; level: number }[]>([])
  const [headings, setTableHeadings] = useState<Heading[]>([])
  
  // State for like functionality
  const [isLiked, setIsLiked] = useState(false)
  const [likesCount, setLikesCount] = useState(0)
  const [likeLoading, setLikeLoading] = useState(false)
  
  // State for related articles
  const [relatedMaterials, setrelatedMaterials] = useState<Material[]>([])
  const [authorArticles, setAuthorArticles] = useState<Article[]>([])
  const [isLoadingRelated, setIsLoadingRelated] = useState(false)
  const [isLoadingAuthor, setIsLoadingAuthor] = useState(false)
  
  // State for completion tracking
  const [hasCompleted, setHasCompleted] = useState(false)
  const [hasViewed, setHasViewed] = useState(false)
  const completionSentRef = useRef(false)
  const requestViewSentRef = useRef(false)
  const requestIncrementViewSentRef = useRef(false)
  
  // Media query for reduced motion
  const mediaQuery = useMediaQuery("(prefers-reduced-motion: reduce)")
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false)

  const fetchMaterial = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const token = localStorage.getItem('token')
      const response = await fetch(`/api/learning/materials/${materialId}`, {
        headers: {
          'Authorization': token ? `Bearer ${token}` : '',
        }
      })
      
      if (!response.ok) {
        throw new Error(`Failed to fetch article: ${response.status}`)
      }
      
      const data = await response.json()
            
      // Initialize like state
      setIsLiked(data.is_liked || false)
      setLikesCount(data.likes_count || 0)
      
      setMaterial(data)
      
    } catch (err) {
      console.error('Error fetching material:', err)
      setError(err instanceof Error ? err.message : 'Failed to load material')
    } finally {
      setLoading(false)
    }
  }

  const handleHeadingsFound = useCallback((headings: { id: string; text: string; level: number }[]) => {
    setTableOfContents(
      headings.map(h => ({
        id: h.id,
        title: h.text,
        level: h.level
      }))
    )
  }, []); // Empty dependency array since we don't use any external values

  const incrementView = async () => {
    try {
      // Set flag to prevent duplicate requests
      requestIncrementViewSentRef.current = true;
      
      const token = localStorage.getItem('token');
      
      // Call the API to increment the view count
      const response = await fetch(`/api/learning/materials/${materialId}/increment-view`, {
        method: 'POST',
        headers: {
          'Authorization': token ? `Bearer ${token}` : '',
          'Content-Type': 'application/json',
        }
      });

      if (!response.ok) {
        throw new Error('Failed to increment view count');
      }
      
      const data = await response.json();
          } catch (error) {
      console.error('Error incrementing view count:', error);
      // Reset flag on error to allow retry
      requestIncrementViewSentRef.current = false;
    }
  };

  
  const handleScroll = (threshold: number) => {
    // Calculate how far the user has scrolled
    const scrollTop = window.scrollY;
    const windowHeight = window.innerHeight;
    const documentHeight = Math.max(
      document.body.scrollHeight,
      document.body.offsetHeight,
      document.documentElement.clientHeight,
      document.documentElement.scrollHeight,
      document.documentElement.offsetHeight
    );
    
    // Calculate scroll percentage (0-100)
    const scrollPercentage = (scrollTop / (documentHeight - windowHeight)) * 100;
    
    // Check if user has scrolled past the threshold
    if (scrollPercentage >= threshold && !completionSentRef.current) {
      setHasCompleted(true);
      recordCompletion();
    }
  };

  // Function to record completion
  const recordCompletion = async () => {
    try {
      // Set flag to prevent duplicate requests
      completionSentRef.current = true;
      
      const token = localStorage.getItem('token');
      
      // Call the API to record the completion
      const response = await fetch(`/api/learning/materials/${materialId}/complete`, {
        method: 'POST',
        headers: {
          'Authorization': token ? `Bearer ${token}` : '',
          'Content-Type': 'application/json',
        }
      });
      
      const data = await response.json();
          } catch (error) {
      console.error('Error recording completion:', error);
      // Reset flag on error to allow retry
      completionSentRef.current = false;
      setHasCompleted(false);
    }
  };

  const recordView = async () => {
    try {
      // Set flag to prevent duplicate requests
      requestViewSentRef.current = true;
      
      const token = localStorage.getItem('token');
      
      // Call the API to record the completion
      const response = await fetch(`/api/learning/materials/${materialId}/view`, {
        method: 'POST',
        headers: {
          'Authorization': token ? `Bearer ${token}` : '',
          'Content-Type': 'application/json',
        }
      });
      
      const data = await response.json();
          } catch (error) {
      console.error('Error recording view:', error);
      // Reset flag on error to allow retry
      requestViewSentRef.current = false;
      setHasViewed(false);
    }
  };

  const toggleLike = async () => {
    if (!isAuthenticated) return;
    
    setLikeLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/learning/materials/${materialId}/like`, {
        method: 'POST',
        headers: {
          'Authorization': token ? `Bearer ${token}` : '',
          'Content-Type': 'application/json',
        }
      });
      
      const data = await response.json();
      
      if (response.ok) {
        setIsLiked(!isLiked);
        setLikesCount(prevCount => isLiked ? prevCount - 1 : prevCount + 1);
      }
    } catch (error) {
      console.error('Error toggling like:', error);
    } finally {
      setLikeLoading(false);
    }
  };
  
  const copyToClipboard = () => {
    navigator.clipboard.writeText(window.location.href)
      .then(() => {
        alert("Link copied to clipboard!");
      })
      .catch(err => {
        console.error("Error copying to clipboard:", err);
      });
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: material?.title || 'Material',
        text: material?.excerpt || 'Check out this learning material',
        url: window.location.href
      }).catch(err => {
        console.error('Error sharing material:', err)
      })
    } else {
      // Fallback for browsers that don't support navigator.share
      navigator.clipboard.writeText(window.location.href)
      alert('Link copied to clipboard!')
    }
  }

  useEffect(() => {
    const threshold = 90; // Percentage threshold for completion
    
    // Only track if user is authenticated and completion hasn't been recorded yet
    if (!isAuthenticated || !user || completionSentRef.current || hasCompleted) {
      return;
    }
        // Add scroll event listener
    window.addEventListener('scroll', () => handleScroll(threshold));
    
    // Check initial scroll position (in case content is short)
    handleScroll(threshold);
    
    // Cleanup function
    return () => {
      window.removeEventListener('scroll', () => handleScroll(threshold));
    };
  }, [materialId, isAuthenticated, user, hasCompleted]);

  useEffect(() => {
    fetchMaterial();
  }, [materialId]);

  useEffect(() => {
    // Only increment view once
    if (!requestIncrementViewSentRef.current && materialId) {
      incrementView();
    }
    if (!requestViewSentRef.current && materialId) {
      recordView();
    }
  }, [materialId]); 

  useEffect(() => {
    const handleChange = () => setPrefersReducedMotion(!!mediaQuery)
    
    if (mediaQuery !== undefined) {
      setPrefersReducedMotion(!!mediaQuery)
      window.matchMedia("(prefers-reduced-motion: reduce)").addEventListener("change", handleChange)
      return () => window.matchMedia("(prefers-reduced-motion: reduce)").removeEventListener("change", handleChange)
    }
  }, [mediaQuery])

  return {
    material,
    loading,
    error,
    tableOfContents,
    isLiked,
    likesCount,
    likeLoading,
    relatedMaterials,
    authorArticles,
    isLoadingRelated,
    isLoadingAuthor,
    hasCompleted,
    completionSentRef,
    prefersReducedMotion,
    toggleLike,
    handleHeadingsFound,
    handleShare,
    copyToClipboard
  };

}
