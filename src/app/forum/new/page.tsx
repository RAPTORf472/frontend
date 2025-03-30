'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/auth-context';
import Link from 'next/link';
import { ArrowLeft, Leaf, Image, Link2, Smile } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Spinner } from '@/components/ui/spinner';
import Editor from '@/components/Editor';
import { Label } from '@/components/ui/label';

interface Category {
  id: number;
  name: string;
  description: string;
}

export default function NewDiscussionPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [categories, setCategories] = useState<Category[]>([]);
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    category_id: '',
    category_name: '',
  });

  // Function to strip HTML tags and convert to plain text
  const stripHtmlTags = (html: string): string => {
    const doc = new DOMParser().parseFromString(html, 'text/html');
    return doc.body.textContent || '';
  };

  useEffect(() => {
    if (!user) {
      router.push('/auth/login');
      return;
    }

    const fetchCategories = async () => {
      setIsLoading(true);
      try {
        const response = await fetch('/api/forum/categories');
        if (!response.ok) {
          throw new Error(`Error: ${response.status}`);
        }
        const data = await response.json();
                
        if (data.categories) {
          setCategories(data.categories);
        } else if (Array.isArray(data)) {
          setCategories(data.map((category: any) => ({
            id: category.id,
            name: category.name || category.title || 'Unnamed Category',
            description: category.description || ''
          })));
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim() || !formData.content.trim() || !formData.category_id || !formData.category_name) {
      return;
    }

    setIsSubmitting(true);
    try {
      // Create a plain text version of the content for the excerpt
      const plainTextContent = typeof window !== 'undefined' 
        ? stripHtmlTags(formData.content)
        : formData.content.replace(/<[^>]*>/g, ''); // Fallback regex for server-side
      
      // Ensure the excerpt is plain text without HTML formatting
      const excerpt = plainTextContent.substring(0, 200) + (plainTextContent.length > 200 ? '...' : '');
            
      const response = await fetch('/api/forum/discussions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          title: formData.title,
          content: formData.content,
          category: formData.category_name,
          excerpt: excerpt
        })
      });

      if (response.ok) {
        const data = await response.json();
        router.push(`/forum/discussions/${data.id}`);
      } else {
        const errorData = await response.json();
        console.error('Error response:', errorData);
      }
    } catch (error) {
      console.error('Error creating discussion:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f8f9f3] py-12 relative">
      {/* Background image */}
      <div 
        className="absolute inset-0 bg-cover bg-center opacity-10 z-0" 
        style={{ 
          backgroundImage: "url('https://4kwallpapers.com/images/walls/thumbs_3t/2445.jpg')",
          backgroundAttachment: "fixed"
        }}
        aria-hidden="true"
      />
      
      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-3xl mx-auto">
          <div className="mb-6">
            <Link
              href="/forum"
              className="inline-flex items-center text-[#2c5530] hover:text-[#3a6b3e] transition-colors"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Forum
            </Link>
          </div>

          <Card className="border-[#d1e0d3] overflow-hidden bg-white shadow-md">
            <CardHeader className="bg-[#f0f4e9] border-b border-[#d1e0d3] pb-6">
              <div className="flex items-center mb-2">
                <Leaf className="mr-2 h-5 w-5 text-[#e76f51]" />
                <h1 className="text-2xl font-bold text-[#2c5530]">Start a New Discussion</h1>
              </div>
              <p className="text-[#5a7d61]">Share your thoughts, questions, or ideas with the community.</p>
            </CardHeader>

            <CardContent className="p-6">
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="title" className="text-[#2c5530] font-medium">
                    Title
                  </Label>
                  <Input
                    id="title"
                    placeholder="What's your discussion about?"
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
                  <div className="mt-2 flex flex-wrap gap-2">
                    {isLoading ? (
                      <div className="flex justify-center w-full py-4">
                        <Spinner className="h-6 w-6" />
                      </div>
                    ) : categories.length > 0 ? (
                      categories.map((category) => (
                        <Button
                          key={category.id}
                          type="button"
                          onClick={() => setFormData({ 
                            ...formData, 
                            category_id: String(category.id),
                            category_name: category.name
                          })}
                          className={`rounded-full px-3 py-1 text-sm font-medium transition-colors ${
                            formData.category_id === String(category.id)
                              ? 'bg-[#2c5530] text-white'
                              : 'bg-[#e9f0e6] text-[#2c5530] hover:bg-[#d1e0d3]'
                          }`}
                          variant="ghost"
                        >
                          {category.name}
                        </Button>
                      ))
                    ) : (
                      <div className="text-[#5a7d61] py-2">No categories available</div>
                    )}
                  </div>
                  {formData.category_id && (
                    <p className="text-sm text-[#5a7d61] mt-2">
                      Selected: <span className="font-medium">{formData.category_name}</span>
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="content" className="text-[#2c5530] font-medium">
                    Content
                  </Label>
                  <div className="border border-[#d1e0d3] rounded-md focus-within:ring-1 focus-within:ring-[#2c5530]">
                    <Editor
                      value={formData.content}
                      onChange={(value) => setFormData({ ...formData, content: value })}
                      placeholder="Write your discussion content..."
                    />
                  </div>
                </div>


                <div className="flex justify-end gap-2 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => router.push("/forum")}
                    className="border-[#d1e0d3] text-[#5a7d61] hover:bg-[#e9f0e6] hover:text-[#2c5530]"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    className="bg-[#e76f51] hover:bg-[#e25b3a] text-white"
                    disabled={isSubmitting || isLoading || categories.length === 0 || !formData.title.trim() || !formData.content.trim() || !formData.category_id || !formData.category_name}
                  >
                    {isSubmitting ? (
                      <>
                        <Spinner className="h-4 w-4 mr-2" />
                        Posting...
                      </>
                    ) : (
                      'Post Discussion'
                    )}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
} 
