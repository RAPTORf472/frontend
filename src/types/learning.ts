// Base Material interface
export interface Material {
  id: number
  title: string
  content: string
  excerpt: string
  category_title: string
  type: string
  duration: string | null
  thumbnail_url: string | null
  views_count: number
  likes_count: number
  comments_count: number
  author_id: number
  author_name: string
  author_avatar_url: string | null
  author_bio: string | null
  status: string
  is_liked: boolean
  created_at: string
  category_path: string
  tags: string[]
  
}


// Extended interfaces for specific types
export interface Article extends Material {
  type: 'article';
}

export interface Video extends Material {
  type: 'video'; 
}

export interface Wiki extends Material {
  type: 'wiki';
  contributors?: Contributor[];
}

export interface Community extends Material {
  type: 'community';
  contributors?: Contributor[];
  last_updated?: string;
  revision_history?: HistoryEntry[];
}

// Define comment types
export interface Comment {
  id: number;
  material_id: number;
  user_id: number;
  username: string;
  parent_id: number | null;
  content: string;
  likes_count: number;
  created_at: string;
  updated_at: string;
  replies: Comment[];
  is_optimistic?: boolean;
  is_liked?: boolean;
  user_avatar: string | null;
}


export interface Category {
  id: number;
  slug: string;
  title: string;
  description?: string;
  icon_name?: string;
  content_type: 'general' | 'video' | 'article' | 'wiki' | 'community';
}

export interface FeaturedItem {
  content: Material;
  featured_for: string;
}

// API response interfaces
export interface MaterialResponse {
  success: boolean;
  data?: Material;
  error?: string;
}

export interface MaterialsListResponse {
  success: boolean;
  data?: {
    materials: Material[];
    total?: number;
  };
  error?: string;
}

export interface CategoryResponse {
  success: boolean;
  data?: {
    categories: Category[];
  };
  error?: string;
} 

interface HistoryEntry {
  date: string;
  action: string;
  username: string;
}

interface Contributor {
  username: string;
  avatar?: string;
  contributions: number;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  error?: string;
}

export interface CommentsListResponse {
  items: Comment[];
  total: number;
  pages: number;
  current_page: number;
}

export interface CommentResponse {
  comment: Comment;
}