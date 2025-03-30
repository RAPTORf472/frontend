"use client"

import { Bell } from "lucide-react"
import { useArrayData } from "@/hooks/use-array-data"
import { EmptyState } from "@/components/ui/empty-state"
import { Spinner } from "@/components/ui/spinner"
import { useEffect } from "react"

interface Notification {
  id: number
  title: string
  message: string
  type: string
  created_at: string
  read: boolean
}

export default function NotificationsPage() {
  const {
    data: notifications,
    isEmpty: isNotificationsEmpty,
    isLoading: isNotificationsLoading,
    setData: setNotifications,
    setIsLoading: setNotificationsLoading
  } = useArrayData<Notification>({
    emptyMessage: 'No notifications yet.'
  })

  useEffect(() => {
    fetchNotifications()
  }, [])

  const fetchNotifications = async () => {
    setNotificationsLoading(true)
    try {
      const response = await fetch('/api/notifications', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      })
      const data = await response.json()
      setNotifications(data.notifications)
    } catch (error) {
      console.error('Error fetching notifications:', error)
    } finally {
      setNotificationsLoading(false)
    }
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Notifications</h1>

      {isNotificationsLoading ? (
        <div className="flex justify-center py-8">
          <Spinner size="lg" />
        </div>
      ) : isNotificationsEmpty ? (
        <EmptyState 
          message="No notifications yet."
          icon={<Bell className="h-8 w-8 text-gray-400" />}
        />
      ) : (
        <div className="space-y-4">
          {notifications.map((notification) => (
            <div
              key={notification.id}
              className={`p-4 rounded-lg border ${notification.read ? 'bg-gray-50' : 'bg-white'}`}
            >
              <h3 className="font-medium">{notification.title}</h3>
              <p className="text-gray-600 mt-1">{notification.message}</p>
              <div className="mt-2 text-sm text-gray-500">
                {new Date(notification.created_at).toLocaleDateString()}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
} 