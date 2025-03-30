"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Calendar,
  MapPin,
  Users,
  Clock,
  Search,
  Filter,
  Plus,
  Leaf,
  BookOpen,
  Trash2,
  TreePine,
  Sprout,
  Flower2,
  Droplets,
  Trophy,
  ArrowRight,
  Star
} from "lucide-react"
import Link from "next/link"
import { useMediaQuery } from "@/hooks/use-media-query"
import { cn } from "@/lib/utils"
import { Spinner } from "@/components/ui/spinner"
import { EmptyState } from "@/components/ui/empty-state"
import { useArrayData } from "@/hooks/use-array-data"
import { Event, EventCategory } from '@/types/event'

interface Category {
  id: number
  name: string
  description: string
  count?: number
}

export default function EventsPage() {
  const { user } = useAuth()
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategory, setSelectedCategory] = useState<string>("")
  const [categories, setCategories] = useState<Category[]>([])
  const [isCategoriesLoading, setCategoriesLoading] = useState(true)
  const [featuredEvent, setFeaturedEvent] = useState<Event | null>(null)
  const [error, setError] = useState<string | null>(null)
  const isDesktop = useMediaQuery("(min-width: 1024px)")
  const [allEvents, setAllEvents] = useState<Event[]>([])
  const [quickStats, setQuickStats] = useState({
    upcomingEvents: 0,
    thisMonth: 0,
    yourRSVPs: 0
  });
  

  const {
    data: events,
    isEmpty: isEventsEmpty,
    isLoading: isEventsLoading,
    setData: setEvents,
    setIsLoading: setEventsLoading
  } = useArrayData<Event>({
    emptyMessage: 'No events found.'
  })
  // Get top 3 events by participant count and randomly select one as featured
  const getRandomFeaturedEvent = (events: Event[]) => {
    if (!events.length) return null;
    
    // Sort events by participant count in descending order
    const sortedEvents = [...events].sort((a, b) => b.participant_count - a.participant_count);
    
    // Get top 3 events (or fewer if less than 3 events exist)
    const topEvents = sortedEvents.slice(0, 3);
    
    // Randomly select one of the top events
    const randomIndex = Math.floor(Math.random() * topEvents.length);
    return topEvents[randomIndex];
  }

  // Inside the EventsPage component, add this new function after getRandomFeaturedEvent:
  const getFeaturedEvents = (events: Event[]) => {
    return events.filter(event => event.is_featured).sort((a, b) => b.participant_count - a.participant_count);
  }

  // New function to filter events in the frontend
  const filterEvents = () => {
    if (!allEvents.length) return;
    
    let filteredEvents = [...allEvents];
    
    // Apply category filter if selected
    if (selectedCategory) {
      filteredEvents = filteredEvents.filter(event => 
        event.category_name?.toLowerCase() === selectedCategory.toLowerCase()
      );
    }
    
    // Apply search filter if query exists
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filteredEvents = filteredEvents.filter(event => 
        event.title.toLowerCase().includes(query) || 
        event.description.toLowerCase().includes(query) ||
        event.location.toLowerCase().includes(query)
      );
    }
    
    // Update the events state with filtered results
    setEvents(filteredEvents);
  }

  useEffect(() => {
    fetchCategories()
    fetchEvents()
  }, [])

  // Filter events whenever search query or category changes
  useEffect(() => {
    filterEvents();
  }, [selectedCategory, searchQuery]);

  // Update featured event when events change
  useEffect(() => {
    if (events.length > 0 && !featuredEvent) {
      setFeaturedEvent(getRandomFeaturedEvent(events))
    }
  }, [events, featuredEvent])

   // Add a useEffect to update quickStats when events change
   useEffect(() => {
    if (allEvents.length > 0) {
      // Get current date info for "this month" calculation
      const now = new Date();
      const currentMonth = now.getMonth();
      const currentYear = now.getFullYear();
      
      setQuickStats({
        upcomingEvents: allEvents.length,
        thisMonth: allEvents.filter(event => {
          const eventDate = new Date(event.start_date);
          return eventDate.getMonth() === currentMonth && eventDate.getFullYear() === currentYear;
        }).length,
        yourRSVPs: allEvents.filter(event => event.is_registered).length
      });
    }
  }, [allEvents]);

  const fetchCategories = async () => {
    setCategoriesLoading(true)
    try {
      const response = await fetch('/api/events/categories', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      })

      const data = await response.json()
      if (!response.ok) {
        throw new Error(data.message || 'Failed to fetch categories')
      }

      setCategories(data || [])
    } catch (error) {
      console.error('Error fetching categories:', error)
    } finally {
      setCategoriesLoading(false)
    }
  }

  const handleRegistration = async (eventId: number, isRegistered: boolean) => {
    if (!user) {
      router.push('/auth/login')
      return
    }

    try {
      const endpoint = isRegistered ? 'unregister' : 'register'
      const response = await fetch(`/api/events/${eventId}/${endpoint}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      })

      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.message || `Failed to ${endpoint} for event`)
      }

      // Update the events list with the new registration status
      setEvents((prevEvents: Event[]) => prevEvents.map((event: Event) => {
        if (event.id === eventId) {
          return {
            ...event,
            is_registered: !isRegistered,
            participant_count: isRegistered 
              ? event.participant_count - 1 
              : event.participant_count + 1
          }
        }
        return event
      }))

      // Update featured event if it's the one being modified
      if (featuredEvent?.id === eventId) {
        setFeaturedEvent(prev => {
          if (!prev) return null
          return {
            ...prev,
            is_registered: !isRegistered,
            participant_count: isRegistered 
              ? prev.participant_count - 1 
              : prev.participant_count + 1
          }
        })
      }
    } catch (error) {
      console.error('Error updating registration:', error)
      // Show error message to user
      setError(error instanceof Error ? error.message : 'Failed to update registration')
    }
  }

  const fetchEvents = async () => {
    setEventsLoading(true)
    try {
      const token = localStorage.getItem('token')

      const response = await fetch(`/api/events`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || 'Failed to fetch events')
      }

      // Store all events and set the filtered events
      setAllEvents(data.events || []);
      setEvents(data.events || []);
      
    } catch (error) {
      console.error('Error fetching events:', error)
    } finally {
      setEventsLoading(false)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric'
    })
  }

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const getCategoryIcon = (category: string) => {
    switch (category.toLowerCase()) {
      case "tree planting":
        return <TreePine className="h-4 w-4" />
      case "workshop":
        return <BookOpen className="h-4 w-4" />
      case "cleanup":
        return <Trash2 className="h-4 w-4" />
      case "education":
        return <BookOpen className="h-4 w-4" />
      case "community":
        return <Users className="h-4 w-4" />
      case "garden":
        return <Flower2 className="h-4 w-4" />
      case "survey":
        return <Sprout className="h-4 w-4" />
      default:
        return <Leaf className="h-4 w-4" />
    }
  }

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

  if (isEventsLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Spinner size="lg" className="text-green-600" />
      </div>
    )
  }

  // Get featured events and regular events
  const featuredEvents = getFeaturedEvents(events);
  const regularEvents = events.filter(event => !event.is_featured);

  return (
    <div className="min-h-screen bg-[#f8f9f3]">
      {/* Header Section */}
      <section className="relative bg-gradient-to-br from-[#2c5530] to-[#1a3a1f] py-16">
        <div className="container px-4">
          <div className="mx-auto max-w-3xl text-center">
            <motion.h1
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="text-4xl font-bold tracking-tight text-white sm:text-5xl"
            >
              Community Events
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="mt-4 text-[#c1e1c1]"
            >
              Join local environmental events and make a difference in your community
            </motion.p>
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              {user?.roles?.includes('admin') && (
                <Link href="/events/create">
                  <Button className="mt-8 bg-[#e76f51] text-white hover:bg-[#e76f51]/90">
                    <Plus className="mr-2 h-5 w-5" />
                    Create Event
                  </Button>
                </Link>
              )}
            </motion.div>
          </div>
        </div>
        <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-b from-transparent to-[#f8f9f3]" />
      </section>

      {/* Featured Events Section */}
      {featuredEvent && (
        <section className="container px-4 -mt-8 mb-8 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="space-y-4"
          >
            <div className="flex items-center gap-2">
              <Star className="h-5 w-5 text-[#e76f51]" />
              <h2 className="text-xl font-semibold text-[#2c5530]">Featured Event</h2>
            </div>

            <Link href={`/events/${featuredEvent.id}`}>
              <Card className="group overflow-hidden border-2 border-[#e76f51]/20 transition-all hover:border-[#e76f51] hover:shadow-md">
                <div className="grid lg:grid-cols-2 gap-0">
                  <div className="aspect-video relative">
                    <img
                      src={featuredEvent.image_url || "/placeholder.svg?height=300&width=400"}
                    alt={featuredEvent.title}
                      className="absolute inset-0 h-full w-full object-cover transition-transform group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-r from-black/60 to-transparent lg:via-black/30 lg:to-transparent" />
                    <Badge className="absolute left-4 top-4 bg-[#e76f51]">Featured</Badge>
                  </div>
                  <div className="p-6 lg:p-8">
                    <h3 className="text-2xl font-semibold mb-4 group-hover:text-[#2c5530]">
                      {featuredEvent.title}
                    </h3>
                    <p className="text-gray-600 mb-6 line-clamp-2">
                      {featuredEvent.description}
                    </p>
                    <div className="grid sm:grid-cols-2 gap-4 mb-6">
                      <div className="flex items-center gap-2 text-gray-600">
                        <Calendar className="h-4 w-4 text-[#2c5530]" />
                        <span>{formatDate(featuredEvent.start_date)}</span>
                </div>
                      <div className="flex items-center gap-2 text-gray-600">
                        <Clock className="h-4 w-4 text-[#2c5530]" />
                        <span>{formatTime(featuredEvent.start_date)}</span>
                      </div>
                      <div className="flex items-center gap-2 text-gray-600">
                        <MapPin className="h-4 w-4 text-[#2c5530]" />
                        <span className="line-clamp-1">{featuredEvent.location}</span>
                    </div>
                      <div className="flex items-center gap-2 text-gray-600">
                        <Users className="h-4 w-4 text-[#2c5530]" />
                        <span>{featuredEvent.participant_count} / {featuredEvent.max_participants} attending</span>
                    </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <Button
                        onClick={(e) => {
                          e.preventDefault();
                          handleRegistration(featuredEvent.id, featuredEvent.is_registered || false);
                        }}
                        className={cn(
                          "px-8",
                          featuredEvent.is_registered
                            ? "bg-red-500 hover:bg-red-600 text-white"
                            : "bg-[#e76f51] hover:bg-[#e76f51]/90 text-white"
                        )}
                      >
                        {featuredEvent.is_registered ? 'Unregister' : 'Register Now'}
                      </Button>
                      <Button variant="outline" className="border-[#2c5530] text-[#2c5530]">
                        View Details
                      </Button>
                    </div>
                  </div>
                </div>
              </Card>
            </Link>
          </motion.div>
        </section>
      )}

      {/* Featured Events Grid */}
      {featuredEvents.length > 0 && (
        <section className="container px-4 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="space-y-4"
          >
            <div className="flex items-center gap-2">
              <Star className="h-5 w-5 text-[#e76f51]" />
              <h2 className="text-xl font-semibold text-[#2c5530]">Featured Events</h2>
            </div>

            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {featuredEvents.map((event) => (
                <motion.div key={event.id} variants={item}>
                  <Link href={`/events/${event.id}`}>
                    <Card className="group h-full overflow-hidden transition-all hover:border-[#2c5530] hover:shadow-md">
                      <div className="aspect-video relative">
                        <img
                          src={event.image_url || "/placeholder.svg?height=300&width=400"}
                          alt={event.title}
                          className="absolute inset-0 h-full w-full object-cover transition-transform group-hover:scale-105"
                        />
                        <Badge className="absolute left-4 top-4 bg-[#e76f51]">Featured</Badge>
                      </div>
                      <CardContent className="p-5">
                        <h3 className="mb-3 line-clamp-2 text-xl font-semibold group-hover:text-[#2c5530]">
                          {event.title}
                        </h3>
                        <div className="space-y-2">
                          <div className="flex items-center gap-2 text-gray-600">
                            <Calendar className="h-4 w-4 text-[#2c5530]" />
                            <span>{formatDate(event.start_date)}</span>
                          </div>
                          <div className="flex items-center gap-2 text-gray-600">
                            <Clock className="h-4 w-4 text-[#2c5530]" />
                            <span>{formatTime(event.start_date)}</span>
                          </div>
                          <div className="flex items-center gap-2 text-gray-600">
                            <MapPin className="h-4 w-4 text-[#2c5530]" />
                            <span className="line-clamp-1">{event.location}</span>
                          </div>
                        </div>
                      </CardContent>
                      <CardFooter className="border-t bg-[#f8f9f3]/50 px-5 py-4">
                        <div className="flex w-full items-center justify-between">
                          <div className="flex items-center gap-2 text-gray-600">
                            <Users className="h-4 w-4 text-[#2c5530]" />
                            <span>{event.participant_count} / {event.max_participants} attending</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button
                              size="sm"
                              onClick={(e) => {
                                e.preventDefault();
                                handleRegistration(event.id, event.is_registered || false);
                              }}
                              className={
                                event.is_registered
                                  ? "bg-red-500 hover:bg-red-600 text-white"
                                  : "bg-[#2c5530] hover:bg-[#2c5530]/90 text-white"
                              }
                            >
                              {event.is_registered ? "Unregister" : "Register"}
                            </Button>
                          </div>
                        </div>
                      </CardFooter>
                    </Card>
                  </Link>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </section>
      )}

      {/* Main Content */}
      <section className="container px-4 py-8">
        <div className="grid gap-8 lg:grid-cols-[240px_1fr]">
          {/* Sidebar */}
          {isDesktop && (
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
              className="space-y-6"
            >
              <div className="rounded-xl bg-white p-5 shadow-sm">
                <h3 className="mb-4 font-semibold text-[#2c5530]">Categories</h3>
                <div className="space-y-2">
                  <Button
                    variant="ghost"
                    className={cn(
                      "w-full justify-start font-normal capitalize",
                      selectedCategory === "" 
                        ? "bg-[#e8f2e8] text-[#2c5530]" 
                        : "text-gray-600 hover:bg-[#e8f2e8] hover:text-[#2c5530]"
                    )}
                    onClick={() => {
                      setSelectedCategory("")
                    }}
                  >
                    <Leaf className="h-4 w-4" />
                    <span className="ml-2">All Events</span>
                  </Button>
                  
                  {categories.map((category) => (
                    <Button
                      key={category.id}
                      variant="ghost"
                      className={cn(
                        "w-full justify-start font-normal capitalize",
                        selectedCategory === category.name
                          ? "bg-[#e8f2e8] text-[#2c5530]"
                          : "text-gray-600 hover:bg-[#e8f2e8] hover:text-[#2c5530]",
                      )}
                      onClick={() => {
                        setSelectedCategory(category.name)
                      }}
                    >
                      {getCategoryIcon(category.name)}
                      <span className="ml-2">{category.name}</span>
                    </Button>
                  ))}
                </div>
              </div>

              <div className="rounded-xl bg-white p-5 shadow-sm">
                <h3 className="mb-4 font-semibold text-[#2c5530]">Quick Stats</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Upcoming Events</span>
                    <Badge className="bg-[#2c5530]">{quickStats.upcomingEvents}</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">This Month</span>
                    <Badge className="bg-[#2c5530]">{quickStats.thisMonth}</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Your RSVPs</span>
                    <Badge className="bg-[#e76f51]">{quickStats.yourRSVPs}</Badge>
                  </div>
                </div>
              </div>

              <div className="rounded-xl bg-gradient-to-br from-[#2c5530]/90 to-[#1a3a1f] p-5 text-white shadow-sm">
                <Droplets className="mb-2 h-6 w-6 text-[#c1e1c1]" />
                <h3 className="mb-2 font-semibold">Need Help?</h3>
                <p className="mb-4 text-sm text-[#c1e1c1]">Learn how to organize your own environmental event</p>
                <Button size="sm" variant="outline" className="border-white/30 text-white hover:bg-white/10">
                  View Guide
                </Button>
            </div>
            </motion.div>
          )}

          {/* Main Content */}
          <div className="space-y-6">
            {/* Search and Filter */}
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="sticky top-16 z-10 rounded-xl bg-white p-4 shadow-sm"
            >
              <div className="flex flex-wrap items-center gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <Input
              placeholder="Search events..."
                    className="border-[#e8f2e8] pl-10 focus-visible:ring-[#2c5530]"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        filterEvents()
                      }
                    }}
            />
          </div>
                <div className="flex items-center gap-4">
                  {!isDesktop && (
                    <Select 
                      value={selectedCategory || "all"}
                      onValueChange={(value) => {
                        setSelectedCategory(value === "all" ? "" : value)
                      }}
                    >
                      <SelectTrigger className="w-[160px] border-[#e8f2e8] focus:ring-[#2c5530]">
                        <SelectValue placeholder="Category" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Categories</SelectItem>
                        {categories.map((category) => (
                          <SelectItem key={category.id} value={category.name}>
                            {category.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                  <Button variant="outline" className="flex items-center gap-2 border-[#e8f2e8]" onClick={() => filterEvents()}>
                    <Filter className="h-4 w-4" />
                    Search
                  </Button>
                </div>
              </div>
            </motion.div>

            {/* View Tabs */}
            <Tabs defaultValue="grid" className="w-full">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-[#2c5530]">
                  {selectedCategory === ""
                    ? "All Events"
                    : `${selectedCategory} Events`}
                </h2>
                <TabsList className="bg-[#e8f2e8]">
                  <TabsTrigger value="grid" className="data-[state=active]:bg-white">
                    Grid
                  </TabsTrigger>
                  <TabsTrigger value="list" className="data-[state=active]:bg-white">
                    List
                  </TabsTrigger>
                </TabsList>
        </div>

              {/* Grid View */}
              <TabsContent value="grid" className="mt-6">
                {regularEvents.length > 0 ? (
                  <motion.div
                    variants={container}
                    initial="hidden"
                    animate="show"
                    className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3"
                  >
                    {regularEvents.map((event) => (
                      <motion.div key={event.id} variants={item}>
                        <Link href={`/events/${event.id}`}>
                          <Card className="group h-full overflow-hidden transition-all hover:border-[#2c5530] hover:shadow-md">
                            <div className="aspect-video relative">
                              <img
                                src={event.image_url || "/placeholder.svg?height=300&width=400"}
                                alt={event.title}
                                className="absolute inset-0 h-full w-full object-cover transition-transform group-hover:scale-105"
                              />
                              {event.is_featured && <Badge className="absolute left-4 top-4 bg-[#e76f51]">Featured</Badge>}
                            </div>
                            <CardContent className="p-5">
                              <h3 className="mb-3 line-clamp-2 text-xl font-semibold group-hover:text-[#2c5530]">
                                {event.title}
                              </h3>
                              <div className="space-y-2">
                                <div className="flex items-center gap-2 text-gray-600">
                                  <Calendar className="h-4 w-4 text-[#2c5530]" />
                                  <span>{formatDate(event.start_date)}</span>
                                </div>
                                <div className="flex items-center gap-2 text-gray-600">
                                  <Clock className="h-4 w-4 text-[#2c5530]" />
                                  <span>{formatTime(event.start_date)}</span>
                                </div>
                                <div className="flex items-center gap-2 text-gray-600">
                                  <MapPin className="h-4 w-4 text-[#2c5530]" />
                                  <span className="line-clamp-1">{event.location}</span>
                                </div>
                              </div>
                            </CardContent>
                            <CardFooter className="border-t bg-[#f8f9f3]/50 px-5 py-4">
                              <div className="flex w-full items-center justify-between">
                                <div className="flex items-center gap-2 text-gray-600">
                                  <Users className="h-4 w-4 text-[#2c5530]" />
                                  <span>{event.participant_count} / {event.max_participants} attending</span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <Button
                                    size="sm"
                                    onClick={(e) => {
                                      e.preventDefault();
                                      handleRegistration(event.id, event.is_registered || false);
                                    }}
                                    className={
                                      event.is_registered
                                        ? "bg-red-500 hover:bg-red-600 text-white"
                                        : "bg-[#2c5530] hover:bg-[#2c5530]/90 text-white"
                                    }
                                  >
                                    {event.is_registered ? "Unregister" : "Register"}
                                  </Button>
                                </div>
                              </div>
                            </CardFooter>
                          </Card>
                        </Link>
                      </motion.div>
                    ))}
                  </motion.div>
                ) : (
                  <div className="flex h-40 flex-col items-center justify-center rounded-lg border border-dashed border-gray-300 bg-white p-8 text-center">
                    <Leaf className="mb-2 h-10 w-10 text-gray-400" />
                    <h3 className="text-lg font-medium text-gray-900">No events found</h3>
                    <p className="mt-1 text-sm text-gray-500">
                      Try adjusting your search or filter to find what you're looking for.
                    </p>
                  </div>
                )}
              </TabsContent>

              {/* List View */}
              <TabsContent value="list" className="mt-6">
                {regularEvents.length > 0 ? (
                  <motion.div variants={container} initial="hidden" animate="show" className="space-y-4">
            {regularEvents.map((event) => (
                      <motion.div key={event.id} variants={item}>
                        <Link href={`/events/${event.id}`}>
                          <Card className="group overflow-hidden transition-all hover:border-[#2c5530] hover:shadow-md">
                            <div className="flex flex-col sm:flex-row">
                              <div className="aspect-video w-full sm:w-48 md:w-64">
                                <img
                                  src={event.image_url || "/placeholder.svg?height=300&width=400"}
                                  alt={event.title}
                                  className="h-full w-full object-cover"
                                />
                              </div>
                              <div className="flex flex-1 flex-col p-5">
                                <div className="mb-2 flex flex-wrap gap-2">
                                  {event.is_featured && <Badge className="bg-[#e76f51]">Featured</Badge>}
                                  <Badge variant="outline" className="border-[#2c5530] text-[#2c5530]">
                                    {event.category_name}
                                  </Badge>
                                </div>
                                <h3 className="mb-3 text-xl font-semibold group-hover:text-[#2c5530]">{event.title}</h3>
                                <div className="grid gap-2 sm:grid-cols-2">
                                  <div className="flex items-center gap-2 text-gray-600">
                                    <Calendar className="h-4 w-4 text-[#2c5530]" />
                                    <span>{formatDate(event.start_date)}</span>
                                  </div>
                                  <div className="flex items-center gap-2 text-gray-600">
                                    <Clock className="h-4 w-4 text-[#2c5530]" />
                                    <span>{formatTime(event.start_date)}</span>
                                  </div>
                                  <div className="flex items-center gap-2 text-gray-600">
                                    <MapPin className="h-4 w-4 text-[#2c5530]" />
                                    <span>{event.location}</span>
                                  </div>
                                  <div className="flex items-center gap-2 text-gray-600">
                                    <Users className="h-4 w-4 text-[#2c5530]" />
                                    <span>{event.participant_count} / {event.max_participants} attending</span>
                                  </div>
                                </div>
                                <div className="mt-auto pt-4 flex items-center justify-between">
                                  <Button
                                    size="sm"
                                    onClick={(e) => {
                                      e.preventDefault();
                                      handleRegistration(event.id, event.is_registered || false);
                                    }}
                                    className={
                                      event.is_registered
                                        ? "bg-red-500 hover:bg-red-600 text-white"
                                        : "bg-[#2c5530] hover:bg-[#2c5530]/90 text-white"
                                    }
                                  >
                                    {event.is_registered ? "Unregister" : "Register"}
                                  </Button>
                                  <Button size="sm" variant="outline" className="ml-2">
                                    View Details
                                  </Button>
                                </div>
                              </div>
                            </div>
                          </Card>
                        </Link>
                      </motion.div>
                    ))}
                  </motion.div>
                ) : (
                  <div className="flex h-40 flex-col items-center justify-center rounded-lg border border-dashed border-gray-300 bg-white p-8 text-center">
                    <Leaf className="mb-2 h-10 w-10 text-gray-400" />
                    <h3 className="text-lg font-medium text-gray-900">No events found</h3>
                    <p className="mt-1 text-sm text-gray-500">
                      Try adjusting your search or filter to find what you're looking for.
                    </p>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </section>
      </div>
  )
}

