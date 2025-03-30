"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Pencil, Plus, Trash2 } from "lucide-react"

interface AdminControlsProps {
  onDelete?: () => void
  editHref?: string
  createHref?: string
  className?: string
}

export function AdminControls({ onDelete, editHref, createHref, className = "" }: AdminControlsProps) {
  return (
    <div className={`flex gap-2 ${className}`}>
      {editHref && (
        <Button size="sm" variant="secondary" asChild>
          <Link href={editHref}>
            <Pencil className="h-4 w-4" />
          </Link>
        </Button>
      )}
      {onDelete && (
        <Button size="sm" variant="destructive" onClick={onDelete}>
          <Trash2 className="h-4 w-4" />
        </Button>
      )}
      {createHref && (
        <Link href={createHref}>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Create
          </Button>
        </Link>
      )}
    </div>
  )
} 