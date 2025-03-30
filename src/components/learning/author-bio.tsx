import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { motion } from "framer-motion"
import Link from "next/link"
import { useState, useEffect } from "react"
import { useAuth } from "@/contexts/auth-context"
import { UserCheck, UserPlus } from "lucide-react"
import { Spinner } from "@/components/ui/spinner"

export interface AuthorBioProps {
  authorId: number
  authorName: string
  authorTitle?: string
  authorBio?: string | null
  authorAvatar?: string | null
  className?: string
}

export function AuthorBio({
  authorId,
  authorName,
  authorTitle = "Author",
  authorBio = "Expert in this field with extensive knowledge and experience.",
  authorAvatar,
  className
}: AuthorBioProps) {
  const { user, isAuthenticated } = useAuth();
  const [isFollowing, setIsFollowing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  // Fetch user's following list
  useEffect(() => {
    if (!isAuthenticated || !authorId) return;
    
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
            // Check if the current author is in the following list
            const isUserFollowing = data.following.some(
              (user: any) => user.followed_id === authorId
            );

            
            setIsFollowing(isUserFollowing);
          }
        }
      } catch (error) {
        console.error('Error fetching following list:', error);
      }
    }
    
    fetchFollowingList();
  }, [isAuthenticated, authorId]);

  // Handle follow/unfollow action
  const handleFollowToggle = async () => {
    if (!isAuthenticated || !authorId) return;
    
    setIsLoading(true);
    try {
      const token = localStorage.getItem('token');
      if (!token) return;
      
      const method = isFollowing ? 'DELETE' : 'POST';
      const response = await fetch(`/api/users/${authorId}/follow`, {
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

  const showFollowButton = isAuthenticated && user?.id !== authorId;

  return (
    <motion.div 
      variants={{
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0 }
      }}
      className={className}
    >
      <Card className="border-none shadow-sm bg-[#e8f2e8]">
        <CardContent className="flex flex-col md:flex-row gap-6 p-6">
          <Avatar className="h-20 w-20 mx-auto md:mx-0">
            <AvatarImage 
              src={authorAvatar || `https://ui-avatars.com/api/?name=${authorName}`}
              alt={authorName} 
            />
            <AvatarFallback>{authorName.substring(0, 2).toUpperCase()}</AvatarFallback>
          </Avatar>
          <div className="flex-1 text-center md:text-left">
            <h3 className="text-xl font-bold text-[#2c5530]">{authorName}</h3>
            <p className="text-sm text-gray-600">{authorTitle}</p>
            <p className="mt-2 text-gray-700">
              {authorBio}
            </p>
            <div className="mt-4 flex flex-wrap justify-center md:justify-start gap-4">
              <Button 
                variant="outline" 
                size="sm" 
                className="bg-white hover:bg-white hover:text-[#2c5530]"
                asChild
              >
                <Link href={`/profile/${authorId}`}>View Profile</Link>
              </Button>
              {showFollowButton && (
                <Button 
                  size="sm" 
                  className={`${isFollowing ? 'bg-[#2c5530]/80' : 'bg-[#2c5530]'} hover:bg-[#1a3a1a] flex items-center gap-2`}
                  onClick={handleFollowToggle}
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
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
} 