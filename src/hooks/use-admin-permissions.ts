"use client"

import { useAuth } from "@/contexts/auth-context"

export function useAdminPermissions() {
  const { user } = useAuth()
  const isAdminOrModerator = user?.roles?.some(role => ['admin', 'moderator'].includes(role))
  const isAdmin = user?.roles?.includes('admin')
  const isModerator = user?.roles?.includes('moderator')
  const isOwner = (authorId: number) => user?.id === authorId

  return {
    isAdminOrModerator,
    isAdmin,
    isModerator,
    isOwner,
    canEdit: (authorId: number) => isAdminOrModerator || isOwner(authorId),
    canDelete: (authorId: number) => isAdmin || isOwner(authorId),
    canCreate: () => isAdminOrModerator,
    canVerify: () => isAdminOrModerator
  }
} 