import React, { useState, useEffect } from 'react';
import { VideoCard } from '../../../components/learning/VideoCard';
import { VideoCardSkeleton } from '../../../components/learning/VideoCardSkeleton';

interface Video {
    id: string;
    title: string;
    description: string;
    thumbnail_url: string;
    duration: string;
    views_count: number;
    likes_count: number;
    comments_count: number;
    created_at: string;
    author: {
        id: string;
        username: string;
        avatar_url: string;
    };
}

interface VideosContentProps {
    selectedCategory: string | null;
}

export function VideosContent({ selectedCategory }: VideosContentProps) {
    const [videos, setVideos] = useState<Video[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchVideos = async () => {
            try {
                setIsLoading(true);
                const queryParams = new URLSearchParams();
                if (selectedCategory) {
                    queryParams.append('category', selectedCategory);
                }
                const response = await fetch(`/api/learning/materials/videos?${queryParams.toString()}`);
                if (!response.ok) {
                    throw new Error('Failed to fetch videos');
                }
                const data = await response.json();
                setVideos(data);
                setError(null);
            } catch (err) {
                console.error('Error fetching videos:', err);
                setError('Failed to load videos. Please try again later.');
            } finally {
                setIsLoading(false);
            }
        };

        fetchVideos();
    }, [selectedCategory]);

    if (isLoading) {
        return (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[1, 2, 3].map((i) => (
                    <VideoCardSkeleton key={i} />
                ))}
            </div>
        );
    }

    if (error) {
        return (
            <div className="text-center py-8">
                <p className="text-red-500">{error}</p>
            </div>
        );
    }

    if (videos.length === 0) {
        return (
            <div className="text-center py-8">
                <p className="text-gray-500">No videos found{selectedCategory ? ' in this category' : ''}.</p>
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {videos.map((video) => (
                <VideoCard key={video.id} video={video} />
            ))}
        </div>
    );
} 