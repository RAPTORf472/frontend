"use client"

import { useState, useEffect } from "react"
import { Bell, Award } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useSocket } from "@/contexts/socket-context"
import { useAuth } from "@/contexts/auth-context"

interface Notification {
  id: number
  type: string
  title: string
  content: string
  data?: {
    link?: string
  }
  is_read: boolean
  created_at: string
}

interface NotificationResponse {
  notifications: Notification[]
  page: number
  total: number
  total_pages: number
}

interface UnreadCountResponse {
  unread_count: number
}

export function NotificationDropdown() {
  const { user } = useAuth()
  const { socket, isConnected } = useSocket()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [isOpen, setIsOpen] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [isLoading, setIsLoading] = useState(false)

  const fetchNotifications = async () => {
    try {
      setIsLoading(true)
      const token = localStorage.getItem('token')
      if (!token) return

      const response = await fetch(`/api/notifications?page=${currentPage}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      
      if (response.ok) {
        const data: NotificationResponse = await response.json()
        setNotifications(prev => 
          currentPage === 1 ? data.notifications : [...prev, ...data.notifications]
        )
        setTotalPages(data.total_pages)
      } else {
        console.error('Failed to fetch notifications:', await response.text())
      }
    } catch (error) {
      console.error('Error fetching notifications:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const fetchUnreadCount = async () => {
    try {
      const token = localStorage.getItem('token')
      if (!token) return

      const response = await fetch('/api/notifications/unread', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      
      if (response.ok) {
        const data = await response.json()
        setUnreadCount(data.unread_count)
      } else {
        console.error('Failed to fetch unread count:', await response.text())
      }
    } catch (error) {
      console.error('Error fetching unread count:', error)
    }
  }

  const markAsRead = async (notificationId: number) => {
    try {
      const token = localStorage.getItem('token')
      if (!token) return

      const response = await fetch(`/api/notifications/${notificationId}/read`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      
      if (response.ok) {
        setNotifications(prev => 
          prev.map(n => n.id === notificationId ? { ...n, is_read: true } : n)
        )
        await fetchUnreadCount()
      } else {
        console.error('Failed to mark notification as read:', await response.text())
      }
    } catch (error) {
      console.error('Error marking notification as read:', error)
    }
  }

  const markAllAsRead = async () => {
    try {
      const token = localStorage.getItem('token')
      if (!token) return

      const response = await fetch('/api/notifications/read-all', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      })
      
      if (response.ok) {
        setNotifications(prev => prev.map(n => ({ ...n, is_read: true })))
        setUnreadCount(0)
      } else {
        const errorData = await response.text()
        console.error('Failed to mark all as read:', errorData)
        throw new Error(`Failed to mark all as read: ${errorData}`)
      }
    } catch (error) {
      console.error('Error marking all as read:', error)
      // Re-fetch notifications and unread count in case of error
      fetchNotifications()
      fetchUnreadCount()
    }
  }

  const loadMoreNotifications = () => {
    if (currentPage < totalPages && !isLoading) {
      setCurrentPage(prev => prev + 1)
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const renderNotificationContent = (notification: Notification) => {
    switch (notification.type) {
      case 'achievement_earned':
        return (
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <div className="bg-[#e9f0e6] text-[#2c5530] p-1 rounded-full">
                <Award className="h-4 w-4" />
              </div>
              <span className="font-medium text-[#2c5530]">{notification.title}</span>
            </div>
            <p className="text-sm text-[#5a7d61]">{notification.content}</p>
            {notification.data?.link && (
              <Button 
                variant="link" 
                className="p-0 h-auto text-sm justify-start text-[#3a6b3e] hover:text-[#2c5530]"
                onClick={() => {
                  markAsRead(notification.id)
                  window.location.href = (notification.data as {link: string}).link
                }}
              >
                View Achievement
              </Button>
            )}
          </div>
        )
      default:
        return (
          <div>
            <p className="font-medium text-[#2c5530]">{notification.title}</p>
            <p className="text-sm text-[#5a7d61]">{notification.content}</p>
          </div>
        )
    }
  }

  useEffect(() => {
    if (user && isConnected) {
      // Initial fetch
      fetchNotifications()
      fetchUnreadCount()

      // Listen for new notifications
      socket?.on('new_notification', (notification: Notification) => {
        setNotifications(prev => [notification, ...prev])
        if (!isOpen) {
          setUnreadCount(prev => prev + 1)
        }
      })

      // Listen for unread count updates
      socket?.on('notification_count', (data: { count: number }) => {
        setUnreadCount(data.count)
      })

      return () => {
        socket?.off('new_notification')
        socket?.off('notification_count')
      }
    }
  }, [user, isConnected, isOpen])

  // Fetch notifications when page changes
  useEffect(() => {
    if (isOpen) {
      fetchNotifications()
    }
  }, [currentPage])

  if (!user) return null

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative text-[#3a6b3e] hover:text-[#2c5530] hover:bg-[#f0f4e9] border border-transparent hover:border-[#d1e0d3]">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge 
              className="absolute -top-1 -right-1 px-1.5 py-0.5 min-w-[1.25rem] h-5 flex items-center justify-center bg-[#e76f51] hover:bg-[#e25b3a] text-white"
              variant="destructive"
            >
              {unreadCount > 99 ? '99+' : unreadCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80 max-h-[70vh] overflow-hidden flex flex-col border-[#d1e0d3] bg-[#f8f9f3]">
        <div className="p-4 border-b border-[#d1e0d3] flex items-center justify-between">
          <h3 className="font-semibold text-[#2c5530]">Notifications</h3>
          {unreadCount > 0 && (
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={markAllAsRead}
              className="text-xs h-8 text-[#3a6b3e] hover:text-[#2c5530] hover:bg-[#f0f4e9] border border-transparent hover:border-[#d1e0d3]"
            >
              Mark all as read
            </Button>
          )}
        </div>
        
        <div className="overflow-y-auto max-h-[calc(70vh-60px)]">
          {notifications.length === 0 ? (
            <div className="p-4 text-center text-[#5a7d61]">
              No notifications
            </div>
          ) : (
            notifications.map((notification) => (
              <DropdownMenuItem
                key={notification.id}
                className={`p-4 border-b border-[#d1e0d3] last:border-b-0 cursor-default ${!notification.is_read ? 'bg-[#f0f4e9]' : ''}`}
                onSelect={(e) => e.preventDefault()}
              >
                <div className="w-full">
                  {renderNotificationContent(notification)}
                  <div className="mt-2 flex items-center justify-between">
                    <span className="text-xs text-[#5a7d61]">
                      {formatDate(notification.created_at)}
                    </span>
                    {!notification.is_read && (
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => markAsRead(notification.id)}
                        className="text-xs h-6 ml-auto text-[#3a6b3e] hover:text-[#2c5530] hover:bg-[#f0f4e9] border border-transparent hover:border-[#d1e0d3]"
                      >
                        Mark as read
                      </Button>
                    )}
                  </div>
                </div>
              </DropdownMenuItem>
            ))
          )}
        </div>
        
        {currentPage < totalPages && (
          <div className="p-2 border-t border-[#d1e0d3]">
            <Button 
              variant="outline" 
              size="sm" 
              className="w-full border-[#d1e0d3] text-[#3a6b3e] hover:text-[#2c5530] hover:bg-[#f0f4e9]"
              onClick={loadMoreNotifications}
              disabled={isLoading}
            >
              {isLoading ? 'Loading...' : 'Load more'}
            </Button>
          </div>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}