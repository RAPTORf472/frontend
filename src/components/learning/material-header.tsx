import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { format, isValid } from "date-fns"
import { motion } from "framer-motion"
import Link from "next/link"
import { useState, useEffect } from "react"
import {
  Calendar,
  ChevronLeft,
  Clock,
  Eye,
  MessageSquare,
  Edit,
  UserCheck,
  UserPlus,
} from "lucide-react"
import { Material } from "@/types/learning"
import { useAuth } from "@/contexts/auth-context"
import { Spinner } from "@/components/ui/spinner"

export interface MaterialHeaderProps {
  material: Material
  category: string
  backLink?: string
  backLabel?: string
}

export function MaterialHeader({
  material,
  category,
  backLink = "/learning",
  backLabel = "Back to Learning"
}: MaterialHeaderProps) {
  const { user, isAuthenticated } = useAuth();
  const [isFollowing, setIsFollowing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [followingList, setFollowingList] = useState<number[]>([]);
  
  // Determine if the current user can edit this material
  const isAdmin = user?.roles && user.roles.includes('admin');
  const isAuthor = user?.id === material.author_id;
  
  // For community content, only the author can edit (not admins)
  // For other content types, either admin or author can edit
  const canEdit = material.type === 'community' 
    ? isAuthor 
    : (isAdmin || isAuthor);

  // Fetch user's following list
  useEffect(() => {
    if (!isAuthenticated || !material.author_id) return;
    
    async function fetchFollowingList() {
      try {
        const token = localStorage.getItem('token');
        if (!token) return;
        
        const response = await fetch('/api/users/following', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (response.ok) {
          const data = await response.json();
          if (data.success && Array.isArray(data.following)) {
            setFollowingList(data.following.map((user: any) => user.id));
            
            // Check if the current author is in the following list
            const isUserFollowing = data.following.some(
              (user: any) => user.followed_id === material.author_id
            );
            
            setIsFollowing(isUserFollowing);
          }
        }
      } catch (error) {
        console.error('Error fetching following list:', error);
      }
    }
    
    fetchFollowingList();
  }, [isAuthenticated, material.author_id]);

  // Handle follow/unfollow action
  const handleFollowToggle = async (followerId: number) => {
    if (!isAuthenticated || !material.author_id) return;
    
    setIsLoading(true);
    try {
      const token = localStorage.getItem('token');
      if (!token) return;
      
      const method = isFollowing ? 'DELETE' : 'POST';
      const response = await fetch(`/api/users/${followerId}/follow`, {
        method,
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      
      
      if (response.ok) {
        setIsFollowing(!isFollowing);
      }
    } catch (error) {
      console.error(`Error ${isFollowing ? 'unfollowing' : 'following'} user:`, error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {/* Header */}
      <header className="shadow-sm relative">
        <div
          className="absolute inset-0 z-0"
          style={{
            backgroundImage: "url('https://4kwallpapers.com/images/walls/thumbs_3t/2445.jpg')",
            backgroundAttachment: "fixed",
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        />
        <div className="absolute inset-0 bg-black/50 z-0" />
        <div className="container px-4 py-8 relative z-10">
          <div className="mx-auto max-w-4xl">
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="mb-8 flex justify-between items-center"
            >
              <Link
                href={backLink}
                className="inline-flex items-center text-sm text-white hover:text-white/80"
              >
                <ChevronLeft className="mr-2 h-4 w-4" />
                {backLabel}
              </Link>
              
              {canEdit && (
                <Link
                  href={`/learning/${material.type}/${material.id}/edit`}
                  className="inline-flex items-center text-sm bg-white/20 text-white py-1 px-3 rounded-md hover:bg-white/30 transition-colors backdrop-blur-sm"
                >
                  <Edit className="mr-2 h-4 w-4" />
                  Edit
                </Link>
              )}
            </motion.div>

            <motion.div
              className="space-y-4"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <div className="flex flex-wrap items-center gap-2">
                {material.category_title && (
                  <Badge className="bg-white/20 text-white backdrop-blur-sm">{material.category_title}</Badge>
                )}
              </div>

              <h1 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
                {material.title}
              </h1>

              {material.excerpt && (
                <p className="text-lg text-white/80">{material.excerpt}</p>
              )}

              <div className="flex flex-wrap items-center gap-6 text-white/80">
                {material.duration && (
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    <span>{material.duration}</span>
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <Eye className="h-4 w-4" />
                  <span>{material.views_count} views</span>
                </div>
                <div className="flex items-center gap-2">
                  <MessageSquare className="h-4 w-4" />
                  <span>{material.comments_count} comments</span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  <span>
                    {material.created_at && isValid(new Date(material.created_at)) 
                      ? format(new Date(material.created_at), 'MMMM d, yyyy')
                      : 'Unknown date'
                    }
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-4 bg-white/10 p-3 rounded-lg backdrop-blur-sm">
                <Avatar className="h-12 w-12 border-2 border-white/30">
                  <AvatarImage src={material.author_avatar_url || "/placeholder.svg?height=32&width=32"} />
                  <AvatarFallback className="bg-white/20 text-white">{material.author_name.substring(0, 2).toUpperCase()}</AvatarFallback>
                </Avatar>
                <div>
                  <div className="font-medium text-white">{material.author_name}</div>
                  <div className="text-sm text-white/80">Author</div>
                </div>
                {isAuthenticated && user?.id !== material.author_id && (
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="ml-auto bg-white/20 text-white border-white/30 hover:bg-white/30 hover:text-white flex items-center gap-2"
                    onClick={() => handleFollowToggle(material.author_id)}
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <Spinner className="h-4 w-4" />
                    ) : isFollowing ? (
                      <>
                        <UserCheck className="h-4 w-4" />
                        Following
                      </>
                    ) : (
                      <>
                        <UserPlus className="h-4 w-4" />
                        Follow
                      </>
                    )}
                  </Button>
                )}
              </div>
            </motion.div>
          </div>
        </div>
      </header>
    </>
  )
} 