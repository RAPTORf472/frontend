"use client"

import { Input } from "@/components/ui/input"
import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Calendar,
  MapPin,
  Users,
  Clock,
  Share2,
  CalendarPlus,
  TreePine,
  AlertTriangle,
  ChevronLeft,
  Edit,
  Trash2,
  Heart,
  MessageSquare,
  Bookmark,
  ExternalLink,
  CheckCircle2,
  Info,
  Leaf,
  ArrowRight,
} from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import { useMediaQuery } from "@/hooks/use-media-query"
import { cn } from "@/lib/utils"
import { Spinner } from "@/components/ui/spinner"
import { Textarea } from "@/components/ui/textarea"
import { useArrayData } from '@/hooks/use-array-data'
import { EmptyState } from '@/components/ui/empty-state'
import { Event, EventComment } from '@/types/event'
import StaticMap from "@/components/static-map"

export default function EventPage({ params }: { params: { id: string } }) {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [isRegistered, setIsRegistered] = useState(false)
  const [isBookmarked, setIsBookmarked] = useState(false)
  const [isLiked, setIsLiked] = useState(false)
  const [event, setEvent] = useState<Event | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isRegistering, setIsRegistering] = useState(false)
  const router = useRouter()
  const { user, isAuthenticated, isLoading: isAuthLoading } = useAuth()
  const isDesktop = useMediaQuery("(min-width: 1024px)")
  const [userVote, setUserVote] = useState<string | null>(null)
  const [newComment, setNewComment] = useState("")
  const [error, setError] = useState<string | undefined>(undefined)
  
  const {
    data: comments,
    isEmpty: isCommentsEmpty,
    isLoading: isCommentsLoading,
    setData: setComments,
    setIsLoading: setCommentsLoading
  } = useArrayData<EventComment>({
    emptyMessage: 'No comments yet. Be the first to comment!'
  })

  const fadeIn = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.5 },
    },
  }

  const stagger = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  }

  useEffect(() => {
    fetchEvent()
    fetchComments()
  }, [params.id])

  useEffect(() => {
    if (!isAuthLoading && isAuthenticated && user) {
      checkRegistration()
    }
  }, [isAuthLoading, isAuthenticated, user, params.id])

  const fetchEvent = async () => {
    try {
      const response = await fetch(`/api/events/${params.id}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      })
      if (!response.ok) throw new Error('Event not found')
      const data = await response.json()
      
      // Save the event data immediately
      setEvent(data)
      
      // Update registration status from event data
      if (data && 'is_registered' in data) {
        setIsRegistered(!!data.is_registered)
      }
    } catch (error) {
      console.error('Error fetching event:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const checkRegistration = async () => {
    try {
      const response = await fetch(`/api/events/${params.id}/registration`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      })
      const data = await response.json()
      setIsRegistered(data.is_registered)
    } catch (error) {
      console.error('Error checking registration:', error)
    }
  }

  const handleDelete = async () => {
    try {
      const response = await fetch(`/api/events/${params.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      })
      
      if (response.ok) {
        setShowDeleteDialog(false)
        router.push("/events")
      }
    } catch (error) {
      console.error('Error deleting event:', error)
    }
  }

  const handleRegister = async () => {
    if (isAuthLoading) {
      return // Wait for auth to complete
    }

    if (!isAuthenticated || !user) {
      router.push('/auth/login')
      return
    }

    try {
      setIsRegistering(true)
      setError('')
      const token = localStorage.getItem('token')


      if (!token) {
        router.push('/auth/login')
        return
      }

      const endpoint = isRegistered ? 'unregister' : 'register'
      
      // Store current participant count for optimistic update
      const currentParticipantCount = event?.participant_count || 0
      
      // Optimistically update UI
      if (event) {
        setEvent({
          ...event,
          participant_count: isRegistered 
            ? Math.max(0, currentParticipantCount - 1)
            : currentParticipantCount + 1,
          is_registered: !isRegistered
        })
      }
      
      const response = await fetch(`/api/events/${params.id}/${endpoint}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })
      
      const data = await response.json()
      
      if (!response.ok) {
        // Revert optimistic update if request failed
        if (event) {
          setEvent({
            ...event,
            participant_count: currentParticipantCount,
            is_registered: isRegistered
          })
        }
        
        if (response.status === 401) {
          localStorage.removeItem('token')
          router.push('/auth/login')
          return
        }
        throw new Error(data.message || `Failed to ${endpoint} for event`)
      }
      
      if (data.success) {
        setIsRegistered(!isRegistered)
        
        // If the API returned updated event data, use it
        if (data.event) {
          setEvent(data.event)
        } else {
          // Otherwise fetch updated event data after a short delay
          setTimeout(() => {
            fetchEvent()
          }, 500)
        }
      } else {
        // Revert optimistic update if request failed
        if (event) {
          setEvent({
            ...event,
            participant_count: currentParticipantCount,
            is_registered: isRegistered
          })
        }
        throw new Error(data.message || `Failed to ${endpoint} for event`)
      }
    } catch (error) {
      console.error('Error updating registration:', error)
      setError(error instanceof Error ? error.message : 'Failed to update registration')
    } finally {
      setIsRegistering(false)
    }
  }

  const fetchComments = async () => {
    setCommentsLoading(true)
    try {
      const response = await fetch(`/api/events/${params.id}/comments`)
      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch comments')
      }
      
      setComments(data.comments || [])
    } catch (error) {
      console.error('Error fetching comments:', error)
      setError(error instanceof Error ? error.message : 'Failed to fetch comments')
    } finally {
      setCommentsLoading(false)
    }
  }

  const fetchUserVote = async () => {
    try {
      const response = await fetch(`/api/events/${params.id}/vote`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      })
      const data = await response.json()
      setUserVote(data.vote_type)
    } catch (error) {
      console.error('Error fetching user vote:', error)
    }
  }

  const handleVote = async (voteType: string) => {
    if (!user) {
      router.push('/auth/login')
      return
    }

    const token = localStorage.getItem('token')

    try {
      const response = await fetch(`/api/events/${params.id}/vote`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ vote_type: voteType })
      })
      
      if (!response.ok) {
        const errorData = await response.json()
        console.error('Vote error:', errorData)
        return
      }
      
      fetchEvent()
      fetchUserVote()
    } catch (error) {
      console.error('Error voting:', error)
    }
  }

  const handleComment = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) {
      router.push('/auth/login')
      return
    }

    if (!newComment.trim()) return

    setCommentsLoading(true)
    try {
      const response = await fetch(`/api/events/${params.id}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ content: newComment })
      })
      
      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to post comment')
      }
      
      setNewComment("")
      // Add the new comment to the list immediately
      setComments(prevComments => [data.comment, ...prevComments])
    } catch (error) {
      console.error('Error posting comment:', error)
      setError(error instanceof Error ? error.message : 'Failed to post comment')
    } finally {
      setCommentsLoading(false)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Spinner size="lg" className="text-green-600" />
      </div>
    )
  }

  if (!event) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Event not found</p>
      </div>
    )
  }

  const isAdmin = user?.roles?.includes('admin') || user?.roles?.includes('moderator')
  const registrationProgress = (event.participant_count / event.max_participants) * 100
  const spotsRemaining = event.max_participants - event.participant_count  

  return (
    <div className="min-h-screen bg-[#f8f9f3]">
      {/* Event Header */}
      <header className="relative bg-gradient-to-br from-[#2c5530] to-[#1a3a1f] py-12">
        <div className="container px-4">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="mb-8"
          >
            <Link href="/events" className="inline-flex items-center text-sm text-white/80 hover:text-white">
              <ChevronLeft className="mr-2 h-4 w-4" />
              Back to Events
            </Link>
          </motion.div>

          <div className="grid gap-8 lg:grid-cols-2">
            <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.5 }}>
              <div className="flex flex-wrap items-center gap-2">
                {event?.is_featured && <Badge className="bg-[#e76f51]">Featured Event</Badge>}
                <Badge variant="outline" className="border-white/40 text-white">
                  {event?.category_name}
                </Badge>
              </div>
              <h1 className="mt-4 text-3xl font-bold text-white sm:text-4xl">
                {event?.title}
              </h1>
              <div className="mt-6 flex flex-wrap gap-6 text-white/80">
                <div className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  <span>{formatDate(event?.start_date || '')}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  <span>{formatTime(event?.start_date || '')}</span>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="h-5 w-5" />
                  <span>{event?.location}</span>
                </div>
              </div>
              <div className="mt-8 flex flex-wrap items-center gap-4">
                <Button
                  size="lg"
                  className={
                    isRegistered
                      ? "bg-[#2c5530]/80 hover:bg-[#2c5530]"
                      : "bg-[#e76f51] text-white hover:bg-[#e76f51]/90"
                  }
                  onClick={handleRegister}
                  disabled={isRegistering}
                >
                  {isRegistering ? (
                    <Spinner size="sm" className="mr-2" />
                  ) : isRegistered ? (
                    <CheckCircle2 className="mr-2 h-5 w-5" />
                  ) : (
                      <CalendarPlus className="mr-2 h-5 w-5" />
                  )}
                  {isRegistered ? 'Registered' : 'Register Now'}
                </Button>
                <div className="flex gap-2">
                  <Button
                    size="icon"
                    variant="outline"
                    className={cn("border-white/30 text-white hover:bg-white/10", isBookmarked && "bg-white/20")}
                    onClick={() => setIsBookmarked(!isBookmarked)}
                  >
                    <Bookmark className={cn("h-5 w-5", isBookmarked && "fill-white")} />
                  </Button>
                  <Button
                    size="icon"
                    variant="outline"
                    className={cn("border-white/30 text-white hover:bg-white/10", isLiked && "bg-white/20")}
                    onClick={() => setIsLiked(!isLiked)}
                  >
                    <Heart className={cn("h-5 w-5", isLiked && "fill-white")} />
                  </Button>
                  <Button size="icon" variant="outline" className="border-white/30 text-white hover:bg-white/10">
                    <Share2 className="h-5 w-5" />
                </Button>
              </div>
            </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5 }}
              className="relative hidden lg:block"
            >
              <img
                src={event?.image_url || "/placeholder.svg?height=400&width=600"}
                alt={event?.title}
                className="rounded-lg object-cover shadow-lg"
              />
            </motion.div>
          </div>
        </div>
      </header>

      <main className="container px-4 py-12">
        <div className="grid gap-8 lg:grid-cols-[240px_1fr_280px]">
          {/* Left Sidebar */}
          {isDesktop && (
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
              className="space-y-6"
            >
              {/* Event Stats */}
              <Card className="overflow-hidden">
                <CardHeader className="bg-[#e8f2e8] pb-4">
                  <CardTitle className="text-[#2c5530]">Event Stats</CardTitle>
              </CardHeader>
                <CardContent className="p-5 space-y-6">
                    <div>
                    <div className="mb-2 flex items-center justify-between text-sm">
                      <span className="text-gray-600">Registration Progress</span>
                      <span className="font-medium">{event?.participant_count}/{event?.max_participants}</span>
                    </div>
                    <Progress 
                      value={(event?.participant_count || 0) / (event?.max_participants || 1) * 100} 
                      className="h-2 bg-[#e8f2e8]" 
                    />
                    <p className="mt-2 text-xs text-gray-500">
                      {Math.max(0, (event?.max_participants || 0) - (event?.participant_count || 0))} spots remaining
                    </p>
                        </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="rounded-lg border border-[#e8f2e8] p-4 text-center">
                      <TreePine className="mx-auto h-5 w-5 text-[#2c5530]" />
                      <div className="mt-2 text-2xl font-bold text-[#2c5530]">{event?.max_participants}</div>
                      <div className="text-xs text-gray-500">Total Spots</div>
                        </div>
                    <div className="rounded-lg border border-[#e8f2e8] p-4 text-center">
                      <Users className="mx-auto h-5 w-5 text-[#2c5530]" />
                      <div className="mt-2 text-2xl font-bold text-[#2c5530]">{event?.participant_count}</div>
                      <div className="text-xs text-gray-500">Registered</div>
                  </div>
                </div>
              </CardContent>
            </Card>

              {/* Quick Links */}
            <Card>
                <CardHeader className="bg-[#e8f2e8] pb-4">
                  <CardTitle className="text-[#2c5530]">Quick Links</CardTitle>
              </CardHeader>
                <CardContent className="p-0">
                  <div className="divide-y">
                    <Button
                      variant="ghost"
                      className="flex w-full items-center justify-start rounded-none px-5 py-3 font-normal"
                    >
                      <MapPin className="mr-2 h-4 w-4 text-[#2c5530]" />
                    Get Directions
                  </Button>
                    <Button 
                      variant="ghost"
                      className="flex w-full items-center justify-start rounded-none px-5 py-3 font-normal"
                    >
                      <Users className="mr-2 h-4 w-4 text-[#2c5530]" />
                      View Attendees
                    </Button>
                    <Button
                      variant="ghost"
                      className="flex w-full items-center justify-start rounded-none px-5 py-3 font-normal"
                    >
                      <MessageSquare className="mr-2 h-4 w-4 text-[#2c5530]" />
                      Contact Organizer
                    </Button>
                    <Button
                      variant="ghost"
                      className="flex w-full items-center justify-start rounded-none px-5 py-3 font-normal"
                    >
                      <ExternalLink className="mr-2 h-4 w-4 text-[#2c5530]" />
                      Event Website
                    </Button>
                </div>
              </CardContent>
            </Card>

            {/* Admin Actions */}
              {user?.roles?.includes('admin') && (
              <Card className="border-2 border-yellow-200 bg-yellow-50">
                  <CardHeader className="pb-4">
                  <CardTitle className="flex items-center gap-2 text-yellow-800">
                    <AlertTriangle className="h-5 w-5" />
                    Admin Actions
                  </CardTitle>
                </CardHeader>
                  <CardContent className="space-y-4 p-5">
                    <Button className="w-full" variant="outline" onClick={() => router.push(`/events/edit/${params.id}`)}>
                    <Edit className="mr-2 h-4 w-4" />
                    Edit Event
                  </Button>
                  <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
                    <DialogTrigger asChild>
                      <Button className="w-full" variant="destructive">
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete Event
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Delete Event</DialogTitle>
                        <DialogDescription>
                          Are you sure you want to delete this event? This action cannot be undone.
                        </DialogDescription>
                      </DialogHeader>
                      <DialogFooter>
                        <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
                          Cancel
                        </Button>
                        <Button variant="destructive" onClick={handleDelete}>
                          Delete
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </CardContent>
              </Card>
              )}
            </motion.div>
          )}

          {/* Main Content */}
          <motion.div variants={stagger} initial="hidden" animate="visible" className="space-y-8">
            {/* Tabs */}
            <Tabs defaultValue="about" className="w-full">
              <TabsList className="bg-[#e8f2e8] p-1">
                <TabsTrigger value="about" className="data-[state=active]:bg-white">
                  About
                </TabsTrigger>
                <TabsTrigger value="schedule" className="data-[state=active]:bg-white">
                  Schedule
                </TabsTrigger>
                <TabsTrigger value="location" className="data-[state=active]:bg-white">
                  Location
                </TabsTrigger>
                <TabsTrigger value="organizer" className="data-[state=active]:bg-white">
                  Organizer
                </TabsTrigger>
              </TabsList>

              {/* About Tab */}
              <TabsContent value="about" className="mt-6">
                <motion.div variants={fadeIn} className="rounded-xl bg-white p-6 shadow-sm">
                  <h2 className="mb-4 text-xl font-semibold text-[#2c5530]">About This Event</h2>
                  <div className="prose prose-green max-w-none">
                    <p>{event?.description}</p>
                    {event?.requirements && (
                      <>
                        <h3>Requirements</h3>
                        <p>{event.requirements}</p>
                      </>
                    )}
                    {event?.additional_info && (
                      <>
                        <h3>Additional Information</h3>
                        <p>{event.additional_info}</p>
                      </>
                    )}
                  </div>
                </motion.div>
              </TabsContent>

              {/* Schedule Tab */}
              <TabsContent value="schedule" className="mt-6">
                <motion.div variants={fadeIn} className="rounded-xl bg-white p-6 shadow-sm">
                  <h2 className="mb-4 text-xl font-semibold text-[#2c5530]">Event Schedule</h2>
                  <div className="space-y-4">
                    <div className="flex gap-4 border-l-2 border-[#2c5530] pl-4">
                      <div className="w-20 text-sm font-medium text-[#2c5530]">{formatTime(event?.start_date || '')}</div>
                      <div>
                        <h3 className="font-medium">Event Start</h3>
                        <p className="text-sm text-gray-600">Registration and welcome</p>
                      </div>
                    </div>
                    {event?.schedule ? (
                      typeof event.schedule === 'string' ? (
                        (event.schedule as string).split('\n').filter((item: string) => item.trim()).map((item: string, index: number) => {
                          // Split by the first "-" to separate time from title
                          const timeTitleSplit = item.includes('-') ? 
                            [item.substring(0, item.indexOf('-')).trim(), item.substring(item.indexOf('-') + 1).trim()] : 
                            [item, ''];
                          
                          // Further split the title part if it contains a pipe
                          const timeComponent = timeTitleSplit[0];
                          let titleComponent = timeTitleSplit[1];
                          let description = '';
                          
                          if (titleComponent.includes('|')) {
                            const titleParts = titleComponent.split('|');
                            titleComponent = titleParts[0]?.trim() || '';
                            description = titleParts[1]?.trim() || '';
                          }
                          
                          return (
                            <div key={index} className="flex gap-4 border-l-2 border-[#2c5530] pl-4">
                              <div className="w-20 text-sm font-medium text-[#2c5530]">{timeComponent}</div>
                              <div>
                                <h3 className="font-medium">{titleComponent}</h3>
                                {description && <p className="text-sm text-gray-600">{description}</p>}
                              </div>
                            </div>
                          );
                        })
                      ) : Array.isArray(event.schedule) ? (
                        event.schedule.map((item, index) => (
                          <div key={index} className="flex gap-4 border-l-2 border-[#2c5530] pl-4">
                            <div className="w-20 text-sm font-medium text-[#2c5530]">{formatTime(item.time)}</div>
                            <div>
                              <h3 className="font-medium">{item.title}</h3>
                              <p className="text-sm text-gray-600">{item.description}</p>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="flex gap-4 border-l-2 border-[#2c5530] pl-4">
                          <div className="w-20"></div>
                          <div>
                            <p className="text-sm text-gray-600">Schedule details available at the event</p>
                          </div>
                        </div>
                      )
                    ) : null}
                    <div className="flex gap-4 border-l-2 border-[#2c5530] pl-4">
                      <div className="w-20 text-sm font-medium text-[#2c5530]">{formatTime(event?.end_date || '')}</div>
                      <div>
                        <h3 className="font-medium">Event End</h3>
                        <p className="text-sm text-gray-600">Closing remarks and cleanup</p>
                      </div>
                    </div>
                  </div>
                </motion.div>
              </TabsContent>

              <TabsContent value="location" className="mt-6">
                <motion.div variants={fadeIn} className="rounded-xl bg-white p-6 shadow-sm">
                  <h2 className="mb-4 text-xl font-semibold text-[#2c5530]">Event Location</h2>
                  <div className="aspect-video overflow-hidden rounded-lg bg-gray-100">
                    {event?.location ? (
                      <StaticMap address={event.location} />
                    ) : (
                      <div className="flex h-full items-center justify-center">
                        <MapPin className="h-8 w-8 text-gray-400" />
                        <p className="ml-2 text-gray-500">No location available</p>
                      </div>
                    )}
                  </div>
                  <div className="mt-4">
                    <h3 className="font-semibold">{event?.location}</h3>
                    <p className="text-gray-600">{event?.address || event?.location}</p>
                    <div className="mt-4 flex gap-4">
                      <Button 
                        className="bg-[#2c5530] hover:bg-[#2c5530]/90"
                        onClick={() => {
                          if (event?.location) {
                            window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(event.location)}`, '_blank');
                          }
                        }}
                      >
                        Get Directions
                      </Button>
                    </div>
                  </div>
                </motion.div>
              </TabsContent>

              {/* Organizer Tab */}
              <TabsContent value="organizer" className="mt-6">
                <motion.div variants={fadeIn} className="rounded-xl bg-white p-6 shadow-sm">
                  <h2 className="mb-4 text-xl font-semibold text-[#2c5530]">Event Organizer</h2>
                  <div className="flex items-center gap-4">
                    <Avatar className="h-16 w-16">
                      <AvatarImage src={(event?.organizer?.avatar_url) || "/placeholder.svg?height=64&width=64"} alt={(event?.organizer?.name || event?.organizer_name || '')} />
                      <AvatarFallback>
                        {(event?.organizer?.name || event?.organizer_name || '').split(' ').map((n: string) => n[0]).join('')}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <h3 className="text-xl font-semibold">{event?.organizer?.name || event?.organizer_name}</h3>
                      <p className="text-gray-600">@{event?.organizer_username}</p>
                      <div className="mt-2 flex gap-2">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="border-[#e8f2e8]"
                          onClick={() => router.push(`/profile/${event?.organizer_id}`)}
                        >
                          View Profile
                        </Button>
                        <Button 
                          size="sm" 
                          className="bg-[#2c5530] hover:bg-[#2c5530]/90"
                          onClick={() => {
                            if (!isAuthenticated) {
                              router.push('/auth/login')
                              return
                            }
                            // TODO: Implement follow functionality once we have the API endpoint
                          }}
                        >
                          Follow
                        </Button>
                      </div>
                    </div>
                  </div>
                  <div className="mt-6">
                    <h3 className="mb-2 font-semibold">About the Organizer</h3>
                    <p className="text-gray-600">
                      {event?.organizer?.description || 'No description available'}
                    </p>
                    <div className="mt-4">
                      <h3 className="mb-2 font-semibold">Contact Information</h3>
                      {(event?.contact_email || event?.organizer?.email) && (
                        <p className="text-gray-600">
                          Email: <a href={`mailto:${event?.contact_email || event?.organizer?.email}`} className="text-[#2c5530] hover:underline">
                            {event?.contact_email || event?.organizer?.email}
                          </a>
                        </p>
                      )}
                      {(event?.contact_phone || event?.organizer?.phone) && (
                        <p className="text-gray-600">
                          Phone: <a href={`tel:${event?.contact_phone || event?.organizer?.phone}`} className="text-[#2c5530] hover:underline">
                            {event?.contact_phone || event?.organizer?.phone}
                          </a>
                        </p>
                      )}
                    </div>
                  </div>
                </motion.div>
              </TabsContent>
            </Tabs>

            {/* Attendees Section */}
            <motion.div variants={fadeIn} className="rounded-xl bg-white p-6 shadow-sm">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-[#2c5530]">Attendees</h2>
                <Button variant="ghost" className="text-[#2c5530]">
                  View All
                </Button>
              </div>
              <div className="mt-4">
                <div className="flex -space-x-2">
                  {event?.attendees?.slice(0, 5).map((attendee, i) => (
                    <Avatar key={i} className="border-2 border-white">
                      <AvatarImage src={attendee.avatar_url || `/placeholder.svg?height=32&width=32&text=${i + 1}`} />
                      <AvatarFallback>{attendee.name?.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                    </Avatar>
                  ))}
                  {(event?.participant_count || 0) > 5 && (
                    <div className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-white bg-[#e8f2e8] text-xs text-[#2c5530]">
                      +{(event?.participant_count || 0) - 5}
                    </div>
                  )}
                </div>
                <p className="mt-2 text-sm text-gray-600">{event?.participant_count} people are attending this event</p>
              </div>
            </motion.div>
          </motion.div>

          {/* Right Sidebar */}
          {isDesktop && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
              className="space-y-6"
            >
              {/* Registration Card */}
              <Card className="overflow-hidden">
                <CardHeader className="bg-[#e8f2e8] pb-4">
                  <CardTitle className="text-[#2c5530]">Registration</CardTitle>
                </CardHeader>
                <CardContent className="p-5">
                  <div className="space-y-4">
                    <div className="rounded-lg bg-[#f8f9f3] p-4">
                      <div className="flex items-center justify-between">
                        <span className="font-medium">Free Event</span>
                        <Badge className="bg-[#2c5530]">Open</Badge>
                      </div>
                      <p className="mt-1 text-sm text-gray-600">Registration closes in 3 days</p>
                    </div>

                    <Button
                      className={
                        isRegistered
                          ? "w-full bg-[#2c5530]/80 hover:bg-[#2c5530]"
                          : "w-full bg-[#e76f51] hover:bg-[#e76f51]/90"
                      }
                      onClick={handleRegister}
                      disabled={isRegistering}
                    >
                      {isRegistering ? (
                        <Spinner size="sm" className="mr-2" />
                      ) : isRegistered ? (
                        <>
                          <CheckCircle2 className="mr-2 h-4 w-4" />
                          Registered
                        </>
                      ) : (
                        "Register Now"
                      )}
                    </Button>

                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Info className="h-4 w-4" />
                      <span>{Math.max(0, (event?.max_participants || 0) - (event?.participant_count || 0))} spots remaining</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Similar Events */}
            <Card>
                <CardHeader className="bg-[#e8f2e8] pb-4">
                  <CardTitle className="text-[#2c5530]">Similar Events</CardTitle>
              </CardHeader>
                <CardContent className="p-0">
                  <div className="divide-y">
                    {event?.similar_events?.slice(0, 3).map((similarEvent, i) => (
                      <Link href={`/events/${similarEvent.id}`} key={i} className="block hover:bg-gray-50">
                        <div className="p-4">
                          <div className="flex gap-3">
                            <div className="h-12 w-12 flex-shrink-0 rounded-md bg-[#e8f2e8] p-2">
                              <Leaf className="h-full w-full text-[#2c5530]" />
                            </div>
                <div>
                            <h3 className="font-medium line-clamp-1">{similarEvent.title}</h3>
                            <div className="mt-1 flex items-center gap-2 text-xs text-gray-600">
                              <Calendar className="h-3 w-3" />
                              <span>{formatDate(similarEvent.start_date)}</span>
                  </div>
                </div>
                  </div>
                      </div>
                    </Link>
                  ))}
                  <div className="p-4">
                    <Link href="/events">
                      <Button variant="ghost" className="w-full justify-between text-[#2c5530]">
                        View More Events
                        <ArrowRight className="h-4 w-4" />
                      </Button>
                    </Link>
                  </div>
                </div>
              </CardContent>
            </Card>

              {/* Share Card */}
              <Card className="overflow-hidden">
                <CardHeader className="bg-[#e8f2e8] pb-4">
                  <CardTitle className="text-[#2c5530]">Share Event</CardTitle>
                </CardHeader>
                <CardContent className="p-5">
                  <div className="grid grid-cols-4 gap-2">
                    <Button variant="outline" size="icon" className="aspect-square border-[#e8f2e8]">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="24"
                        height="24"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="h-5 w-5 text-blue-600"
                      >
                        <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"></path>
                      </svg>
                    </Button>
                    <Button variant="outline" size="icon" className="aspect-square border-[#e8f2e8]">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="24"
                        height="24"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="h-5 w-5 text-blue-400"
                      >
                        <path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z"></path>
                      </svg>
                    </Button>
                    <Button variant="outline" size="icon" className="aspect-square border-[#e8f2e8]">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="24"
                        height="24"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="h-5 w-5 text-blue-500"
                      >
                        <rect width="20" height="20" x="2" y="2" rx="5" ry="5"></rect>
                        <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
                        <line x1="17.5" x2="17.51" y1="6.5" y2="6.5"></line>
                      </svg>
                    </Button>
                    <Button variant="outline" size="icon" className="aspect-square border-[#e8f2e8]">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="24"
                        height="24"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="h-5 w-5 text-green-600"
                      >
                        <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
                      </svg>
                    </Button>
          </div>
                  <div className="mt-4">
                    <Input
                      readOnly
                      value={`https://greenbuddy.org/events/${params.id}`}
                      className="border-[#e8f2e8] bg-[#f8f9f3] text-sm"
                    />
                    <Button className="mt-2 w-full bg-[#2c5530] hover:bg-[#2c5530]/90">Copy Link</Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </div>
      </main>
    </div>
  )
} 