"use client"

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/auth-context'

interface EventPageContentProps {
  params: {
    id: string
  }
}

export function EventPageContent({ params }: EventPageContentProps) {
  const [isRegistered, setIsRegistered] = useState(false)
  const { user } = useAuth()

  const checkRegistration = async () => {
    try {
      const token = localStorage.getItem('token')
      if (!token) {
        setIsRegistered(false)
        return
      }

      const response = await fetch(`/api/events/${params.id}/registration`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (!response.ok) {
        throw new Error('Failed to check registration status')
      }

      const data = await response.json()
      setIsRegistered(data.is_registered)
    } catch (error) {
      console.error('Error checking registration:', error)
      setIsRegistered(false)
    }
  }

  useEffect(() => {
    if (user) {
      checkRegistration()
    }
  }, [user, params.id])

  // ... rest of your component code ...
} 