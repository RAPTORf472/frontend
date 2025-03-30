'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/auth-context';
import Link from 'next/link';
import { 
  ArrowLeft, 
  ThumbsUp, 
  MessageCircle, 
  Lightbulb, 
  Flag, 
  Lock, 
  Share2, 
  Bookmark, 
  MoreHorizontal,
  Calendar,
  Eye,
  CheckCircle2,
  AlertCircle,
  User,
  ChevronLeft,
  Leaf,
  BookOpen,
  Users,
  Sparkles,
  Clock,
  Heart,
  Award,
  MessageSquare,
  TrendingUp,
  Trash2,
  Shield
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Spinner } from '@/components/ui/spinner';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Editor from '@/components/Editor';
import { motion, AnimatePresence } from "framer-motion";
import { Textarea } from "@/components/ui/textarea";
import { RelatedDiscussions } from '@/components/forum/related-discussions';

interface Discussion {
  id: number;
  title: string;
  content: string;
  author_id: number;
  author_name: string;
  category_name: string;
  category_id: number;
  views_count: number;
  likes_count: number;
  replies_count: number;
  created_at: string;
  has_solution: boolean;
  is_closed: boolean;
  is_liked?: boolean;
  user_has_liked?: boolean;
  excerpt?: string;
  is_author?: boolean;
  author_avatar_url?: string;
}

interface Reply {
  id: number;
  content: string;
  author_id: number;
  author_name: string;
  likes_count: number;
  created_at: string;
  is_solution: boolean;
  user_has_liked: boolean;
  author_avatar_url?: string;
}

interface RawReply {
  id: number;
  content?: string;
  author_id: number;
  author_name?: string;
  likes_count?: number;
  created_at?: string;
  is_solution?: boolean;
  user_has_liked?: boolean;
  author_avatar_url?: string;
}

interface RelatedDiscussionProps {
  title: string;
  replies: number;
  views: number;
}

interface TopExpert {
  author_id: number;
  author_name: string;
  likes_count: number;
  author_avatar_url: string;
}

