"use client"

import { useState, useEffect, useRef } from "react"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import { 
  Users, 
  Send, 
  Image as ImageIcon, 
  X, 
  Settings, 
  Calendar,
  MessageCircle,
  Bell,
  Shield,
  UserPlus,
  UserMinus,
  MoreVertical,
  ThumbsUp,
  MessageSquare,
  MapPin,
  TreePine,
  ChevronLeft,
  Clock,
  Plus,
  Leaf,
  Share2
} from "lucide-react"
import { useAuth } from "@/contexts/auth-context"
import { Spinner } from "@/components/ui/spinner"
import { useRouter } from "next/navigation"
import Link from "next/link"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { formatDistanceToNow } from "date-fns"
import { cn } from "@/lib/utils"
import { useSocket } from '@/contexts/socket-context'
import { useToast } from "@/hooks/use-toast"

interface Group {
  id: number
  name: string
  description: string
  creator_name: string
  creator_id: number
  member_count: number
  image_url: string
  created_at: string
  is_member: boolean
  role: string
}

interface Member {
  id: number
  username: string
  role: string
  joined_at: string
}

interface Post {
  id: number
  content: string
  author_name: string
  author_id: number
  image_url: string | null
  created_at: string
  likes_count: number
  comments_count: number
  comments: Comment[]
  isEditing?: boolean
}

interface Comment {
  id: number
  content: string
  author_name: string
  author_id: number
  created_at: string
}

interface ChatMessage {
  id: number
  content: string
  author_name: string
  author_id: number
  created_at: string
}

