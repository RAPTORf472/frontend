'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatDistanceToNow } from 'date-fns';
import Link from 'next/link';
import { MessageSquare, ThumbsUp, Eye } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

interface RelatedDiscussion {
  id: number;
  title: string;
  excerpt: string;
  username: string;
  category_name: string;
  created_at: string;
  reply_count: number;
  like_count: number;
  view_count: number;
}

interface RelatedDiscussionsProps {
  discussionId: number;
  limit?: number;
}

export function RelatedDiscussions({ discussionId, limit = 5 }: RelatedDiscussionsProps) {
  const [discussions, setDiscussions] = useState<RelatedDiscussion[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchRelatedDiscussions = async () => {
      if (!discussionId) return;
      
      try {
        setIsLoading(true);
        const response = await fetch(`/api/forum/discussions/${discussionId}/related?limit=${limit}`);
        
        if (!response.ok) {
          throw new Error('Failed to fetch related discussions');
        }
        
        const data = await response.json();
        if (data.success && data.discussions) {
          setDiscussions(data.discussions);
        } else {
          throw new Error(data.error || 'Failed to fetch related discussions');
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
        console.error('Error fetching related discussions:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchRelatedDiscussions();
  }, [discussionId, limit]);

  const formatDate = (dateString: string) => {
    try {
      return formatDistanceToNow(new Date(dateString), { addSuffix: true });
    } catch (error) {
      return 'Invalid date';
    }
  };

  if (isLoading) {
    return (
      <Card className="border-[#d1e0d3] overflow-hidden bg-white">
        <CardHeader className="bg-[#f0f4e9] border-b border-[#d1e0d3] pb-3">
          <CardTitle className="text-[#2c5530] text-lg">Related Discussions</CardTitle>
          <CardDescription className="text-[#5a7d61]">Loading related discussions...</CardDescription>
        </CardHeader>
        <CardContent className="p-4 space-y-3">
          {Array(3).fill(0).map((_, i) => (
            <div key={i} className="space-y-2 p-2">
              <Skeleton className="h-3 w-16 mb-1" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3 w-24" />
              <div className="flex gap-3 mt-1">
                <Skeleton className="h-3 w-12" />
                <Skeleton className="h-3 w-12" />
                <Skeleton className="h-3 w-12" />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="border-[#d1e0d3] overflow-hidden bg-white">
        <CardHeader className="bg-[#f0f4e9] border-b border-[#d1e0d3] pb-3">
          <CardTitle className="text-[#2c5530] text-lg">Related Discussions</CardTitle>
          <CardDescription className="text-red-500">Error loading discussions</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  if (discussions.length === 0) {
    return (
      <Card className="border-[#d1e0d3] overflow-hidden bg-white">
        <CardHeader className="bg-[#f0f4e9] border-b border-[#d1e0d3] pb-3">
          <CardTitle className="text-[#2c5530] text-lg">Related Discussions</CardTitle>
          <CardDescription className="text-[#5a7d61]">No related discussions found</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card className="border-[#d1e0d3] overflow-hidden bg-white">
      <CardHeader className="bg-[#f0f4e9] border-b border-[#d1e0d3] pb-3">
        <CardTitle className="text-[#2c5530] text-lg">Related Discussions</CardTitle>
        <CardDescription className="text-[#5a7d61]">Discussions you might be interested in</CardDescription>
      </CardHeader>
      <CardContent className="p-4">
        <div className="space-y-3">
          {discussions.map((discussion) => (
            <Link 
              key={discussion.id}
              href={`/forum/discussions/${discussion.id}`}
              className="block p-2 rounded-lg hover:bg-[#f0f4e9] transition-colors"
            >
              <Badge variant="secondary" className="px-1.5 py-0 text-xs bg-[#2c5530]/10 text-[#2c5530] border-none mb-1.5 inline-block">
                {discussion.category_name}
              </Badge>
              <h4 className="font-medium text-[#2c5530] text-sm">{discussion.title}</h4>
              <div className="flex items-center gap-1.5 text-xs text-[#5a7d61] mt-1">
                <span>{formatDate(discussion.created_at)}</span>
              </div>
              <div className="flex items-center gap-3 mt-1 text-xs text-[#5a7d61]">
                <div className="flex items-center gap-1">
                  <MessageSquare className="h-3 w-3" />
                  <span>{discussion.reply_count}</span>
                </div>
                <div className="flex items-center gap-1">
                  <ThumbsUp className="h-3 w-3" />
                  <span>{discussion.like_count}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Eye className="h-3 w-3" />
                  <span>{discussion.view_count}</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </CardContent>
    </Card>
  );
} 