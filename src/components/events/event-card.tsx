"use client"

import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Calendar, MapPin, Users } from "lucide-react"
import Link from "next/link"
import { useState } from "react"
import { cn } from "@/lib/utils"
import { Spinner } from "@/components/ui/spinner"
import { Event } from "@/types/event"

export interface EventCardProps {
  event: Event
  onRegistrationChange: (isRegistered: boolean) => void
}

export function EventCard({ event, onRegistrationChange }: EventCardProps) {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
    })
  }

  const [isLoading, setIsLoading] = useState(false)

  const handleRegistrationClick = async () => {
    setIsLoading(true)
    try {
      await onRegistrationChange(event.is_registered || false)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow duration-200">
      <div className="relative h-48">
        <img
          src={event.image_url || "/placeholder.svg?height=200&width=400"}
          alt={event.title}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-green-900/80 to-transparent" />
      </div>
      <CardHeader>
        <div className="space-y-1">
          <h3 className="text-xl font-semibold text-green-900">{event.title}</h3>
          <p className="text-sm text-gray-600 line-clamp-2">{event.description}</p>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-green-700">
            <Calendar className="h-4 w-4" />
            <span className="text-sm">{formatDate(event.start_date)}</span>
          </div>
          <div className="flex items-center gap-2 text-green-700">
            <MapPin className="h-4 w-4" />
            <span className="text-sm">{event.location}</span>
          </div>
          <div className="flex items-center gap-2 text-green-700">
            <Users className="h-4 w-4" />
            <span className="text-sm">{event.participant_count} / {event.max_participants} attending</span>
          </div>
        </div>
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button
          variant="default"
          onClick={handleRegistrationClick}
          disabled={isLoading}
          className={cn(
            event.is_registered 
              ? "bg-red-600 hover:bg-red-700 text-white" 
              : "bg-green-600 hover:bg-green-700 text-white",
            "min-w-[120px]"
          )}
        >
          {isLoading ? (
            <Spinner size="sm" className="mr-2" />
          ) : event.is_registered ? (
            'Unregister'
          ) : (
            'Register'
          )}
        </Button>
        <Link 
          href={`/events/${event.id}`}
          className="text-sm text-green-600 hover:text-green-700 transition-colors font-medium"
        >
          View Details
        </Link>
      </CardFooter>
    </Card>
  )
} 