export default function GroupPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const { user } = useAuth()
  const { socket, isConnected } = useSocket()
  const { toast } = useToast()
  const [group, setGroup] = useState<Group | null>(null)
  const [members, setMembers] = useState<Member[]>([])
  const [posts, setPosts] = useState<Post[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [postContent, setPostContent] = useState("")
  const [showNewPost, setShowNewPost] = useState(false)
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string>("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState("")
  const [activeTab, setActiveTab] = useState("discussion")
  const [editingPost, setEditingPost] = useState<Post | null>(null)
  const [editContent, setEditContent] = useState("")
  const [showComments, setShowComments] = useState<{ [key: number]: boolean }>({})
  const [comments, setComments] = useState<{ [key: number]: Comment[] }>({})
  const [newComment, setNewComment] = useState<{ [key: number]: string }>({})
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([])
  const [chatMessage, setChatMessage] = useState("")
  const chatEndRef = useRef<HTMLDivElement>(null)
  const [isSendingMessage, setIsSendingMessage] = useState(false)
  const [hasExistingGroup, setHasExistingGroup] = useState(false)

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  }

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 },
  }

  useEffect(() => {
    const fetchGroupData = async () => {
      try {
        const token = localStorage.getItem('token')
        const headers = {
          'Authorization': token ? `Bearer ${token}` : ''
        }

        // Fetch group details
        const groupResponse = await fetch(`/api/groups/${params.id}`, { headers })
        const groupData = await groupResponse.json()
        setGroup(groupData)

        // Fetch members
        const membersResponse = await fetch(`/api/groups/${params.id}/members`, { headers })
        const membersData = await membersResponse.json()
        setMembers(membersData)

        // Fetch posts
        const postsResponse = await fetch(`/api/groups/${params.id}/posts`, { headers })
        const postsData = await postsResponse.json()
        setPosts(postsData)

        // Check if the user is already a member of any group
        if (user) {
          const membershipsResponse = await fetch('/api/groups/memberships', { headers })
          const membershipsData = await membershipsResponse.json()
          // If the user has any group memberships that aren't this group, they can't join this one
          setHasExistingGroup(
            membershipsData.length > 0 && 
            !membershipsData.some((m: any) => m.id === parseInt(params.id))
          )
        }
      } catch (error) {
        console.error('Error fetching group data:', error)
        setError('Failed to load group data')
      } finally {
        setIsLoading(false)
      }
    }

    fetchGroupData()
  }, [params.id, user])

  useEffect(() => {
    const fetchChatMessages = async () => {
      if (activeTab === 'chat' && group?.is_member) {
        try {
          const response = await fetch(
            `/api/groups/${params.id}/chat/messages`,
            {
              headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
              }
            }
          )
          if (response.ok) {
            const messages = await response.json()
            // Store messages in chronological order (oldest first)
            setChatMessages(messages.reverse())
            // Scroll to bottom after messages load, but prevent page scroll
            setTimeout(() => {
              if (chatEndRef.current) {
                const chatContainer = chatEndRef.current.parentElement
                if (chatContainer) {
                  chatContainer.scrollTop = chatContainer.scrollHeight
                }
              }
            }, 100)
          }
        } catch (error) {
          console.error('Error fetching chat messages:', error)
        }
      }
    }

    fetchChatMessages()
  }, [params.id, activeTab, group?.is_member])

  // Add socket listeners for real-time updates
  useEffect(() => {
    if (socket && isConnected && activeTab === 'chat' && group?.is_member) {
            
      // Listen for new group chat messages
      socket.on('group_chat_message', (message: { 
        id: number, 
        content: string, 
        author_name: string,
        author_id: number, 
        group_id: number,
        created_at: string
      }) => {
                
        // Check if message belongs to this group
        if (message.group_id === parseInt(params.id)) {
          // Convert message to ChatMessage format
          const formattedMessage: ChatMessage = {
            id: message.id,
            content: message.content,
            author_name: message.author_name,
            author_id: message.author_id,
            created_at: message.created_at
          }
          
          // Add to messages
          setChatMessages(prev => [...prev, formattedMessage])
          
          // Scroll to bottom
          setTimeout(() => {
            if (chatEndRef.current) {
              const chatContainer = chatEndRef.current.parentElement
              if (chatContainer) {
                chatContainer.scrollTop = chatContainer.scrollHeight
              }
            }
          }, 100)
        }
      })
      
      // Listen for message deletions
      socket.on('group_chat_message_deleted', (data: { message_id: number, group_id: number }) => {
                
        // Only update if message belongs to this group
        if (data.group_id === parseInt(params.id)) {
          setChatMessages(prev => prev.filter(msg => msg.id !== data.message_id))
        }
      })
      
      // Clean up listeners
      return () => {
        socket.off('group_chat_message')
        socket.off('group_chat_message_deleted')
      }
    }
  }, [socket, isConnected, activeTab, group?.is_member, params.id])

  const handleJoinGroup = async () => {
    if (!user) {
      router.push('/auth/login')
      return
    }

    try {
      const response = await fetch(`/api/groups/${params.id}/join`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      })

      const data = await response.json()

      if (response.ok) {
        // Refresh all group data
        const token = localStorage.getItem('token')
        const headers = {
          'Authorization': token ? `Bearer ${token}` : ''
        }

        // Fetch group details
        const groupResponse = await fetch(`/api/groups/${params.id}`, { headers })
        const groupData = await groupResponse.json()
        setGroup(groupData)

        // Fetch members
        const membersResponse = await fetch(`/api/groups/${params.id}/members`, { headers })
        const membersData = await membersResponse.json()
        setMembers(membersData)
        
        // Show success toast
        toast({
          title: "Success",
          description: "You have successfully joined the group",
          variant: "default",
        })
      } else {
        // Show error toast with the error message from the backend
        toast({
          title: "Error",
          description: data.error || "Failed to join group",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error('Error joining group:', error)
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      })
    }
  }

  const handleLeaveGroup = async () => {
    try {
      const response = await fetch(`/api/groups/${params.id}/leave`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      })

      if (response.ok) {
        // Refresh all group data
        const token = localStorage.getItem('token')
        const headers = {
          'Authorization': token ? `Bearer ${token}` : ''
        }

        // Fetch group details
        const groupResponse = await fetch(`/api/groups/${params.id}`, { headers })
        const groupData = await groupResponse.json()
        setGroup(groupData)

        // Fetch members
        const membersResponse = await fetch(`/api/groups/${params.id}/members`, { headers })
        const membersData = await membersResponse.json()
        setMembers(membersData)
      }
    } catch (error) {
      console.error('Error leaving group:', error)
    }
  }

  const handleCreatePost = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!postContent.trim()) return

    setIsSubmitting(true)
    try {
      const response = await fetch(`/api/groups/${params.id}/posts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          content: postContent,
          image_url: imagePreview || undefined
        })
      })

      if (response.ok) {
        setPostContent("")
        setImageFile(null)
        setImagePreview("")
        // Refresh posts
        const postsResponse = await fetch(`/api/groups/${params.id}/posts`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        })
        const postsData = await postsResponse.json()
        setPosts(postsData)
      }
    } catch (error) {
      console.error('Error creating post:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleEditPost = async (post: Post) => {
    setEditingPost(post)
    setEditContent(post.content)
  }

  const handleUpdatePost = async (postId: number) => {
    try {
      const response = await fetch(`/api/groups/${params.id}/posts/${postId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          content: editContent
        })
      })

      if (response.ok) {
        const updatedPost = await response.json()
        setPosts(posts.map(p => p.id === postId ? updatedPost : p))
        setEditingPost(null)
        setEditContent("")
      }
    } catch (error) {
      console.error('Error updating post:', error)
    }
  }

  const handleDeletePost = async (postId: number) => {
    if (!confirm('Are you sure you want to delete this post?')) return

    try {
      const response = await fetch(`/api/groups/${params.id}/posts/${postId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      })

      if (response.ok) {
        setPosts(posts.filter(p => p.id !== postId))
      }
    } catch (error) {
      console.error('Error deleting post:', error)
    }
  }

  const toggleComments = async (postId: number) => {
    setShowComments(prev => ({ ...prev, [postId]: !prev[postId] }))
    
    if (!comments[postId]) {
      try {
        const response = await fetch(
          `/api/groups/${params.id}/posts/${postId}/comments`,
          {
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
          }
        )
        if (response.ok) {
          const data = await response.json()
          setComments(prev => ({ ...prev, [postId]: data }))
        }
      } catch (error) {
        console.error('Error fetching comments:', error)
      }
    }
  }

  const handleAddComment = async (postId: number) => {
    if (!newComment[postId]?.trim()) return

    try {
      const response = await fetch(
        `/api/groups/${params.id}/posts/${postId}/comments`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          },
          body: JSON.stringify({
            content: newComment[postId]
          })
        }
      )

      if (response.ok) {
        const comment = await response.json()
        setComments(prev => ({
          ...prev,
          [postId]: [comment, ...(prev[postId] || [])]
        }))
        setNewComment(prev => ({ ...prev, [postId]: '' }))
        setPosts(posts.map(p => 
          p.id === postId 
            ? { ...p, comments_count: (p.comments_count || 0) + 1 }
            : p
        ))
      }
    } catch (error) {
      console.error('Error adding comment:', error)
    }
  }

  const handleDeleteComment = async (postId: number, commentId: number) => {
    if (!confirm('Are you sure you want to delete this comment?')) return

    try {
      const response = await fetch(
        `/api/groups/${params.id}/posts/${postId}/comments/${commentId}`,
        {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        }
      )

      if (response.ok) {
        setComments(prev => ({
          ...prev,
          [postId]: prev[postId].filter(c => c.id !== commentId)
        }))
        setPosts(posts.map(p => 
          p.id === postId 
            ? { ...p, comments_count: Math.max(0, (p.comments_count || 0) - 1) }
            : p
        ))
      }
    } catch (error) {
      console.error('Error deleting comment:', error)
    }
  }

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!chatMessage.trim() || isSendingMessage) return

    setIsSendingMessage(true)
    try {
      const response = await fetch(
        `/api/groups/${params.id}/chat/messages`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          },
          body: JSON.stringify({
            content: chatMessage
          })
        }
      )

      
      if (response.ok) {
        // No need to update local state here, WebSocket will handle it
        setChatMessage("")
      }
    } catch (error) {
      console.error('Error sending message:', error)
    } finally {
      setIsSendingMessage(false)
    }
  }

  const handleDeleteMessage = async (messageId: number) => {
    if (!confirm('Are you sure you want to delete this message?')) return

    try {
      const response = await fetch(
        `/api/groups/${params.id}/chat/messages/${messageId}`,
        {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        }
      )

      // WebSocket will handle the state update
    } catch (error) {
      console.error('Error deleting message:', error)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Spinner size="lg" className="text-green-600" />
      </div>
    )
  }

  if (!group) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900">Group not found</h2>
          <p className="mt-2 text-gray-600">The group you're looking for doesn't exist.</p>
          <Button asChild className="mt-4">
            <Link href="/groups">Back to Groups</Link>
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#f8f9f3]">
      {/* Group Header */}
      <header className="relative bg-gradient-to-br from-[#2c5530] to-[#1a3a1f] py-12">
        <div className="container px-4">
          <div className="mb-8">
            <Link href="/groups" className="inline-flex items-center text-sm text-white/80 hover:text-white">
              <ChevronLeft className="mr-2 h-4 w-4" />
              Back to Groups
            </Link>
          </div>

          <div className="grid gap-8 lg:grid-cols-[2fr_1fr]">
            <div className="flex items-center gap-6">
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5 }}
              >
                <Avatar className="h-24 w-24 border-4 border-white">
                  <AvatarImage src={group.image_url || "/placeholder.svg"} alt={group.name} />
                  <AvatarFallback className="bg-[#e8f2e8] text-[#2c5530] text-2xl font-bold">
                    {group.name.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
              </motion.div>
              <div>
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5 }}
                  className="flex flex-wrap items-center gap-2"
                >
                  <h1 className="text-3xl font-bold text-white">{group.name}</h1>
                </motion.div>
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.1 }}
                  className="mt-2 flex flex-wrap items-center gap-4 text-white/80"
                >
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    <span>Global</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    <span>{group.member_count} members</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <TreePine className="h-4 w-4" />
                    <span>Created by {group.creator_name}</span>
                  </div>
                </motion.div>
                <motion.p
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.2 }}
                  className="mt-4 max-w-2xl text-white/90"
                >
                  {group.description}
                </motion.p>
              </div>
            </div>
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
              className="flex items-start justify-end gap-2"
            >
              {group.is_member ? (
                <>
                  <Button
                    variant="outline"
                    className="border-white text-white hover:bg-white/20"
                    onClick={handleLeaveGroup}
                  >
                    Leave Group
                  </Button>
                  <Button className="bg-white text-[#2c5530] hover:bg-white/90">
                    <Bell className="mr-2 h-4 w-4" />
                    Notifications
                  </Button>
                  {(group.role === 'admin' || group.role === 'moderator') && (
                    <Button variant="outline" className="border-white text-white hover:bg-white/20">
                      <Settings className="h-4 w-4" />
                    </Button>
                  )}
                </>
              ) : hasExistingGroup ? (
                <Button 
                  className="bg-white/70 text-[#2c5530] opacity-70 cursor-not-allowed" 
                  disabled={true}
                  title="You are already a member of another group"
                >
                  Already in a Group
                </Button>
              ) : (
                <Button className="bg-white text-[#2c5530] hover:bg-white/90" onClick={handleJoinGroup}>
                  Join Group
                </Button>
              )}
            </motion.div>
          </div>
        </div>
        <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-b from-transparent to-[#f8f9f3]" />
      </header>

      {/* Main Content */}
      <main className="container px-4 py-12">
        <div className="grid gap-8 lg:grid-cols-[1fr_300px]">
          {/* Left Column */}
          <div className="space-y-8">
            <Tabs defaultValue="discussion" onValueChange={setActiveTab} className="space-y-8">
              <TabsList className="bg-[#e8f2e8]">
                <TabsTrigger value="discussion" className="data-[state=active]:bg-white">
                  Discussion
                </TabsTrigger>
                <TabsTrigger value="chat" className="data-[state=active]:bg-white">
                  <div className="flex items-center gap-1">
                    <MessageCircle className="h-4 w-4" />
                    <span>Chat</span>
                  </div>
                </TabsTrigger>
              </TabsList>

              <TabsContent value="discussion" className="space-y-6">
                {/* New Post Form */}
                {group.is_member && (
                  <Card className="overflow-hidden border-[#e8f2e8]">
                    <CardContent className="p-6">
                      {!showNewPost ? (
                        <Button
                          variant="outline"
                          className="w-full justify-start border-[#e8f2e8] text-gray-500 hover:bg-[#e8f2e8]/50 hover:text-[#2c5530]"
                          onClick={() => setShowNewPost(true)}
                        >
                          <Plus className="mr-2 h-4 w-4" />
                          Start a discussion
                        </Button>
                      ) : (
                        <motion.div
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="space-y-4"
                        >
                          <Input
                            placeholder="Title (optional)"
                            className="border-[#e8f2e8] focus-visible:ring-[#2c5530]"
                          />
                          <Textarea
                            placeholder="What's on your mind?"
                            className="min-h-[100px] border-[#e8f2e8] focus-visible:ring-[#2c5530]"
                            value={postContent}
                            onChange={(e) => setPostContent(e.target.value)}
                          />
                          <div className="flex items-center gap-2">
                            <Button
                              type="button"
                              variant="outline"
                              className="border-[#e8f2e8]"
                              onClick={() => document.getElementById('post-image')?.click()}
                            >
                              <ImageIcon className="h-4 w-4 mr-2" />
                              Add Image
                            </Button>
                            <input
                              id="post-image"
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={(e) => {
                                const file = e.target.files?.[0]
                                if (file) {
                                  setImageFile(file)
                                  setImagePreview(URL.createObjectURL(file))
                                }
                              }}
                            />
                          </div>
                          {imagePreview && (
                            <div className="relative mt-4">
                              <img
                                src={imagePreview}
                                alt="Preview"
                                className="max-h-48 rounded-lg"
                              />
                              <Button
                                type="button"
                                variant="destructive"
                                size="sm"
                                className="absolute top-2 right-2"
                                onClick={() => {
                                  setImageFile(null)
                                  setImagePreview("")
                                }}
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                          )}
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="outline"
                              className="border-[#e8f2e8]"
                              onClick={() => setShowNewPost(false)}
                            >
                              Cancel
                            </Button>
                            <Button 
                              className="bg-[#2c5530] hover:bg-[#2c5530]/90"
                              onClick={handleCreatePost}
                              disabled={isSubmitting}
                            >
                              {isSubmitting ? (
                                <>
                                  <Spinner size="sm" className="mr-2" />
                                  Posting...
                                </>
                              ) : (
                                'Post'
                              )}
                            </Button>
                          </div>
                        </motion.div>
                      )}
                    </CardContent>
                  </Card>
                )}

                {/* Discussion Posts */}
                <motion.div variants={container} initial="hidden" animate="show">
                  {posts.map((post, index) => (
                    <motion.div key={post.id} variants={item} className="mb-6">
                      <Card className="overflow-hidden border-[#e8f2e8]">
                        <CardContent className="p-6">
                          <div className="flex gap-4">
                            <Avatar className="h-10 w-10">
                              <AvatarImage src="/placeholder.svg" alt={post.author_name} />
                              <AvatarFallback className="bg-[#e8f2e8] text-[#2c5530]">
                                {post.author_name.charAt(0).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1">
                              <div className="flex items-center justify-between">
                                <div>
                                  <span className="font-medium">{post.author_name}</span>
                                  <span className="mx-2 text-gray-300">•</span>
                                  <span className="text-sm text-gray-500">
                                    {formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}
                                  </span>
                                </div>
                                {(user?.id === post.author_id || group.role === 'admin') && (
                                  <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                      <Button variant="ghost" size="sm">
                                        <MoreVertical className="h-4 w-4" />
                                      </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                      {user?.id === post.author_id && (
                                        <DropdownMenuItem onClick={() => handleEditPost(post)}>
                                          Edit
                                        </DropdownMenuItem>
                                      )}
                                      <DropdownMenuItem 
                                        className="text-red-600"
                                        onClick={() => handleDeletePost(post.id)}
                                      >
                                        Delete
                                      </DropdownMenuItem>
                                    </DropdownMenuContent>
                                  </DropdownMenu>
                                )}
                              </div>
                              {editingPost?.id === post.id ? (
                                <div className="space-y-4 mt-2">
                                  <Textarea
                                    value={editContent}
                                    onChange={(e) => setEditContent(e.target.value)}
                                    className="min-h-[100px] border-[#e8f2e8] focus-visible:ring-[#2c5530]"
                                  />
                                  <div className="flex justify-end gap-2">
                                    <Button
                                      variant="outline"
                                      className="border-[#e8f2e8]"
                                      onClick={() => {
                                        setEditingPost(null)
                                        setEditContent("")
                                      }}
                                    >
                                      Cancel
                                    </Button>
                                    <Button 
                                      className="bg-[#2c5530] hover:bg-[#2c5530]/90"
                                      onClick={() => handleUpdatePost(post.id)}
                                    >
                                      Save Changes
                                    </Button>
                                  </div>
                                </div>
                              ) : (
                                <>
                                  <p className="mt-2 text-gray-600">{post.content}</p>
                                  {post.image_url && (
                                    <img
                                      src={post.image_url}
                                      alt="Post image"
                                      className="mt-4 rounded-lg object-cover"
                                    />
                                  )}
                                </>
                              )}
                              <div className="mt-4 flex items-center gap-4">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="text-gray-500 hover:text-[#2c5530] hover:bg-[#e8f2e8]"
                                  onClick={() => toggleComments(post.id)}
                                >
                                  <MessageSquare className="mr-2 h-4 w-4" />
                                  {post.comments_count} Comments
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="text-gray-500 hover:text-[#2c5530] hover:bg-[#e8f2e8]"
                                >
                                  <Share2 className="mr-2 h-4 w-4" />
                                  Share
                                </Button>
                              </div>

                              {/* Comments Section */}
                              {showComments[post.id] && (
                                <div className="mt-4 space-y-4">
                                  {comments[post.id]?.map((comment) => (
                                    <div key={comment.id} className="flex gap-3">
                                      <Avatar className="h-8 w-8">
                                        <AvatarFallback className="bg-[#e8f2e8] text-[#2c5530]">
                                          {comment.author_name.charAt(0).toUpperCase()}
                                        </AvatarFallback>
                                      </Avatar>
                                      <div className="flex-1 rounded-lg bg-[#f8f9f3] p-3">
                                        <div className="flex items-center justify-between">
                                          <span className="font-medium">{comment.author_name}</span>
                                          <div className="flex items-center">
                                            <span className="text-sm text-gray-500">
                                              {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}
                                            </span>
                                            {(user?.id === comment.author_id || group.role === 'admin') && (
                                              <Button
                                                variant="ghost"
                                                size="sm"
                                                className="ml-2 h-6 w-6 p-0"
                                                onClick={() => handleDeleteComment(post.id, comment.id)}
                                              >
                                                <X className="h-4 w-4" />
                                              </Button>
                                            )}
                                          </div>
                                        </div>
                                        <p className="mt-1 text-gray-600">{comment.content}</p>
                                      </div>
                                    </div>
                                  ))}
                                  {group.is_member && (
                                    <div className="flex gap-3">
                                      <Avatar className="h-8 w-8">
                                        <AvatarFallback className="bg-[#e8f2e8] text-[#2c5530]">
                                          {user ? user.username.charAt(0).toUpperCase() : "U"}
                                        </AvatarFallback>
                                      </Avatar>
                                      <div className="flex-1">
                                        <div className="flex gap-2">
                                          <Input
                                            placeholder="Write a comment..."
                                            className="border-[#e8f2e8] focus-visible:ring-[#2c5530]"
                                            value={newComment[post.id] || ''}
                                            onChange={(e) => setNewComment(prev => ({
                                              ...prev,
                                              [post.id]: e.target.value
                                            }))}
                                            onKeyDown={(e) => {
                                              if (e.key === 'Enter' && !e.shiftKey) {
                                                e.preventDefault();
                                                handleAddComment(post.id);
                                              }
                                            }}
                                          />
                                          <Button 
                                            size="icon" 
                                            className="bg-[#2c5530] hover:bg-[#2c5530]/90"
                                            onClick={() => handleAddComment(post.id)}
                                          >
                                            <Send className="h-4 w-4" />
                                          </Button>
                                        </div>
                                      </div>
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))}
                </motion.div>
              </TabsContent>

              <TabsContent value="photos">
                <Card className="border-[#e8f2e8]">
                  <CardContent className="p-6">
                    <div className="flex flex-col items-center justify-center py-8 text-center">
                      <Leaf className="mb-4 h-12 w-12 text-[#2c5530]/30" />
                      <h3 className="text-xl font-medium text-[#2c5530]">Group Photos</h3>
                      <p className="mt-2 text-gray-600">No photos have been uploaded yet</p>
                      <Button className="mt-6 bg-[#2c5530] hover:bg-[#2c5530]/90">Upload Photos</Button>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="chat">
                <Card className="border-[#e8f2e8]">
                  <CardContent className="p-0 overflow-hidden">
                    {!group.is_member ? (
                      <div className="flex flex-col items-center justify-center py-8 text-center p-6">
                        <MessageCircle className="mb-4 h-12 w-12 text-[#2c5530]/30" />
                        <h3 className="text-xl font-medium text-[#2c5530]">Group Chat</h3>
                        <p className="mt-2 text-gray-600">Join the group to participate in chat</p>
                        {hasExistingGroup ? (
                          <div className="mt-4 text-amber-700">
                            You are already a member of another group. You can only be a member of one group at a time.
                          </div>
                        ) : (
                          <Button className="mt-6 bg-[#2c5530] hover:bg-[#2c5530]/90" onClick={handleJoinGroup}>
                            Join Group
                          </Button>
                        )}
                      </div>
                    ) : (
                      <div className="flex flex-col h-[600px]">
                        <div className="flex-1 overflow-y-auto p-4 space-y-4">
                          {chatMessages.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-full text-center">
                              <MessageCircle className="mb-4 h-12 w-12 text-[#2c5530]/30" />
                              <h3 className="text-xl font-medium text-[#2c5530]">No Messages Yet</h3>
                              <p className="mt-2 text-gray-600">Be the first to start a conversation!</p>
                            </div>
                          ) : (
                            <>
                              {chatMessages.map((message) => (
                                <div
                                  key={message.id}
                                  className={`flex flex-col ${
                                    message.author_id === user?.id ? "items-end" : "items-start"
                                  }`}
                                >
                                  <div className="flex items-center space-x-2 mb-1">
                                    <p className="text-sm font-medium">
                                      {message.author_name}
                                    </p>
                                    <span className="text-xs text-gray-500">
                                      {message.created_at && !isNaN(new Date(message.created_at).getTime())
                                        ? formatDistanceToNow(new Date(message.created_at), { addSuffix: true })
                                        : "just now"}
                                    </span>
                                    {message.author_id === user?.id && (
                                      <button 
                                        onClick={() => handleDeleteMessage(message.id)}
                                        className="text-red-500 hover:text-red-700"
                                      >
                                        <X className="h-3 w-3" />
                                      </button>
                                    )}
                                  </div>
                                  <div 
                                    className={`px-4 py-2 rounded-lg max-w-[80%] break-words ${
                                      message.author_id === user?.id
                                        ? "bg-[#2c5530] text-white"
                                        : "bg-gray-100 text-gray-800"
                                    }`}
                                  >
                                    {message.content}
                                  </div>
                                </div>
                              ))}
                              <div ref={chatEndRef} />
                            </>
                          )}
                        </div>
                        <div className="p-4 border-t">
                          <form onSubmit={handleSendMessage} className="flex space-x-2">
                            <Input
                              value={chatMessage}
                              onChange={(e) => setChatMessage(e.target.value)}
                              placeholder="Type a message..."
                              className="flex-1 border-[#e8f2e8] focus-visible:ring-[#2c5530]"
                              disabled={isSendingMessage}
                            />
                            <Button 
                              type="submit" 
                              className="bg-[#2c5530] hover:bg-[#2c5530]/90"
                              disabled={isSendingMessage || !chatMessage.trim()}
                            >
                              {isSendingMessage ? (
                                <Spinner className="h-4 w-4" />
                              ) : (
                                <Send className="h-4 w-4" />
                              )}
                            </Button>
                          </form>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>

          {/* Right Column */}
          <div className="space-y-6">
            {/* About */}
            <Card className="overflow-hidden border-[#e8f2e8]">
              <CardHeader className="bg-[#f8f9f3]">
                <CardTitle className="text-[#2c5530]">About</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 p-5">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Calendar className="h-4 w-4 text-[#2c5530]" />
                  <span>Created {group.created_at && !isNaN(new Date(group.created_at).getTime()) 
                    ? formatDistanceToNow(new Date(group.created_at), { addSuffix: true })
                    : "recently"}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Clock className="h-4 w-4 text-[#2c5530]" />
                  <span>Most active recently</span>
                </div>
                <div className="space-y-2">
                  <h4 className="font-medium text-[#2c5530]">Tags</h4>
                  <div className="flex flex-wrap gap-2">
                    {["Community", "Environment"].map((tag, i) => (
                      <Badge key={i} variant="secondary" className="bg-[#e8f2e8] text-[#2c5530]">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Admins */}
            <Card className="overflow-hidden border-[#e8f2e8]">
              <CardHeader className="bg-[#f8f9f3]">
                <CardTitle className="text-[#2c5530]">Admins</CardTitle>
              </CardHeader>
              <CardContent className="p-5">
                <div className="space-y-4">
                  {members
                    .filter(member => member.role === 'admin')
                    .map((admin) => (
                      <div key={admin.id} className="flex items-center gap-3">
                        <Avatar>
                          <AvatarFallback className="bg-[#e8f2e8] text-[#2c5530]">{admin.username[0]}</AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="font-medium">{admin.username}</div>
                          <div className="text-sm text-gray-500">Group Admin</div>
                        </div>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>

            {/* Active Members */}
            <Card className="overflow-hidden border-[#e8f2e8]">
              <CardHeader className="bg-[#f8f9f3]">
                <CardTitle className="text-[#2c5530]">Active Members</CardTitle>
              </CardHeader>
              <CardContent className="p-5">
                <div className="space-y-4">
                  {members.slice(0, 5).map((member) => (
                    <div key={member.id} className="flex items-center gap-3">
                      <Avatar>
                        <AvatarFallback className="bg-[#e8f2e8] text-[#2c5530]">{member.username[0]}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <div className="font-medium">{member.username}</div>
                        <div className="text-sm text-gray-500">Joined {member.joined_at && !isNaN(new Date(member.joined_at).getTime())
                          ? formatDistanceToNow(new Date(member.joined_at), { addSuffix: true })
                          : "recently"}</div>
                      </div>
                      <Badge variant="secondary" className="bg-[#e76f51]/10 text-[#e76f51]">
                        {member.role === 'admin' ? 'Admin' : 'Member'}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  )
}
