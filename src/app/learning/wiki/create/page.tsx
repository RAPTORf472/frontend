'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/auth-context';
import Link from 'next/link';
import { ArrowLeft, BookOpen, X, Image, Link2, Smile } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Spinner } from '@/components/ui/spinner';
import Editor from '@/components/Editor';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Category } from '@/types/learning';

export default function CreateWikiPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [categories, setCategories] = useState<Category[]>([]);
  const [thumbnailUrl, setThumbnailUrl] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    category_id: '',
    excerpt: '',
    type: 'wiki' // Fixed to wiki type
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
    // Redirect if user is not logged in or not an admin
    if (!user) {
      router.push('/auth/login');
      return;
    }
    
    // Check if user is admin
    const isAdmin = user.roles && user.roles.includes('admin');
    if (!isAdmin) {
      router.push('/learning');
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
          // Filter for wiki-compatible categories
          const wikiCategories = data.categories.filter(
            (cat: Category) => cat.content_type === 'general' || cat.content_type === 'wiki'
          );
          setCategories(wikiCategories);
        } else if (Array.isArray(data)) {
          setCategories(data);
        } else {
          setCategories([]);
        }
      } catch (error) {
        console.error('Error fetching categories:', error);
        setError('Failed to load categories. Please try again later.');
        setCategories([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchCategories();
  }, [user, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim() || !formData.content.trim() || !formData.category_id) {
      setError('Please fill in all required fields.');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      // Create a plain text version of the content for the excerpt
      const plainTextContent = stripHtmlTags(formData.content);
      
      // If excerpt wasn't manually entered, create one from content
      const excerpt = formData.excerpt.trim() || 
        (plainTextContent.substring(0, 150) + (plainTextContent.length > 150 ? '...' : ''));
      
      const response = await fetch('/api/learning/materials', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          title: formData.title,
          content: formData.content,
          category_id: parseInt(formData.category_id),
          type: 'wiki',
          excerpt: excerpt,
          thumbnail_url: thumbnailUrl
        })
      });

      if (response.ok) {
        const data = await response.json();
        router.push(`/learning/wiki/${data.material.id}`);
      } else {
        const errorData = await response.json();
        console.error('Error response:', errorData);
        setError(errorData.error || 'Failed to create wiki article. Please try again.');
      }
    } catch (error) {
      console.error('Error creating wiki article:', error);
      setError('An unexpected error occurred. Please try again later.');
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
          backgroundImage: "url('https://images.unsplash.com/photo-1501854140801-50d01698950b?ixlib=rb-1.2.1&auto=format&fit=crop&w=1950&q=80')",
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
                <BookOpen className="mr-2 h-5 w-5 text-[#e76f51]" />
                <h1 className="text-2xl font-bold text-[#2c5530]">Create New Wiki Article</h1>
              </div>
              <p className="text-[#5a7d61]">Create a new wiki entry to share knowledge with the community.</p>
            </CardHeader>

            <CardContent className="p-6">
              {isLoading ? (
                <div className="flex justify-center items-center py-10">
                  <Spinner size="lg" />
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-6">
                  {error && (
                    <Alert variant="destructive">
                      <AlertDescription>{error}</AlertDescription>
                    </Alert>
                  )}

                  <div className="space-y-2">
                    <Label htmlFor="title" className="text-[#2c5530] font-medium">
                      Title <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="title"
                      placeholder="Give your wiki entry a descriptive title"
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      className="border-[#d1e0d3] focus-visible:ring-[#2c5530]"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="category" className="text-[#2c5530] font-medium">
                      Category <span className="text-red-500">*</span>
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
                      placeholder="A brief summary of your wiki article (150 characters max)"
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
                      Content <span className="text-red-500">*</span>
                    </Label>
                    <div className="border border-[#d1e0d3] rounded-md min-h-[400px] overflow-hidden focus-within:ring-2 focus-within:ring-[#2c5530] focus-within:ring-offset-2">
                      <Editor
                        onChange={(content) => setFormData({ ...formData, content })}
                        value={formData.content}
                        placeholder="Write your wiki article content here..."
                      />
                    </div>
                    <p className="text-xs text-[#5a7d61]">
                      Use formatting tools to structure your wiki entry with headings, lists, and other elements.
                    </p>
                  </div>

                  <div className="pt-4 flex justify-end space-x-4">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => router.push('/learning')}
                      className="border-[#d1e0d3] text-[#2c5530] hover:bg-[#f0f4e9]"
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      disabled={isSubmitting}
                      className="bg-[#2c5530] hover:bg-[#3a6b3e] text-white"
                    >
                      {isSubmitting ? <Spinner size="sm" className="mr-2" /> : <BookOpen className="mr-2 h-4 w-4" />}
                      Publish Wiki Article
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