export type EventStatus = 'draft' | 'published' | 'cancelled' | 'completed'

export interface Event {
  id: number
  title: string
  description: string
  location: string
  start_date: string
  end_date: string
  category_id: number
  category_name: string
  organizer_id: number
  organizer_username: string
  organizer_name: string | null
  participant_count: number
  max_participants: number
  image_url: string | null
  requirements: string | null
  schedule?: Array<{
    time: string
    title: string
    description: string
  }>
  contact_email: string | null
  contact_phone: string | null
  status: EventStatus
  created_at: string
  upvotes: number
  downvotes: number
  is_registered?: boolean
  is_featured?: boolean
  address?: string
  additional_info?: string
  organizer?: {
    name: string
    title?: string
    description?: string
    email?: string
    phone?: string
    avatar_url?: string
  }
  attendees?: Array<{
    name: string
    avatar_url?: string
  }>
  similar_events?: Array<{
    title: string
    start_date: string
    id: number
  }>
}

export interface EventCategory {
  id: number
  name: string
  description: string | null
}

export interface EventComment {
  id: number
  event_id: number
  user_id: number
  content: string
  parent_id: number | null
  created_at: string
  author_name: string
}

export interface EventVote {
  id: number
  event_id: number
  user_id: number
  vote_type: 'upvote' | 'downvote'
  created_at: string
} 