import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Eye, ThumbsUp, MessageSquare } from 'lucide-react';

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

interface VideoCardProps {
    video: Video;
}

export function VideoCard({ video }: VideoCardProps) {
    return (
        <Link href={`/learning/videos/${video.id}`}>
            <Card className="overflow-hidden hover:shadow-lg transition-shadow">
                <div className="relative aspect-video">
                    <Image
                        src={video.thumbnail_url}
                        alt={video.title}
                        fill
                        className="object-cover"
                    />
                    <div className="absolute bottom-2 right-2 bg-black/75 text-white px-2 py-1 rounded text-sm">
                        {video.duration}
                    </div>
                </div>
                <CardContent className="p-4">
                    <h3 className="font-semibold text-lg mb-2 line-clamp-2">{video.title}</h3>
                    <p className="text-sm text-gray-500 mb-4 line-clamp-2">{video.description}</p>
                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                            <Avatar className="h-6 w-6">
                                <AvatarImage src={video.author.avatar_url} alt={video.author.username} />
                                <AvatarFallback>{video.author.username[0]}</AvatarFallback>
                            </Avatar>
                            <span className="text-sm text-gray-700">{video.author.username}</span>
                        </div>
                        <div className="flex items-center space-x-4 text-sm text-gray-500">
                            <div className="flex items-center space-x-1">
                                <Eye className="h-4 w-4" />
                                <span>{video.views_count}</span>
                            </div>
                            <div className="flex items-center space-x-1">
                                <ThumbsUp className="h-4 w-4" />
                                <span>{video.likes_count}</span>
                            </div>
                            <div className="flex items-center space-x-1">
                                <MessageSquare className="h-4 w-4" />
                                <span>{video.comments_count}</span>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </Link>
    );
} 