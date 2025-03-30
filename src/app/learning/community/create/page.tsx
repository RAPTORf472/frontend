'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/auth-context';
import Link from 'next/link';
import { ArrowLeft, Leaf, X, Image, Link2, Smile, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Spinner } from '@/components/ui/spinner';
import Editor from '@/components/Editor';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Category } from '@/types/learning';
export default function CreateCommunityContent() {
  const router = useRouter();
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [categories, setCategories] = useState<Category[]>([]);
  const [thumbnailUrl, setThumbnailUrl] = useState('');
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    category_id: '',
    excerpt: '',
    duration: ''
  });

  // Function to strip HTML tags and convert to plain text
  const stripHtmlTags = (html: string): string => {
    if (typeof window !== 'undefined') {
      const doc = new DOMParser().parseFromString(html, 'text/html');
      return doc.body.textContent || '';
    }
    return html.replace(/<[^>]*>/g, ''); // Fallback for server-side
  };

  useEffect(() => {
    if (!user) {
      router.push('/auth/login');
      return;
    }

    const fetchCategories = async () => {
      setIsLoading(true);
      try {
        const response = await fetch('/api/learning/categories');
        if (!response.ok) {
          throw new Error(`Error: ${response.status}`);
        }
        const data = await response.json();
        
        if (data.categories) {
          let communityCategories = data.categories.filter((category: Category) => category.content_type === 'community' || category.content_type === 'general');
          setCategories(communityCategories);
        } else if (Array.isArray(data)) {
          let communityCategories = data.filter((category: Category) => category.content_type === 'community' || category.content_type === 'general');
          setCategories(communityCategories);
        } else {
          setCategories([]);
        }
      } catch (error) {
        console.error('Error fetching categories:', error);
        setCategories([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchCategories();
  }, [user, router]);

  const calculateReadingTime = (text: string): string => {
    // Average reading speed: 200 words per minute
    const wordCount = text.split(/\s+/).length;
    const minutes = Math.ceil(wordCount / 200);
    return `${minutes} min read`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim() || !formData.content.trim() || !formData.category_id) {
      return;
    }

    setIsSubmitting(true);
    try {
      // Create a plain text version of the content for the excerpt
      const plainTextContent = stripHtmlTags(formData.content);
      
      // If excerpt wasn't manually entered, create one from content
      const excerpt = formData.excerpt.trim() || 
        (plainTextContent.substring(0, 150) + (plainTextContent.length > 150 ? '...' : ''));
      
      // Calculate reading time if not provided
      const duration = formData.duration.trim() || calculateReadingTime(plainTextContent);
      
      const response = await fetch('/api/learning/materials/community', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          title: formData.title,
          content: formData.content,
          category_id: parseInt(formData.category_id),
          excerpt: excerpt,
          thumbnail_url: thumbnailUrl,
          duration: duration
        })
      });

      if (response.ok) {
        const data = await response.json();
        router.push(`/learning/community/${data.material.id}`);
      } else {
        const errorData = await response.json();
        console.error('Error response:', errorData);
      }
    } catch (error) {
      console.error('Error creating community content:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f8f9f3] py-12 relative">
      {/* Nature-themed background */}
      <div 
        className="absolute inset-0 bg-cover bg-center opacity-10 z-0" 
        style={{ 
          backgroundImage: "url('https://images.unsplash.com/photo-1441974231531-c6227db76b6e?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80')",
          backgroundAttachment: "fixed"
        }}
        aria-hidden="true"
      />
      
      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-4xl mx-auto">
          <div className="mb-6">
            <Link
              href="/learning"
              className="inline-flex items-center text-[#2c5530] hover:text-[#3a6b3e] transition-colors"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Learning Hub
            </Link>
          </div>

          <Card className="border-[#d1e0d3] overflow-hidden bg-white shadow-md">
            <CardHeader className="bg-[#f0f4e9] border-b border-[#d1e0d3] pb-6">
              <div className="flex items-center mb-2">
                <Leaf className="mr-2 h-5 w-5 text-[#e76f51]" />
                <h1 className="text-2xl font-bold text-[#2c5530]">Create Community Content</h1>
              </div>
              <p className="text-[#5a7d61]">Share your knowledge and experiences with the community.</p>
            </CardHeader>

            <CardContent className="p-6">
              {isLoading ? (
                <div className="flex justify-center items-center py-10">
                  <Spinner size="lg" />
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="title" className="text-[#2c5530] font-medium">
                      Title
                    </Label>
                    <Input
                      id="title"
                      placeholder="Give your content a descriptive title"
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      className="border-[#d1e0d3] focus-visible:ring-[#2c5530]"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="category" className="text-[#2c5530] font-medium">
                      Category
                    </Label>
                    <Select
                      value={formData.category_id}
                      onValueChange={(value) => {
                        setFormData({ ...formData, category_id: value });
                      }}
                      required
                    >
                      <SelectTrigger className="border-[#d1e0d3] focus:ring-[#2c5530]">
                        <SelectValue placeholder="Select a category" />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map((category) => (
                          <SelectItem key={category.id} value={String(category.id)}>
                            {category.title}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="excerpt" className="text-[#2c5530] font-medium">
                      Brief Summary (optional)
                    </Label>
                    <Input
                      id="excerpt"
                      placeholder="A brief summary of your content (150 characters max)"
                      value={formData.excerpt}
                      onChange={(e) => setFormData({ ...formData, excerpt: e.target.value })}
                      className="border-[#d1e0d3] focus-visible:ring-[#2c5530]"
                      maxLength={150}
                    />
                    <p className="text-xs text-[#5a7d61]">
                      If left empty, we'll automatically generate a summary from your content.
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="content" className="text-[#2c5530] font-medium">
                      Content
                    </Label>
                    <Editor
                      value={formData.content}
                      onChange={(value) => setFormData({ ...formData, content: value })}
                      placeholder="Share your knowledge, experiences, or tips..."
                      className="min-h-[400px]"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="thumbnail" className="text-[#2c5530] font-medium">
                        Thumbnail URL (optional)
                      </Label>
                      <Input
                        id="thumbnail"
                        placeholder="https://example.com/image.jpg"
                        value={thumbnailUrl}
                        onChange={(e) => setThumbnailUrl(e.target.value)}
                        className="border-[#d1e0d3] focus-visible:ring-[#2c5530]"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="duration" className="text-[#2c5530] font-medium">
                        Reading Time (optional)
                      </Label>
                      <div className="flex items-center">
                        <Input
                          id="duration"
                          placeholder="e.g., 5 min read"
                          value={formData.duration}
                          onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                          className="border-[#d1e0d3] focus-visible:ring-[#2c5530]"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="ml-2 text-[#5a7d61]"
                          onClick={() => {
                            const plainText = stripHtmlTags(formData.content);
                            setFormData({ 
                              ...formData, 
                              duration: calculateReadingTime(plainText)
                            });
                          }}
                        >
                          <Clock className="h-4 w-4" />
                        </Button>
                      </div>
                      <p className="text-xs text-[#5a7d61]">
                        If left empty, we'll calculate this automatically.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 text-[#5a7d61] border-t border-[#d1e0d3] pt-4">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="text-[#5a7d61] hover:text-[#2c5530] hover:bg-[#d1e0d3]"
                      onClick={() => {
                        const imgTag = `<img src="" alt="Image" />`;
                        setFormData({
                          ...formData,
                          content: formData.content + imgTag
                        });
                      }}
                    >
                      <Image className="h-4 w-4 mr-1" />
                      Add Image
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="text-[#5a7d61] hover:text-[#2c5530] hover:bg-[#d1e0d3]"
                      onClick={() => {
                        const linkTag = `<a href="" target="_blank"></a>`;
                        setFormData({
                          ...formData,
                          content: formData.content + linkTag
                        });
                      }}
                    >
                      <Link2 className="h-4 w-4 mr-1" />
                      Add Link
                    </Button>
                  </div>

                  <div className="flex justify-end gap-2 pt-4">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => router.push('/learning')}
                      className="border-[#d1e0d3] text-[#5a7d61] hover:bg-[#e9f0e6] hover:text-[#2c5530]"
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      className="bg-[#e76f51] hover:bg-[#e25b3a] text-white"
                      disabled={isSubmitting || !formData.title || !formData.content || !formData.category_id}
                    >
                      {isSubmitting ? (
                        <>
                          <Spinner className="mr-2 h-4 w-4" />
                          Submitting...
                        </>
                      ) : (
                        'Submit Community Content'
                      )}
                    </Button>
                  </div>
                </form>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
} 