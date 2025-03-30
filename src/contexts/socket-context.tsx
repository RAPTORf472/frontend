"use client"

import React, { createContext, useContext, useEffect, useState } from 'react'
import socketIOClient from 'socket.io-client'
import { useAuth } from './auth-context'

interface SocketContextType {
  socket: any
  isConnected: boolean
}

const SocketContext = createContext<SocketContextType | undefined>(undefined)

export function SocketProvider({ children }: { children: React.ReactNode }) {
  const [socket, setSocket] = useState<any>(null)
  const [isConnected, setIsConnected] = useState(false)
  const { user } = useAuth()

  useEffect(() => {
    if (user) {
      const token = localStorage.getItem('token')
      if (!token) return

      console.log('Initializing Socket.IO connection...')

      // Remove 'Bearer ' prefix if present for WebSocket connection
      const cleanToken = token.startsWith('Bearer ') ? token.slice(7) : token

      const newSocket = socketIOClient(process.env.NEXT_PUBLIC_BACKEND_URL || "", {
        transports: ['websocket'],
        reconnection: true,
        reconnectionAttempts: Infinity,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
        timeout: 20000,
        query: { token: cleanToken },
        autoConnect: true
      })

      newSocket.on('connect', () => {
        console.log('Connected to Socket.IO server')
        setIsConnected(true)
      })

      newSocket.on('reconnect', (attemptNumber: number) => {
        console.log('Reconnected to Socket.IO server after', attemptNumber, 'attempts')
        setIsConnected(true)
      })

      newSocket.on('disconnect', (reason: string) => {
        console.log('Disconnected from Socket.IO server:', reason)
        setIsConnected(false)
      })

      newSocket.on('connect_error', (error: Error) => {
        console.error('Socket.IO connection error:', error)
        setIsConnected(false)
      })

      setSocket(newSocket)

      return () => {
        console.log('Cleaning up Socket.IO connection...')
        newSocket.close()
      }
    } else {
      if (socket) {
        socket.close()
        setSocket(null)
        setIsConnected(false)
      }
    }
  }, [user])

  return (
    <SocketContext.Provider value={{ socket, isConnected }}>
      {children}
    </SocketContext.Provider>
  )
}

export function useSocket() {
  const context = useContext(SocketContext)
  if (context === undefined) {
    throw new Error('useSocket must be used within a SocketProvider')
  }
  return context
} 