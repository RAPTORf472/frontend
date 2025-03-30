"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { MessageCircle, X, Minus, Users, ChevronDown } from "lucide-react"
import { useAuth } from "@/contexts/auth-context"
import { useSocket } from "@/contexts/socket-context"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

interface Message {
  id: number
  content: string
  sender_name: string
  created_at: string
  room_id?: string | number
  author_name?: string
  sender_id?: number
  read: boolean
}

interface Participant {
  id: number
  username: string
  joined_at: string
  role?: string
}

interface ChatRoom {
  id: string
  name: string
  description: string
  type: 'public' | 'private' | 'group'
  category: 'global' | 'support' | 'groups' | 'private'
  is_member?: boolean
  group_id?: number
}

export function GlobalChat() {
  const { user } = useAuth()
  const { socket, isConnected } = useSocket()
  const [isOpen, setIsOpen] = useState(false)
  const [isMinimized, setIsMinimized] = useState(false)
  const [messages, setMessages] = useState<Message[]>([])
  const [participants, setParticipants] = useState<Participant[]>([])
  const [unreadCount, setUnreadCount] = useState<{ [key: string]: number }>({})
  const [isLoading, setIsLoading] = useState(true)
  const [rooms, setRooms] = useState<ChatRoom[]>([])
  const [currentRoom, setCurrentRoom] = useState<ChatRoom | null>(null)
  const [selectedCategory, setSelectedCategory] = useState<'global' | 'support' | 'groups' | 'private'>('global')
  const [messageInput, setMessageInput] = useState("")
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const [error, setError] = useState<string | null>(null)
  const [currentRoomId, setCurrentRoomId] = useState<string | null>(null)
  const [view, setView] = useState<'menu' | 'rooms' | 'chat'>('menu')

  // Define chat sections
  const sections = [
    {
      id: 'global',
      name: 'Global',
      description: 'Global chat and announcements',
      icon: <MessageCircle className="h-5 w-5" />
    },
    {
      id: 'support',
      name: 'Support',
      description: 'Help, support and off-topic discussions',
      icon: <MessageCircle className="h-5 w-5" />
    },
    {
      id: 'groups',
      name: 'Groups',
      description: 'Your group chats',
      icon: <Users className="h-5 w-5" />
    }
  ]

  const fetchRooms = useCallback(async () => {
    // Add debounce using a ref to track last fetch time
    const now = Date.now()
    const lastFetch = (fetchRooms as any).lastFetch || 0
    if (now - lastFetch < 5000) { // Don't fetch more often than every 5 seconds
            return
    }
    (fetchRooms as any).lastFetch = now

    try {
      const token = localStorage.getItem('token')
      if (!token) {
                return
      }

            
      // Fetch regular chat rooms
      const chatResponse = await fetch('/api/chat/rooms', {
        headers: {
          'Authorization': token.startsWith('Bearer ') ? token : `Bearer ${token}`
        }
      })
      
      let allRooms: ChatRoom[] = []
      
      if (chatResponse.ok) {
        const chatRooms = await chatResponse.json()
                allRooms = chatRooms.map((room: any) => ({
          ...room,
          id: room.id.toString(),
          // Categorize rooms based on their purpose
          category: room.type === 'private' ? 'private' : 
                   room.name.toLowerCase().includes('announcement') ? 'global' :
                   room.name.toLowerCase().includes('support') || 
                   room.name.toLowerCase().includes('help') || 
                   room.name.toLowerCase().includes('off-topic') ? 'support' : 'global'
        }))
      }
      
      // Fetch user's groups that have chat enabled
      const groupsResponse = await fetch('/api/groups/memberships', {
        headers: {
          'Authorization': token.startsWith('Bearer ') ? token : `Bearer ${token}`
        }
      })
      
      if (groupsResponse.ok) {
        const groupsData = await groupsResponse.json()
                
        if (Array.isArray(groupsData)) {
          const groupRooms: ChatRoom[] = groupsData
            .map((group: any) => ({
              id: `group_${group.id}`,
              name: group.name || 'Unnamed Group',
              description: group.description || '',
              type: 'group',
              category: 'groups',
              is_member: true,
              group_id: group.id
            }))
          
                    allRooms = [...allRooms, ...groupRooms]
        }
      }
      
      setRooms(allRooms)
      
    } catch (error) {
      console.error('Failed to fetch rooms:', error)
      setError('Failed to fetch chat rooms')
    }
  }, [])

  const fetchMessages = useCallback(async () => {
    if (!currentRoom) return

    try {
      setIsLoading(true)
      const token = localStorage.getItem('token')
      if (!token) {
        console.error('No token found')
        setMessages([])
        return
      }

      
      // Extract the actual group ID from the room ID if it's a group chat
      const groupId = currentRoom.type === 'group' ? 
        currentRoom.group_id || currentRoom.id.toString().replace('group_', '') : 
        null

      const endpoint = currentRoom.type === 'group'
        ? `/api/groups/${groupId}/chat/messages`
        : `/api/chat/rooms/${currentRoom.id}/messages`

      
      const response = await fetch(endpoint, {
        headers: {
          'Authorization': token.startsWith('Bearer ') ? token : `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })
      
      if (response.ok) {
        const data = await response.json()
                
        if (currentRoom.type === 'group') {
          // Group chat messages are already in the correct format
          setMessages(Array.isArray(data) ? data.reverse() : [])
        } else if (data?.success && Array.isArray(data?.messages)) {
          setMessages(data.messages.reverse())
        } else if (Array.isArray(data)) {
          setMessages(data.reverse())
        } else {
          console.error('[Fetch Messages] Unexpected messages data format:', data)
          setMessages([])
          setError('Failed to load messages')
        }
      } else {
        const errorText = await response.text()
        console.error('[Fetch Messages] Failed to fetch messages:', response.status, errorText)
        setMessages([])
        setError('Failed to load messages')
      }
    } catch (error) {
      console.error('[Fetch Messages] Error fetching messages:', error)
      setMessages([])
      setError('Error loading messages')
    } finally {
      setIsLoading(false)
    }
  }, [currentRoom])

  const fetchParticipants = useCallback(async () => {
    if (!currentRoom) return

    try {
      setIsLoading(true)
      const token = localStorage.getItem('token')
      if (!token) {
        console.error('No token found')
        return
      }

      // Use different endpoint for group chats
      if (currentRoom.type === 'group') {
        // Extract the actual group ID - ensure we use group_id if available
        const groupId = currentRoom.group_id?.toString() || currentRoom.id.toString().split('_')[1]
        
                
        if (!groupId) {
          console.error('[Fetch Participants] Failed to extract group ID from:', currentRoom)
          setError('Invalid group ID')
          setIsLoading(false)
          return
        }

        const response = await fetch(`/api/groups/${groupId}/members`, {
          headers: {
            'Authorization': token.startsWith('Bearer ') ? token : `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        })
        
        if (response.ok) {
          const data = await response.json()
                    if (Array.isArray(data)) {
            setParticipants(data.map(member => ({
              id: member.id,
              username: member.username,
              joined_at: member.joined_at,
              role: member.role
            })))
          } else {
            console.error('[Fetch Participants] Unexpected members data format:', data)
            setParticipants([])
            setError('Invalid members data format')
          }
        } else {
          const errorText = await response.text()
          console.error('[Fetch Participants] Failed to fetch group members:', {
            status: response.status,
            statusText: response.statusText,
            error: errorText
          })
          setError('Failed to load participants')
        }
        return
      }

      // Regular chat room participants
      const response = await fetch(`/api/chat/rooms/${currentRoom.id}/participants`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })
      
      if (response.ok) {
        const data = await response.json()
                
        if (Array.isArray(data)) {
          setParticipants(data)
        } else if (data.participants && Array.isArray(data.participants)) {
          setParticipants(data.participants)
        } else {
          console.error('Unexpected participants data format:', data)
          setParticipants([])
          setError('Failed to load participants')
        }
      } else {
        const error = await response.json()
        console.error('Failed to fetch participants:', error)
        setError('Failed to load participants')
      }
    } catch (error) {
      console.error('Error fetching participants:', error)
      setParticipants([])
      setError('Error loading participants')
    } finally {
      setIsLoading(false)
    }
  }, [currentRoom])

  const handleRoomClick = useCallback(async (roomId: string) => {
    try {
      setError(null)
      setIsLoading(true)
      
      const token = localStorage.getItem('token')
      if (!token) {
        setError('Authentication required')
        setIsLoading(false)
        return
      }

      // Validate room exists in available rooms
      const targetRoom = rooms.find(r => r.id === roomId)
      if (!targetRoom) {
        console.error('[Room Switch] Room not found in available rooms:', roomId)
        setError('Invalid room selection')
        setIsLoading(false)
        return
      }
      
      // For group chats, we don't need socket connection
      if (targetRoom.type === 'group') {
                // Set the current room directly for group chats
        setCurrentRoom(targetRoom)
        setCurrentRoomId(roomId)
        
        // Extract the actual group ID - ensure we use group_id if available
        const groupId = targetRoom.group_id?.toString() || roomId.split('_')[1]
        
                
        if (!groupId) {
          console.error('[Room Switch] Failed to extract group ID from:', {
            roomId,
            targetRoom
          })
          setError('Invalid group ID')
          setIsLoading(false)
          return
        }

        try {
                    
          const [messagesResponse, membersResponse] = await Promise.all([
            fetch(`/api/groups/${groupId}/chat/messages`, {
              headers: {
                'Authorization': token.startsWith('Bearer ') ? token : `Bearer ${token}`,
                'Content-Type': 'application/json'
              }
            }),
            fetch(`/api/groups/${groupId}/members`, {
              headers: {
                'Authorization': token.startsWith('Bearer ') ? token : `Bearer ${token}`,
                'Content-Type': 'application/json'
              }
            })
          ])

          if (messagesResponse.ok) {
            const messagesData = await messagesResponse.json()
                        setMessages(Array.isArray(messagesData) ? messagesData.reverse() : [])
          } else {
            const errorText = await messagesResponse.text()
            console.error('[Room Switch] Failed to fetch group messages:', errorText)
            setMessages([])
            setError('Failed to load group messages')
          }

          if (membersResponse.ok) {
            const membersData = await membersResponse.json()
                        if (Array.isArray(membersData)) {
              setParticipants(membersData.map(member => ({
                id: member.id,
                username: member.username,
                joined_at: member.joined_at,
                role: member.role
              })))
            }
          }

          // Switch to chat view after successful data fetch
          setView('chat')
          setIsLoading(false)
          return
        } catch (error) {
          console.error('[Room Switch] Error fetching group data:', error)
          setError('Error loading group data')
          setIsLoading(false)
          return
        }
      }
      
      // For non-group chats, proceed with socket connection
      if (!socket) {
        console.error('[Room Switch] Socket not initialized')
        setError('Chat connection not ready')
        setIsLoading(false)
        return
      }

      // Wait for socket to be connected
      if (!socket.connected) {
                await new Promise<void>((resolve, reject) => {
          const timeout = setTimeout(() => {
            reject(new Error('Socket connection timeout'))
          }, 5000)

          socket.once('connect', () => {
            clearTimeout(timeout)
            resolve()
          })
        }).catch(error => {
          console.error('[Room Switch] Socket connection failed:', error)
          throw new Error('Chat connection failed')
        })
      }

      // Leave current room if any
      if (currentRoomId) {
                
        // Check if the current room is a group chat and if we're currently on that group's page
        const isGroupRoom = currentRoomId.toString().startsWith('group_');
        const groupId = isGroupRoom ? currentRoomId.toString().replace('group_', '') : null;
        const isOnGroupPage = groupId && typeof window !== 'undefined' && 
          window.location.pathname.includes(`/groups/${groupId}`);
        
        // Only leave the room if it's not a group room we're viewing in the group page
        if (!isOnGroupPage) {
          await new Promise<void>((resolve) => {
            socket.emit('leave_chat', { 
              room_id: currentRoomId,
              token: token.startsWith('Bearer ') ? token.substring(7) : token
            }, () => {
              resolve()
            })
            // Add timeout for leave operation
            setTimeout(resolve, 1000)
          })
        } else {
                  }
      }

      // Join new room via REST API first
      try {
        const joinResponse = await fetch(`/api/chat/rooms/${roomId}/join`, {
          method: 'POST',
          headers: {
            'Authorization': token.startsWith('Bearer ') ? token : `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        })

        if (!joinResponse.ok) {
          const errorText = await joinResponse.text()
          console.error('[Room Switch] REST join failed:', errorText)
          // Continue anyway as the user might already be a member
        }
      } catch (error) {
        console.error('[Room Switch] REST join failed:', error)
      }

      // Join new room via socket
      const socketToken = token.startsWith('Bearer ') ? token.substring(7) : token
      
      try {
        const joinResult: any = await new Promise((resolve, reject) => {
          const timeoutId = setTimeout(() => {
            reject(new Error('Join timeout'))
          }, 5000)

          socket.emit('join_chat', {
            room_id: roomId,
            token: socketToken
          }, (response: any) => {
            clearTimeout(timeoutId)
            resolve(response)
          })
        })

        if (joinResult && joinResult.error) {
          throw new Error(joinResult.error)
        }

        // Fetch room data
        const [messagesResponse, participantsResponse] = await Promise.all([
          fetch(`/api/chat/rooms/${roomId}/messages`, {
            headers: {
              'Authorization': token.startsWith('Bearer ') ? token : `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          }),
          fetch(`/api/chat/rooms/${roomId}/participants`, {
            headers: {
              'Authorization': token.startsWith('Bearer ') ? token : `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          })
        ])

        if (messagesResponse.ok) {
          const messagesData = await messagesResponse.json()
          if (messagesData?.success && Array.isArray(messagesData?.messages)) {
            setMessages(messagesData.messages.reverse())
          } else if (Array.isArray(messagesData)) {
            setMessages(messagesData.reverse())
          } else {
            setMessages([])
            setError('Failed to load messages')
          }
        }

        if (participantsResponse.ok) {
          const participantsData = await participantsResponse.json()
          if (Array.isArray(participantsData)) {
            setParticipants(participantsData)
          } else if (participantsData.participants && Array.isArray(participantsData.participants)) {
            setParticipants(participantsData.participants)
          }
        }

        // Update room state
        setCurrentRoom(targetRoom)
        setCurrentRoomId(roomId)
        setView('chat')
        
        // Reset unread count for the new room
        setUnreadCount(prev => ({
          ...prev,
          [roomId]: 0
        }))

      } catch (error) {
        console.error('[Room Switch] Socket join or data fetch error:', error)
        throw error // Re-throw to be caught by the outer catch block
      }

    } catch (error) {
      console.error('[Room Switch] Error switching rooms:', error)
      setError(error instanceof Error ? error.message : 'Failed to switch rooms')
      setCurrentRoom(null)
      setCurrentRoomId(null)
    } finally {
      setIsLoading(false)
    }
  }, [socket, currentRoomId, rooms])

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [])

  const fetchUnreadCount = useCallback(async () => {
    try {
      const token = localStorage.getItem('token')
      if (!token) return

      const response = await fetch('/api/chat/rooms/unread', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      
      if (response.ok) {
        const data = await response.json()
        if (data.success && data.unread_counts) {
        setUnreadCount(data.unread_counts)
        }
      } else {
        console.error('Error fetching unread counts:', await response.text())
      }
    } catch (error) {
      console.error('Error fetching unread counts:', error)
    }
  }, [])

  const formatDate = useCallback((dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    })
  }, [])

  const sendMessage = useCallback(async () => {
    if (!messageInput.trim() || !socket?.connected || !currentRoom) {
      console.error('[Send Message] Invalid state:', {
        messageInput: messageInput.trim(),
        socketConnected: socket?.connected,
        hasCurrentRoom: !!currentRoom,
        currentRoomId: currentRoom?.id
      })
      return
    }

    try {
      setError(null)
      const token = localStorage.getItem('token')
      if (!token) {
                setError('Authentication required')
        return
      }

      if (currentRoom.type === 'group') {
        // Extract the actual group ID
        const groupId = currentRoom.group_id || currentRoom.id.toString().replace('group_', '')
        
        // Send message through REST API for group chats
        const response = await fetch(`/api/groups/${groupId}/chat/messages`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': token.startsWith('Bearer ') ? token : `Bearer ${token}`
          },
          body: JSON.stringify({
            content: messageInput.trim()
          })
        })

        if (response.ok) {
          const message = await response.json()
          setMessages(prev => [...prev, message])
          setMessageInput("")
        } else {
          const error = await response.json()
          setError(error.error || 'Failed to send message')
        }
        return // Add return here to prevent socket message sending
      }

      // Send message through socket for regular chats
      const messageData = {
        room_id: currentRoom.id,
        content: messageInput.trim(),
        token: token.startsWith('Bearer ') ? token.substring(7) : token
      }
      
      
      socket.emit('send_message', messageData, (response: any) => {
                if (response?.error) {
          console.error('[Send Message] Server returned error:', response.error)
          setError(response.error)
          return
        }
        setMessageInput("")
      })
    } catch (error) {
      console.error('[Send Message] Error in send message:', error)
      setError('Failed to send message')
    }
  }, [messageInput, socket, currentRoom])

  // Listen for openBubbleChat event
  useEffect(() => {
    const handleOpenBubbleChat = async (event: Event) => {
      const customEvent = event as CustomEvent<{ roomId: string }>
            const { roomId } = customEvent.detail
      
      // Fetch rooms first if we don't have any
      if (rooms.length === 0) {
                await fetchRooms()
      }
      
      // Find the room in the available rooms
      let targetRoom = rooms.find(r => r.id === roomId)
      
      // If room not found, try fetching rooms again (in case it's a new room)
      if (!targetRoom) {
                await fetchRooms()
        targetRoom = rooms.find(r => r.id === roomId)
      }
      
      if (!targetRoom) {
        console.error('[Open Bubble Chat] Room not found after refresh:', roomId)
        setError('Room not found')
        return
      }
      
            
      // Open the bubble chat
      setIsOpen(true)
      setIsMinimized(false)
      
      // Set the category based on the room type
      setSelectedCategory(targetRoom.category)
      
      // Switch to the room - this will handle everything including setting current room
      // and will set view to 'chat' after successful connection
      await handleRoomClick(roomId)
    }

    window.addEventListener('openBubbleChat', handleOpenBubbleChat)

    return () => {
      window.removeEventListener('openBubbleChat', handleOpenBubbleChat)
    }
  }, [rooms, handleRoomClick, fetchRooms])

  // Socket setup effect - remove unnecessary dependencies
  useEffect(() => {
    if (user && isConnected && socket) {
            
      // Initial fetch of rooms
      fetchRooms()

      // Debug log socket connection status
      
      // Add socket state change listeners
      socket.on('connect', () => {
              })

      socket.on('disconnect', (reason: string) => {
              })

      // Listen for new messages
      socket.on('new_message', (message: Message & { room_id: number }) => {
                if (message && message.id && message.content && message.sender_name) {
          if (message.room_id.toString() === currentRoom?.id) {
            setMessages(prevMessages => [...prevMessages, message])
            if (!isOpen || isMinimized) {
              setUnreadCount(prev => ({
                ...prev,
                [message.room_id]: (prev[message.room_id] || 0) + 1
              }))
            }
          } else {
            // Increment unread count for other rooms
            setUnreadCount(prev => ({
              ...prev,
              [message.room_id]: (prev[message.room_id] || 0) + 1
            }))
          }
        }
      })

      // Listen for group chat messages
      socket.on('group_chat_message', (message: { 
        id: number, 
        content: string, 
        author_name: string,
        sender_id: number, 
        group_id: number,
        created_at: string
      }) => {
                
        if (message && message.id && message.content) {
          // Find if this is the current room
          const roomId = `group_${message.group_id}`;
          const roomMatch = roomId === currentRoom?.id;
          
          // Check if user is currently on the dedicated group page for this group
          const isOnGroupPage = typeof window !== 'undefined' && 
            window.location.pathname.includes(`/groups/${message.group_id}`);
          
          // Format message to match our Message structure
          const formattedMessage: Message = {
            id: message.id,
            content: message.content,
            sender_name: message.author_name,  // Map author_name to sender_name
            sender_id: message.sender_id,      // Map author_id to sender_id
            created_at: message.created_at,
            read: false
          };
          
          // Only add to bubble chat if not already viewing on group page
          if (roomMatch && !isOnGroupPage) {
            // Add to current messages if viewing this room and not on group page
            setMessages(prevMessages => [...prevMessages, formattedMessage]);
          }
          
          // Always update unread count if chat isn't focused
          if (!roomMatch || !isOpen || isMinimized) {
            setUnreadCount(prev => ({
              ...prev,
              [roomId]: (prev[roomId] || 0) + 1
            }));
          }
        }
      });
      
      // Listen for group chat message deletions
      socket.on('group_chat_message_deleted', (data: { message_id: number, group_id: number }) => {
                
        // Only update if we're in the relevant room
        const roomId = `group_${data.group_id}`;
        if (roomId === currentRoom?.id) {
          setMessages(prevMessages => 
            prevMessages.filter(msg => msg.id !== data.message_id)
          );
        }
      });

      // Listen for user join/leave events
      socket.on('user_joined', (data: { username: string, room_id: number }) => {
                if (data.room_id.toString() === currentRoom?.id) {
          fetchParticipants()
        }
      })

      socket.on('user_left', (data: { username: string, room_id: number }) => {
                if (data.room_id.toString() === currentRoom?.id) {
          fetchParticipants()
        }
      })

      socket.on('error', (error: { message: string }) => {
        console.error('[Socket Event] Received error:', error)
        setError(error.message)
      })

      // Cleanup socket listeners
      return () => {
        socket.off('connect')
        socket.off('disconnect')
        socket.off('new_message')
        socket.off('user_joined')
        socket.off('user_left')
        socket.off('error')
        socket.off('group_chat_message')
        socket.off('group_chat_message_deleted')
      }
    }
  }, [user, isConnected, socket, fetchRooms, currentRoom?.id, isOpen, isMinimized, fetchParticipants])

  // Remove the separate useEffect for currentRoom changes as it's now handled in handleRoomClick
  useEffect(() => {
    scrollToBottom()
  }, [messages, scrollToBottom])

  useEffect(() => {
    if (!isOpen || isMinimized) {
      const interval = setInterval(fetchUnreadCount, 30000) // Check every 30 seconds
      return () => clearInterval(interval)
    }
  }, [isOpen, isMinimized, fetchUnreadCount])

  useEffect(() => {
    if (isOpen && !isMinimized && currentRoom) {
      // Reset unread count for current room when opening chat
      setUnreadCount(prev => ({
        ...prev,
        [currentRoom.id]: 0
      }))
    }
  }, [isOpen, isMinimized, currentRoom])

  const totalUnreadCount = Object.values(unreadCount).reduce((a, b) => a + b, 0)

  // Handle section selection
  const handleSectionClick = (sectionId: 'global' | 'support' | 'groups' | 'private') => {
    setSelectedCategory(sectionId)
    setView('rooms')
  }

  // Handle back button click
  const handleBack = () => {
    if (view === 'chat') {
      setView('rooms')
    } else if (view === 'rooms') {
      setView('menu')
    }
  }

  return (
    <div className="fixed bottom-4 right-4 z-50">
      {!isOpen ? (
        <Button
          onClick={() => {
            setIsOpen(true)
            setView('menu')
          }}
          size="lg"
          className="rounded-full h-12 px-4 shadow-lg hover:shadow-xl transition-all duration-300 bg-[#e76f51] hover:bg-[#e25b3a] text-white"
        >
          <MessageCircle className="h-5 w-5 mr-2" />
          Chat
          {totalUnreadCount > 0 && (
            <Badge variant="destructive" className="ml-2 animate-pulse bg-[#2c5530]">
              {totalUnreadCount}
            </Badge>
          )}
        </Button>
      ) : (
        <div className="bg-white rounded-lg shadow-2xl w-[400px] flex flex-col h-[500px] border border-gray-200 transition-all duration-300">
          <div className="flex justify-between items-center p-4 bg-gradient-to-r from-[#2c5530] to-[#3a6b3e] text-white rounded-t-lg">
            <div className="flex items-center gap-2">
              {view !== 'menu' && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleBack}
                  className="mr-2 hover:bg-white/20 text-white"
                >
                  <ChevronDown className="h-4 w-4 rotate-90" />
                </Button>
              )}
              <h2 className="font-semibold text-lg">
                {view === 'menu' ? 'Chat' : 
                 view === 'rooms' ? sections.find(s => s.id === selectedCategory)?.name : 
                 currentRoom?.name || 'Chat'}
              </h2>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setIsOpen(false)
                  setView('menu')
                }}
                className="hover:bg-white/20 text-white"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {!isMinimized && (
            <>
              {view === 'menu' && (
                <div className="flex-1 p-4 bg-[#f0f4e9]">
                  <div className="grid gap-4">
                    {sections.map((section) => (
                      <Button
                        key={section.id}
                        variant="outline"
                        className="flex items-center justify-start h-auto p-4 text-left hover:shadow-md transition-all duration-300 bg-white hover:bg-[#f8f9f3] border-[#d1e0d3]"
                        onClick={() => handleSectionClick(section.id as any)}
                      >
                        <div className="mr-4 p-2 rounded-full bg-[#e9f0e6] text-[#2c5530]">
                          {section.icon}
                        </div>
                        <div>
                          <div className="font-semibold text-[#2c5530]">{section.name}</div>
                          <div className="text-sm text-[#5a7d61]">{section.description}</div>
                        </div>
                      </Button>
                    ))}
                  </div>
                </div>
              )}

              {view === 'rooms' && (
                <div className="flex-1 p-4 bg-[#f0f4e9]">
                  <div className="space-y-2">
                    {rooms
                      .filter(room => room.category === selectedCategory)
                      .map(room => (
                        <Button
                          key={room.id}
                          variant="ghost"
                          className="w-full justify-between h-auto p-4 hover:shadow-md transition-all duration-300 bg-white hover:bg-[#f8f9f3] border border-[#d1e0d3] rounded-lg"
                          onClick={() => handleRoomClick(room.id)}
                        >
                          <div className="flex items-center gap-3">
                            <div className="p-2 rounded-full bg-[#e9f0e6] text-[#2c5530]">
                              <MessageCircle className="h-4 w-4" />
                            </div>
                            <span className="font-semibold text-[#2c5530]">{room.name}</span>
                          </div>
                          {unreadCount[room.id] > 0 && (
                            <Badge variant="destructive" className="animate-pulse bg-[#e76f51]">
                              {unreadCount[room.id]}
                            </Badge>
                          )}
                        </Button>
                      ))}
                  </div>
                </div>
              )}

              {view === 'chat' && (
                <>
                  <div className="flex-1 overflow-y-auto p-4 min-h-[400px] bg-[#f0f4e9]">
                    {error && (
                      <div className="bg-red-100 text-red-600 p-3 rounded-lg mb-2 shadow-sm border border-red-200">
                        {error}
                      </div>
                    )}
                    {isLoading ? (
                      <div className="flex items-center justify-center h-full">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#2c5530]"></div>
                      </div>
                    ) : (
                      <div className="space-y-4 min-h-full">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex flex-col ${
                              message.sender_name === user?.username || message.author_name === user?.username
                        ? "items-end"
                        : "items-start"
                    }`}
                  >
                            <div
                              className={`rounded-lg p-3 max-w-[80%] shadow-sm ${
                                message.sender_name === user?.username || message.author_name === user?.username
                                  ? "bg-gradient-to-r from-[#e76f51] to-[#e25b3a] text-white"
                                  : "bg-white border border-[#d1e0d3]"
                              }`}
                            >
                              <p className={`text-xs font-semibold mb-1 ${
                                message.sender_name === user?.username || message.author_name === user?.username
                                  ? "text-white/90"
                                  : "text-[#2c5530]"
                              }`}>
                                {message.sender_name || message.author_name}
                              </p>
                              <p className={`text-sm ${
                                message.sender_name === user?.username || message.author_name === user?.username
                                  ? "text-white"
                                  : "text-[#5a7d61]"
                              }`}>
                      {message.content}
                              </p>
                              <p className={`text-xs mt-1 ${
                                message.sender_name === user?.username || message.author_name === user?.username
                                  ? "text-white/70"
                                  : "text-[#5a7d61]/70"
                              }`}>
                                {formatDate(message.created_at)}
                              </p>
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
                      </div>
                    )}
              </div>

                  <div className="p-4 border-t border-[#d1e0d3] bg-white rounded-b-lg">
                <form
                  onSubmit={(e) => {
                    e.preventDefault()
                    sendMessage()
                  }}
                  className="flex gap-2"
                >
                  <input
                    type="text"
                    value={messageInput}
                    onChange={(e) => setMessageInput(e.target.value)}
                    placeholder="Type a message..."
                        className="flex-1 rounded-lg border border-[#d1e0d3] p-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#2c5530] focus:border-transparent shadow-sm"
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault()
                        sendMessage()
                      }
                    }}
                  />
                      <Button 
                        type="submit" 
                        size="sm"
                        className="bg-[#e76f51] hover:bg-[#e25b3a] text-white border-none shadow-md"
                      >
                    Send
                  </Button>
                </form>
              </div>
                </>
              )}
            </>
          )}
        </div>
      )}
    </div>
  )
} 