// Content renderer component
function ContentRenderer({ content }: { content: string }) {
  // Process content to determine if it's HTML or plain text
  const processedContent = useMemo(() => {
    if (!content) return { html: '', isHtml: false };
    
    // Check if the content appears to be HTML
    const isHtml = /<[a-z][\s\S]*>/i.test(content);
    
    if (isHtml) {
      // It's HTML, return it directly
      return { html: content, isHtml: true };
    } else {
      // It's plain text, convert newlines to paragraphs
      const paragraphs = content.split('\n').filter(line => line.trim() !== '');
      let html = '';
      
      for (const paragraph of paragraphs) {
        if (paragraph.includes(':') && paragraph.split(':')[0].trim().length < 50) {
          // This might be a section header
          const [title] = paragraph.split(':');
          html += `
            <div class="mt-8 mb-4">
              <h3 class="text-xl font-bold text-[#2c5530] mb-2 flex items-center">
                <div class="bg-[#e9f0e6] p-1 rounded-md mr-2">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="h-4 w-4 text-[#2c5530]">
                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                    <polyline points="22 4 12 14.01 9 11.01"></polyline>
                  </svg>
                </div>
                ${title.trim()}
              </h3>
              <div class="h-1 w-12 bg-[#2c5530] rounded-full mb-4"></div>
            </div>
          `;
        } else {
          // Regular paragraph
          html += `<p class="text-[#2c5530] leading-relaxed mb-4">${paragraph.trim()}</p>`;
        }
      }
      
      return { html, isHtml: false };
    }
  }, [content]);

  return (
    <div 
      className="prose prose-green max-w-none text-[#2c5530]
        prose-headings:text-[#2c5530] prose-headings:font-bold 
        prose-p:text-[#2c5530] prose-p:leading-relaxed 
        prose-a:text-[#3a6b3e] prose-a:hover:underline
        prose-strong:text-[#2c5530] prose-strong:font-semibold
        prose-ul:list-disc prose-ul:pl-5 
        prose-ol:list-decimal prose-ol:pl-5" 
      dangerouslySetInnerHTML={{ __html: processedContent.html }}
    />
  );
}

export default function DiscussionPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const { user } = useAuth();
  const [discussion, setDiscussion] = useState<Discussion | null>(null);
  const [replies, setReplies] = useState<Reply[]>([]);
  const [topExperts, setTopExperts] = useState<TopExpert[]>([]);
  const [replyContent, setReplyContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all');
  const [hasLiked, setHasLiked] = useState(false);
  const [hasBookmarked, setHasBookmarked] = useState(false);
  const [likedReplies, setLikedReplies] = useState<Record<number, boolean>>({});
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const replyInputRef = useRef<HTMLDivElement>(null);
  const [showReplyForm, setShowReplyForm] = useState(false);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  const [thankedReplies, setThankedReplies] = useState<Record<number, boolean>>({});
  const [replyText, setReplyText] = useState('');
  const hasIncrementedView = useRef(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const filteredReplies = () => {
            
    if (!Array.isArray(replies)) {
      console.error('Replies is not an array:', replies);
      return [];
    }
    
    if (activeTab === 'all') return replies;
    if (activeTab === 'solutions') {
      const solutionReplies = replies.filter(reply => reply.is_solution);
            return solutionReplies;
    }
    return replies;
  };

  useEffect(() => {
    const fetchDiscussion = async () => {
      try {
                
        const [discussionRes, repliesRes] = await Promise.all([
          fetch(`/api/forum/discussions/${params.id}`),
          fetch(`/api/forum/discussions/${params.id}/replies`)
        ]);

                        
        const responseText = await discussionRes.text();

        if (!discussionRes.ok) {
          console.error('Discussion response not ok:', discussionRes.status, responseText);
          throw new Error(responseText || 'Discussion not found');
        }

        const discussionData = JSON.parse(responseText);
                
        // Transform discussion data to ensure all fields are present
        const transformedDiscussion = {
          id: discussionData.id,
          title: discussionData.title || '',
          content: discussionData.content || '',
          author_id: discussionData.author_id,
          author_name: discussionData.author_name || 'Unknown',
          category_name: discussionData.category_name || '',
          category_id: discussionData.category_id,
          views_count: discussionData.views_count || 0,
          likes_count: discussionData.likes_count || 0,
          replies_count: discussionData.replies_count || 0,
          created_at: discussionData.created_at || new Date().toISOString(),
          has_solution: Boolean(discussionData.has_solution),
          is_closed: Boolean(discussionData.is_closed),
          is_liked: Boolean(discussionData.is_liked),
          user_has_liked: Boolean(discussionData.user_has_liked),
          excerpt: discussionData.excerpt || '',
          is_author: Boolean(discussionData.is_author),
          author_avatar_url: discussionData.author_avatar_url || ''
        };
        
        setDiscussion(transformedDiscussion);
        
        // Handle replies response
        const repliesText = await repliesRes.text();
                
        try {
          const repliesData = JSON.parse(repliesText);
                    
          // Handle the wrapped replies data from the API
          const repliesArray = Array.isArray(repliesData) ? repliesData : repliesData.replies || [];
                    
          // Transform replies to ensure consistent structure
          const transformedReplies = repliesArray.map((reply: RawReply) => ({
            id: reply.id,
            content: reply.content || '',
            author_id: reply.author_id,
            author_name: reply.author_name || 'Unknown',
            likes_count: reply.likes_count || 0,
            created_at: reply.created_at || new Date().toISOString(),
            is_solution: Boolean(reply.is_solution),
            user_has_liked: Boolean(reply.user_has_liked),
            author_avatar_url: reply.author_avatar_url || ''
          }));
          
          setReplies(transformedReplies);
          
          // Update liked replies
          if (user) {
            const likedRepliesMap = transformedReplies.reduce((acc: Record<number, boolean>, reply: Reply) => {
              if (reply.user_has_liked) {
                acc[reply.id] = true;
              }
              return acc;
            }, {});
            setLikedReplies(likedRepliesMap);
          }
        } catch (e) {
          console.error('Error parsing replies:', e);
          setReplies([]);
        }

        if (!transformedDiscussion || typeof transformedDiscussion !== 'object') {
          console.error('Invalid discussion data:', transformedDiscussion);
          throw new Error('Invalid discussion data');
        }

        // Check if user has already liked this discussion
        if (user && transformedDiscussion.user_has_liked) {
          setHasLiked(true);
        }
      } catch (error) {
        console.error('Error in fetchDiscussion:', error);
        setError('Failed to load the discussion. Please try again later.');
        if (error instanceof Error && error.message.includes('Discussion not found')) {
          router.push('/forum');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchDiscussion();
    // Reset view tracking when discussion ID changes
    hasIncrementedView.current = false;
  }, [params.id, router, user]);

  // Track view when discussion is loaded
  useEffect(() => {
    const trackView = async () => {
      if (discussion && !hasIncrementedView.current) {
        try {
          await fetch(`/api/forum/discussions/${params.id}/view`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': localStorage.getItem('token') ? `Bearer ${localStorage.getItem('token')}` : '',
            },
          });
          hasIncrementedView.current = true;
        } catch (viewError) {
          console.error('Error tracking view:', viewError);
          // Non-critical error, don't affect the UI
        }
      }
    };
    
    trackView();
  }, [discussion, params.id]);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)")
    setPrefersReducedMotion(mediaQuery.matches)

    const handleChange = () => setPrefersReducedMotion(mediaQuery.matches)
    mediaQuery.addEventListener("change", handleChange)

    return () => mediaQuery.removeEventListener("change", handleChange)
  }, [])

  const getAnimationProps = (variants: any) => {
    return prefersReducedMotion ? {} : variants
  }

  const showSuccessMessage = (message: string) => {
    setSuccessMessage(message);
    setTimeout(() => {
      setSuccessMessage(null);
    }, 3000);
  };

  const showErrorMessage = (message: string) => {
    setError(message);
    setTimeout(() => {
      setError(null);
    }, 3000);
  };

  const handleLike = async () => {
    if (!user) {
      router.push('/auth/login');
      return;
    }

    if (hasLiked) return;

    try {
      const response = await fetch(`/api/forum/discussions/${params.id}/like`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok && discussion) {
        setDiscussion({
          ...discussion,
          likes_count: discussion.likes_count + 1
        });
        setHasLiked(true);
        showSuccessMessage('Discussion liked successfully!');
      } else {
        const errorData = await response.json();
        showErrorMessage(errorData.message || 'Failed to like discussion');
      }
    } catch (error) {
      console.error('Error liking discussion:', error);
      showErrorMessage('An error occurred while liking the discussion');
    }
  };

  const handleReplyLike = async (replyId: number) => {
    if (!user) {
      router.push('/auth/login');
      return;
    }

    if (likedReplies[replyId]) return;

    try {
      const response = await fetch(`/api/forum/discussions/${params.id}/replies/${replyId}/like`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        setReplies(replies.map(reply => 
          reply.id === replyId 
            ? { ...reply, likes_count: reply.likes_count + 1 }
            : reply
        ));
        setLikedReplies(prev => ({
          ...prev,
          [replyId]: true
        }));
        showSuccessMessage('Reply liked successfully!');
      } else {
        const errorData = await response.json();
        showErrorMessage(errorData.message || 'Failed to like reply');
      }
    } catch (error) {
      console.error('Error liking reply:', error);
      showErrorMessage('An error occurred while liking the reply');
    }
  };

  const handleMarkSolution = async (replyId: number) => {
    if (!user) {
      router.push('/auth/login');
      return;
    }
    
    if (!discussion) {
      return;
    }
    
    if (user.id !== discussion.author_id) {
      showErrorMessage('Only the discussion author can mark a solution');
      return;
    }

    try {
            const token = localStorage.getItem('token');
      
      if (!token) {
        showErrorMessage('You need to be logged in to mark a solution');
        return;
      }

      // Log the URL we're trying to access
      const url = `/api/forum/discussions/${params.id}/solution/${replyId}`;
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      
      if (!response.ok) {
        const error = await response.json();
        console.error('Error marking solution:', error);
        showErrorMessage(error.message || 'Failed to mark solution');
        return;
      }

      // Update the replies state
      setReplies(replies.map(reply => 
        reply.id === replyId 
          ? { ...reply, is_solution: true }
          : { ...reply, is_solution: false }
      ));

      // Update the discussion state
      setDiscussion({ ...discussion, has_solution: true });
      showSuccessMessage('Solution marked successfully!');
    } catch (error) {
      console.error('Error marking solution:', error);
      showErrorMessage('An error occurred while marking the solution');
    }
  };

  const handleCloseDiscussion = async () => {
    if (!user) {
      router.push('/auth/login');
      return;
    }
    
    if (!discussion) {
      return;
    }
    
    if (user.id !== discussion.author_id) {
      showErrorMessage('Only the discussion author can close this discussion');
      return;
    }

    try {
      const response = await fetch(`/api/forum/discussions/${params.id}/close`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        setDiscussion({ ...discussion, is_closed: true });
        showSuccessMessage('Discussion closed successfully!');
      } else {
        const errorData = await response.json();
        showErrorMessage(errorData.message || 'Failed to close discussion');
      }
    } catch (error) {
      console.error('Error closing discussion:', error);
      showErrorMessage('An error occurred while closing the discussion');
    }
  };

  const handleBookmark = () => {
    setHasBookmarked(!hasBookmarked);
    // TODO: Implement actual bookmarking functionality
  };

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    // TODO: Add a toast notification
  };

  const scrollToReply = () => {
    replyInputRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSubmitReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      router.push('/auth/login');
      return;
    }

    if (!replyText.trim()) {
      showErrorMessage('Reply content cannot be empty');
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch(`/api/forum/discussions/${params.id}/replies`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ content: replyText })
      });

      if (response.ok) {
        const data = await response.json();
        // Handle both direct reply and wrapped reply response
        const newReply = data.reply || data;
                
        setReplies([...replies, newReply]);
        setReplyText('');
        if (discussion) {
          setDiscussion({
            ...discussion,
            replies_count: discussion.replies_count + 1
          });
        }
        showSuccessMessage('Reply posted successfully!');
      } else {
        const errorData = await response.json();
        showErrorMessage(errorData.message || 'Failed to post reply');
      }
    } catch (error) {
      console.error('Error submitting reply:', error);
      showErrorMessage('An error occurred while posting your reply');
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (diffInSeconds < 0) return 'just now';
    if (diffInSeconds < 60) return `${diffInSeconds} second${diffInSeconds === 1 ? '' : 's'} ago`;
    
    const diffInMinutes = Math.floor(diffInSeconds / 60);
    if (diffInMinutes < 60) return `${diffInMinutes} minute${diffInMinutes === 1 ? '' : 's'} ago`;
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours} hour${diffInHours === 1 ? '' : 's'} ago`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays} day${diffInDays === 1 ? '' : 's'} ago`;
    
    const diffInWeeks = Math.floor(diffInDays / 7);
    if (diffInWeeks < 4) return `${diffInWeeks} week${diffInWeeks === 1 ? '' : 's'} ago`;
    
    const diffInMonths = Math.floor(diffInDays / 30);
    if (diffInMonths < 12) return `${diffInMonths} month${diffInMonths === 1 ? '' : 's'} ago`;
    
    const diffInYears = Math.floor(diffInDays / 365);
    return `${diffInYears} year${diffInYears === 1 ? '' : 's'} ago`;
  };

  const handleThank = (index: number) => {
    setThankedReplies((prev) => ({
      ...prev,
      [index]: !prev[index],
    }));
  };

  useEffect(() => {
    const fetchTopExperts = async () => {
                  if (!discussion?.category_id) return;
      try {
                const token = localStorage.getItem('token');
        const response = await fetch(`/api/forum/categories/${discussion.category_id}/experts`, {
          headers: {
            'Authorization': `Bearer ${token || ''}`
          }
        });
        
        if (!response.ok) {
          console.error('Failed to fetch experts:', response.status);
          return;
        }

        const data = await response.json();
                
        // Check if data has experts property
        if (data.experts && Array.isArray(data.experts)) {
          setTopExperts(data.experts);
        } else if (Array.isArray(data)) {
          setTopExperts(data);
        } else {
          console.warn('Unexpected response format for experts:', data);
          setTopExperts([]);
        }
      } catch (error) {
        console.error('Error fetching top experts:', error);
      }
    };

    fetchTopExperts();
  }, [discussion]);

  // Check if user is admin
  const isAdmin = useMemo(() => {
    return user?.roles?.includes('admin') || false;
  }, [user]);

  // Function to handle discussion deletion
  const handleDeleteDiscussion = async () => {
    if (!isAdmin) return;
    
    try {
      setIsDeleting(true);
      const token = localStorage.getItem('token');
      
      const response = await fetch(`/api/forum/discussions/${params.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        router.push('/forum');
        showSuccessMessage('Discussion deleted successfully');
      } else {
        const error = await response.json();
        showErrorMessage(error.message || 'Failed to delete discussion');
      }
    } catch (error) {
      console.error('Error deleting discussion:', error);
      showErrorMessage('An error occurred while deleting the discussion');
    } finally {
      setIsDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Spinner className="h-8 w-8" />
      </div>
    );
  }

  if (!discussion) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Discussion not found</h1>
          <Link href="/forum">
            <Button>
              <ChevronLeft className="h-4 w-4 mr-2" />
              Back to Forum
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8f9f3]">
      {/* Success Message */}
      <AnimatePresence>
        {successMessage && (
          <motion.div
            className="fixed top-4 right-4 z-50 bg-green-100 border border-green-400 text-green-800 px-4 py-3 rounded-lg shadow-lg flex items-center gap-2"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            <CheckCircle2 className="h-5 w-5 mr-2 text-green-500" />
            <span>{successMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Error Message */}
      <AnimatePresence>
        {error && (
          <motion.div
            className="fixed top-4 right-4 z-50 bg-red-100 border border-red-400 text-red-800 px-4 py-3 rounded-lg shadow-lg flex items-center gap-2"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            <AlertCircle className="h-5 w-5 mr-2 text-red-500" />
            <span>{error}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
              <Shield className="h-5 w-5 text-red-500 mr-2" />
              Confirm Delete
            </h3>
            <p className="text-gray-700 mb-6">
              Are you sure you want to delete this discussion? This action cannot be undone and will remove all associated replies.
            </p>
            <div className="flex justify-end space-x-3">
              <Button 
                variant="outline" 
                onClick={() => setShowDeleteConfirm(false)}
                disabled={isDeleting}
              >
                Cancel
              </Button>
              <Button 
                variant="destructive" 
                className="bg-red-600 hover:bg-red-700 flex items-center"
                onClick={handleDeleteDiscussion}
                disabled={isDeleting}
              >
                {isDeleting ? (
                  <>
                    <Spinner className="mr-2 h-4 w-4" />
                    Deleting...
                  </>
                ) : (
                  <>
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete Discussion
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
      
      <main className="container px-4 py-8 mx-auto max-w-6xl">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center">
            <Link
              href="/forum"
              className="inline-flex items-center text-sm text-gray-600 hover:text-[#2c5530]"
            >
              <ChevronLeft className="mr-2 h-4 w-4" />
              Back to Forum
            </Link>
          </div>
          
          {/* Admin Controls */}
          {isAdmin && (
            <div className="flex items-center space-x-2">
              <Badge className="bg-red-100 text-red-700 border-red-200 flex items-center">
                <Shield className="h-3 w-3 mr-1" />
                Admin
              </Badge>
              <Button 
                variant="destructive" 
                size="sm" 
                className="bg-red-600 hover:bg-red-700 flex items-center text-xs"
                onClick={() => setShowDeleteConfirm(true)}
              >
                <Trash2 className="h-3.5 w-3.5 mr-1" />
                Delete
              </Button>
            </div>
          )}
        </div>
        
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Left Sidebar */}
          <motion.div
            className="lg:w-64 shrink-0"
            initial={getAnimationProps({ opacity: 0, x: -30 })}
            animate={getAnimationProps({ opacity: 1, x: 0 })}
            transition={{ duration: 0.5 }}
          >
            <div className="sticky top-20">
              <motion.div
                className="mb-6"
                initial={getAnimationProps({ opacity: 0, y: 10 })}
                animate={getAnimationProps({ opacity: 1, y: 0 })}
                transition={{ delay: 0.2 }}
              >

              </motion.div>

              <motion.div
                initial={getAnimationProps({ opacity: 0, y: 20 })}
                animate={getAnimationProps({ opacity: 1, y: 0 })}
                transition={{ delay: 0.3, duration: 0.5 }}
                className="p-4 bg-[#f0f4e9] rounded-lg border border-[#d1e0d3]"
              >
                <h3 className="font-medium text-[#2c5530] mb-2">Discussion Stats</h3>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="flex items-center gap-1 text-[#5a7d61]">
                    <MessageSquare className="h-4 w-4" />
                    <span>{discussion?.replies_count || 0} replies</span>
                  </div>
                  <div className="flex items-center gap-1 text-[#5a7d61]">
                    <Eye className="h-4 w-4" />
                    <span>{discussion?.views_count || 0} views</span>
                  </div>
                  <div className="flex items-center gap-1 text-[#5a7d61]">
                    <ThumbsUp className="h-4 w-4" />
                    <span>{discussion?.likes_count || 0} likes</span>
                  </div>
                  <div className="flex items-center gap-1 text-[#5a7d61]">
                    <Clock className="h-4 w-4" />
                    <span>2 hours ago</span>
                  </div>
                </div>
              </motion.div>
            </div>
          </motion.div>

          {/* Main Content */}
          <div className="flex-1">
            {/* Discussion Header */}
            <motion.div
              initial={getAnimationProps({ opacity: 0, y: 20 })}
              animate={getAnimationProps({ opacity: 1, y: 0 })}
              transition={{ duration: 0.5 }}
            >
              <div className="mb-6">
                <div className="flex flex-wrap items-center gap-2 mb-3">
                  <h1 className="text-2xl font-bold text-[#2c5530]">
                    {discussion?.title || "Loading..."}
                  </h1>
                  <Badge variant="secondary" className="bg-[#e9f0e6] text-[#2c5530]">
                    {discussion?.category_name || "General"}
                  </Badge>
                  {discussion?.has_solution && (
                    <Badge variant="secondary" className="bg-[#e76f51]/10 text-[#e76f51]">
                      <CheckCircle2 className="mr-1 h-3 w-3" />
                      Solved
                    </Badge>
                  )}
                </div>

                <div className="flex items-center gap-3">
                  <Avatar className="h-10 w-10 border-2 border-[#d1e0d3]">
                    <AvatarImage src= {discussion?.author_avatar_url || "/placeholder.svg?height=40&width=40"} />
                    <AvatarFallback className="bg-[#e9f0e6] text-[#2c5530]">
                      {discussion?.author_name?.[0] || 'U'}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="font-medium text-[#2c5530]">{discussion?.author_name}</div>
                    <div className="text-sm text-[#5a7d61]">Posted {discussion?.created_at ? getTimeAgo(discussion.created_at) : 'recently'}</div>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Original Post */}
            <motion.div
              initial={getAnimationProps({ opacity: 0, y: 30 })}
              animate={getAnimationProps({ opacity: 1, y: 0 })}
              transition={{ delay: 0.2, duration: 0.5 }}
            >
              <Card className="mb-8 border-[#d1e0d3] bg-white">
                <CardContent className="p-6">
                  <div className="prose prose-green max-w-none">
                    <ContentRenderer content={discussion?.content || ''} />
                  </div>
                  <div className="mt-6 flex flex-wrap items-center gap-3">
                    <motion.div
                      whileHover={getAnimationProps({ scale: 1.05 })}
                      whileTap={getAnimationProps({ scale: 0.95 })}
                    >
                      <Button
                        variant="outline"
                        size="sm"
                        className={`border-[#d1e0d3] text-[#2c5530] hover:bg-[#f0f4e9] hover:text-[#2c5530] ${hasLiked ? "bg-[#f0f4e9]" : ""}`}
                        onClick={handleLike}
                        disabled={hasLiked}
                      >
                        <ThumbsUp className="mr-2 h-4 w-4" />
                        Helpful ({discussion?.likes_count || 0})
                      </Button>
                    </motion.div>
                    <motion.div
                      whileHover={getAnimationProps({ scale: 1.05 })}
                      whileTap={getAnimationProps({ scale: 0.95 })}
                    >
                      <Button
                        variant="outline"
                        size="sm"
                        className="border-[#d1e0d3] text-[#2c5530] hover:bg-[#f0f4e9] hover:text-[#2c5530]"
                        onClick={handleShare}
                      >
                        <Share2 className="mr-2 h-4 w-4" />
                        Share
                      </Button>
                    </motion.div>
                    <motion.div
                      whileHover={getAnimationProps({ scale: 1.05 })}
                      whileTap={getAnimationProps({ scale: 0.95 })}
                    >
                      <Button
                        variant="outline"
                        size="sm"
                        className="border-[#d1e0d3] text-[#2c5530] hover:bg-[#f0f4e9] hover:text-[#2c5530]"
                        onClick={handleBookmark}
                      >
                        <Bookmark className="mr-2 h-4 w-4" />
                        Save
                      </Button>
                    </motion.div>
                    <motion.div
                      whileHover={getAnimationProps({ scale: 1.05 })}
                      whileTap={getAnimationProps({ scale: 0.95 })}
                    >
                      <Button
                        variant="outline"
                        size="sm"
                        className="border-[#d1e0d3] text-[#2c5530] hover:bg-[#f0f4e9] hover:text-[#2c5530]"
                      >
                        <Flag className="mr-2 h-4 w-4" />
                        Report
                      </Button>
                    </motion.div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
            
            {/* Replies Section */}
            <div className="space-y-6 mb-8">
              <motion.h2
                className="text-xl font-bold text-[#2c5530]"
                initial={getAnimationProps({ opacity: 0, y: 20 })}
                animate={getAnimationProps({ opacity: 1, y: 0 })}
                transition={{ delay: 0.3, duration: 0.5 }}
              >
                Replies ({discussion?.replies_count || 0})
              </motion.h2>

              <motion.div
                variants={{
                  hidden: { opacity: 0 },
                  visible: {
                    opacity: 1,
                    transition: {
                      staggerChildren: 0.1,
                    },
                  },
                }}
                initial="hidden"
                animate="visible"
              >
                {replies.length === 0 ? (
                  <Card className="p-8 text-center text-[#5a7d61] border border-dashed border-[#d1e0d3]">
                    <MessageSquare className="h-12 w-12 mx-auto mb-4 text-[#d1e0d3]" />
                    <p className="text-lg font-medium mb-2">No replies yet</p>
                    <p className="mb-4">Be the first to share your thoughts!</p>
                    <Button 
                      onClick={() => setShowReplyForm(true)}
                      className="bg-[#2c5530] hover:bg-[#3a6b3e] text-white"
                    >
                      Add a Reply
                    </Button>
                  </Card>
                ) : (
                  replies.map((reply, index) => (
                    <motion.div
                      key={reply.id}
                      variants={{
                        hidden: { opacity: 0, y: 20 },
                        visible: {
                          opacity: 1,
                          y: 0,
                          transition: {
                            type: "spring",
                            stiffness: 100,
                            damping: 15,
                          },
                        },
                      }}
                      className="mb-4"
                    >
                      <Card className={`border-[#d1e0d3] bg-white hover:shadow-md transition-all duration-300 ${reply.is_solution ? 'border-[#e76f51] bg-[#e76f51]/5' : ''}`}>
                        <CardContent className="p-6">
                          {reply.is_solution && (
                            <div className="flex items-center gap-2 text-[#e76f51] mb-3 pb-3 border-b border-[#e76f51]/20">
                              <CheckCircle2 className="h-5 w-5" />
                              <span className="font-medium">Marked as Solution</span>
                            </div>
                          )}
                          <div className="flex gap-4">
                            <motion.div
                              whileHover={getAnimationProps({ scale: 1.1 })}
                              transition={{ type: "spring", stiffness: 400, damping: 10 }}
                            >
                              <Avatar className="h-10 w-10 border-2 border-[#d1e0d3]">
                                <AvatarImage src={reply.author_avatar_url || "/placeholder.svg?height=40&width=40"} />
                                <AvatarFallback className="bg-[#e9f0e6] text-[#2c5530]">
                                  {reply.author_name?.[0] || 'U'}
                                </AvatarFallback>
                              </Avatar>
                            </motion.div>
                            <div className="flex-1">
                              <div className="flex flex-wrap items-center gap-2">
                                <span className="font-medium text-[#2c5530]">{reply.author_name}</span>
                                {reply.author_id === discussion?.author_id && (
                                  <Badge variant="secondary" className="bg-[#e76f51]/10 text-[#e76f51]">
                                    <Award className="mr-1 h-3 w-3" />
                                    Author
                                  </Badge>
                                )}
                                <span className="text-sm text-[#5a7d61]">{getTimeAgo(reply.created_at)}</span>
                              </div>
                              <div className="mt-2">
                                <ContentRenderer content={reply.content} />
                              </div>
                              <div className="mt-4 flex flex-wrap items-center gap-4">
                                <motion.div
                                  whileHover={getAnimationProps({ scale: 1.1 })}
                                  whileTap={getAnimationProps({ scale: 0.95 })}
                                >
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className={`${likedReplies[reply.id] ? "text-[#2c5530] bg-[#f0f4e9]" : "text-[#5a7d61]"} hover:text-[#2c5530] hover:bg-[#f0f4e9]`}
                                    onClick={() => handleReplyLike(reply.id)}
                                    disabled={likedReplies[reply.id]}
                                  >
                                    <ThumbsUp className="mr-2 h-4 w-4" />
                                    {reply.likes_count}
                                  </Button>
                                </motion.div>
                                <motion.div
                                  whileHover={getAnimationProps({ scale: 1.1 })}
                                  whileTap={getAnimationProps({ scale: 0.95 })}
                                >
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="text-[#5a7d61] hover:text-[#2c5530] hover:bg-[#f0f4e9]"
                                    onClick={() => setShowReplyForm(true)}
                                  >
                                    <MessageSquare className="mr-2 h-4 w-4" />
                                    Reply
                                  </Button>
                                </motion.div>
                                <motion.div
                                  whileHover={getAnimationProps({ scale: 1.1 })}
                                  whileTap={getAnimationProps({ scale: 0.95 })}
                                >
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className={`${thankedReplies[reply.id] ? "text-[#e76f51] bg-[#e76f51]/10" : "text-[#e76f51]/80"} hover:text-[#e76f51] hover:bg-[#e76f51]/10`}
                                    onClick={() => handleThank(reply.id)}
                                  >
                                    <Heart className={`mr-2 h-4 w-4 ${thankedReplies[reply.id] ? "fill-[#e76f51]" : ""}`} />
                                    Thank
                                  </Button>
                                </motion.div>
                                {discussion?.author_id === user?.id && !reply.is_solution && !discussion.is_closed && (
                                  <motion.div
                                    whileHover={getAnimationProps({ scale: 1.1 })}
                                    whileTap={getAnimationProps({ scale: 0.95 })}
                                  >
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="text-[#2c5530] hover:bg-[#f0f4e9]"
                                      onClick={() => handleMarkSolution(reply.id)}
                                    >
                                      <CheckCircle2 className="mr-2 h-4 w-4" />
                                      Mark as Solution
                                    </Button>
                                  </motion.div>
                                )}
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))
                )}
              </motion.div>
            </div>
            
            {/* Reply Form */}
            <AnimatePresence>
              {showReplyForm && (
                <motion.div
                  initial={getAnimationProps({ opacity: 0, height: 0 })}
                  animate={getAnimationProps({ opacity: 1, height: "auto" })}
                  exit={getAnimationProps({ opacity: 0, height: 0 })}
                  transition={{ duration: 0.3 }}
                  className="mb-8"
                >
                  <Card className="border-[#d1e0d3] bg-white overflow-hidden">
                    <CardHeader className="bg-[#f0f4e9] border-b border-[#d1e0d3] pb-3">
                      <CardTitle className="text-[#2c5530]">Write Your Reply</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4 p-6">
                      <Textarea
                        placeholder="Share your thoughts..."
                        className="min-h-[150px] border-[#d1e0d3] focus-visible:ring-[#2c5530]"
                        value={replyText}
                        onChange={(e) => setReplyText(e.target.value)}
                      />
                      <div className="flex gap-2">
                        <motion.div
                          whileHover={getAnimationProps({ scale: 1.02 })}
                          whileTap={getAnimationProps({ scale: 0.98 })}
                        >
                          <Button 
                            onClick={handleSubmitReply}
                            disabled={!replyText.trim() || isSubmitting}
                            className="bg-[#2c5530] hover:bg-[#3a6b3e] text-white"
                          >
                            {isSubmitting ? (
                              <>
                                <Spinner className="mr-2 h-4 w-4" />
                                Posting...
                              </>
                            ) : (
                              <>
                                <MessageSquare className="mr-2 h-4 w-4" />
                                Post Reply
                              </>
                            )}
                          </Button>
                        </motion.div>
                        <motion.div
                          whileHover={getAnimationProps({ scale: 1.02 })}
                          whileTap={getAnimationProps({ scale: 0.98 })}
                        >
                          <Button
                            variant="outline"
                            onClick={() => {
                              setShowReplyForm(false)
                              setReplyText("")
                            }}
                            className="border-[#d1e0d3] text-[#2c5530] hover:bg-[#f0f4e9]"
                          >
                            Cancel
                          </Button>
                        </motion.div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Right Sidebar */}
          <motion.div
            className="lg:w-72 shrink-0"
            initial={getAnimationProps({ opacity: 0, x: 30 })}
            animate={getAnimationProps({ opacity: 1, x: 0 })}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <div className="sticky top-20 space-y-6">
              {/* Related Discussions */}
              <RelatedDiscussions discussionId={parseInt(params.id)} limit={5} />

              {/* Top Category Experts */}
              <Card className="border-[#d1e0d3] overflow-hidden bg-white">
                <CardHeader className="bg-[#f0f4e9] border-b border-[#d1e0d3] pb-3">
                  <CardTitle className="text-[#2c5530] text-lg">Top Category Experts</CardTitle>
                </CardHeader>
                <CardContent className="p-4">
                  <div className="space-y-4">
                    {topExperts.length === 0 ? (
                      <div className="text-center text-[#5a7d61] py-2">
                        <p>No experts found in this category</p>
                      </div>
                    ) : (
                      topExperts.map((expert, index) => (
                        <motion.div
                          key={expert.author_id}
                          className="flex items-center gap-3"
                          whileHover={getAnimationProps({ x: 5 })}
                        >
                          <Avatar className="border-2 border-[#d1e0d3]">
                            <AvatarImage src={expert.author_avatar_url || "/placeholder.svg?height=40&width=40"} />
                            <AvatarFallback className="bg-[#e9f0e6] text-[#2c5530]">
                              {expert.author_name[0]}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1">
                            <div className="font-medium text-[#2c5530]">{expert.author_name}</div>
                            <div className="flex items-center gap-2 mt-1 text-xs text-[#5a7d61]">
                              <div className="flex items-center gap-1">
                                <ThumbsUp className="h-3 w-3" />
                                <span>{expert.likes_count} helpful replies</span>
                              </div>
                              {index === 0 && (
                                <Badge variant="secondary" className="bg-[#e76f51]/10 text-[#e76f51]">
                                  <Award className="mr-1 h-3 w-3" />
                                  Top Expert
                                </Badge>
                              )}
                            </div>
                          </div>
                        </motion.div>
                      ))
                    )}
                  </div>
                </CardContent>
              </Card>

              
            </div>
          </motion.div>
        </div>
      </main>
    </div>
  );
}

function RelatedDiscussion({ title, replies, views }: RelatedDiscussionProps) {
  return (
    <Link href="#" className="block p-2 rounded-lg hover:bg-[#f0f4e9] transition-colors">
      <h4 className="font-medium text-[#2c5530] text-sm">{title}</h4>
      <div className="flex items-center gap-3 mt-1 text-xs text-[#5a7d61]">
        <div className="flex items-center gap-1">
          <MessageSquare className="h-3 w-3" />
          <span>{replies}</span>
        </div>
        <div className="flex items-center gap-1">
          <Eye className="h-3 w-3" />
          <span>{views}</span>
        </div>
      </div>
    </Link>
  );
} 
