"use client"

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/auth-context'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Image as ImageIcon, X, ArrowLeft, Link2, Smile, Leaf } from 'lucide-react'
import { Spinner } from '@/components/ui/spinner'
import Editor from '@/components/Editor'
import { Label } from '@/components/ui/label'
import Link from 'next/link'
import { Input } from '@/components/ui/input'

interface Tag {
  id: number
  name: string
}

export default function CreateBlogPage() {
  const router = useRouter()
  const { user, isLoading: authLoading } = useAuth()
  const [isLoading, setIsLoading] = useState(false)
  const [tags, setTags] = useState<Tag[]>([])
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    excerpt: '',
    featured_image_url: '',
    tags: [] as string[]
  })
  const [error, setError] = useState('')
  const [initialized, setInitialized] = useState(false)

  useEffect(() => {
    // Wait for auth to be checked
    if (authLoading) return

    // Only redirect if user is not logged in
    if (!user) {
      router.push('/auth/login')
      return
    }

    if (!initialized) {
      fetchTags()
      setInitialized(true)
    }
  }, [user, authLoading, router, initialized])

  // Show loading state while checking auth
  if (authLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Spinner size="lg" className="text-[#2c5530]" />
      </div>
    )
  }

  const fetchTags = async () => {
    try {
      const response = await fetch('/api/blog/tags')
      const data = await response.json()
      if (!data.success) {
        throw new Error(data.message || 'Failed to fetch tags')
      }
      setTags(data.tags)
    } catch (error) {
      console.error('Error fetching tags:', error)
      setError(error instanceof Error ? error.message : 'Failed to fetch tags')
    }
  }

  const handleImageUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const url = e.target.value
    setFormData(prev => ({ ...prev, featured_image_url: url }))
  }

  const removeImage = () => {
    setFormData(prev => ({ ...prev, featured_image_url: '' }))
  }

  const handleTagChange = (tag: string) => {
    setFormData(prev => {
      const newTags = prev.tags.includes(tag)
        ? prev.tags.filter(id => id !== tag)
        : [...prev.tags, tag]
      return { ...prev, tags: newTags }
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    // Validate required fields
    if (!formData.title.trim()) {
      setError('Title is required')
      setIsLoading(false)
      return
    }

    if (!formData.content.trim()) {
      setError('Content is required')
      setIsLoading(false)
      return
    }

    try {
      const response = await fetch('/api/blog', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          ...formData,
          status: 'published' // Set status to published by default
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || 'Failed to create blog post')
      }

      // Redirect to the newly created post
      router.push(`/blog/${data.id}`)
    } catch (error) {
      console.error('Error creating blog post:', error)
      setError(error instanceof Error ? error.message : 'Failed to create blog post')
    } finally {
      setIsLoading(false)
    }
  }

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
              href="/blog"
              className="inline-flex items-center text-[#2c5530] hover:text-[#3a6b3e] transition-colors"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Blog
            </Link>
          </div>

          <Card className="border-[#d1e0d3] overflow-hidden bg-white shadow-md">
            <CardHeader className="bg-[#f0f4e9] border-b border-[#d1e0d3] pb-6">
              <div className="flex items-center mb-2">
                <Leaf className="mr-2 h-5 w-5 text-[#e76f51]" />
                <h1 className="text-2xl font-bold text-[#2c5530]">Create New Blog Post</h1>
              </div>
              <p className="text-[#5a7d61]">Share your knowledge and insights with the community.</p>
            </CardHeader>
            
            <CardContent className="p-6">
              {error && (
                <div className="mb-6 p-4 bg-red-50 text-red-500 rounded-md border border-red-200">
                  {error}
                </div>
              )}
              
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Title */}
                <div className="space-y-2">
                  <Label className="text-[#2c5530] font-medium">
                    Post Title
                  </Label>
                  <input
                    type="text"
                    required
                    value={formData.title}
                    onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                    className="w-full px-3 py-2 border border-[#d1e0d3] rounded-md focus:outline-none focus:ring-1 focus:ring-[#2c5530]"
                    placeholder="Enter post title"
                  />
                </div>

                {/* Content */}
                <div className="space-y-2">
                  <Label className="text-[#2c5530] font-medium">
                    Content
                  </Label>
                  <div className="border border-[#d1e0d3] rounded-md focus-within:ring-1 focus-within:ring-[#2c5530]">
                    <Editor
                      value={formData.content}
                      onChange={(value) => setFormData(prev => ({ ...prev, content: value }))}
                    />
                  </div>
                </div>

                {/* Excerpt */}
                <div className="space-y-2">
                  <Label className="text-[#2c5530] font-medium">
                    Excerpt
                  </Label>
                  <textarea
                    value={formData.excerpt}
                    onChange={(e) => setFormData(prev => ({ ...prev, excerpt: e.target.value }))}
                    className="w-full px-3 py-2 border border-[#d1e0d3] rounded-md focus:outline-none focus:ring-1 focus:ring-[#2c5530]"
                    rows={3}
                    placeholder="Enter a brief excerpt"
                  />
                </div>

                {/* Image URL Input */}
                <div className="space-y-2">
                  <Label className="text-[#2c5530] font-medium">
                    Featured Image URL
                  </Label>
                  <div className="space-y-4">
                    <Input
                      type="url"
                      value={formData.featured_image_url}
                      onChange={handleImageUrlChange}
                      className="w-full border-[#d1e0d3] focus:ring-[#2c5530]"
                      placeholder="https://example.com/image.jpg"
                    />
                    
                    {formData.featured_image_url ? (
                      <div className="relative">
                        <div className="mt-2 border border-[#d1e0d3] rounded-md p-1 relative">
                          <img
                            src={formData.featured_image_url}
                            alt="Preview"
                            className="w-full h-48 object-cover rounded"
                            onError={(e) => {
                              e.currentTarget.src = "https://placehold.co/600x400?text=Invalid+Image+URL";
                            }}
                          />
                          <button
                            type="button"
                            onClick={removeImage}
                            className="absolute -right-2 -top-2 rounded-full bg-[#e76f51] p-1 text-white hover:bg-[#e25b3a]"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex justify-center">
                        <div className="border-2 border-dashed border-[#d1e0d3] rounded-md p-8 w-full flex flex-col items-center text-[#5a7d61]">
                          <ImageIcon className="h-8 w-8 mb-2" />
                          <p className="text-sm">Enter an image URL above to display a preview</p>
                          <p className="text-xs mt-2">Default blog template will be used if no image URL is provided</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Tags */}
                <div className="space-y-2">
                  <Label className="text-[#2c5530] font-medium">
                    Tags
                  </Label>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {tags.map((tag) => (
                      <Button
                        key={tag.id}
                        type="button"
                        onClick={() => handleTagChange(tag.name)}
                        className={`rounded-full px-3 py-1 text-sm font-medium transition-colors ${
                          formData.tags.includes(tag.name)
                            ? 'bg-[#2c5530] text-white'
                            : 'bg-[#e9f0e6] text-[#2c5530] hover:bg-[#d1e0d3]'
                        }`}
                        variant="ghost"
                      >
                        {tag.name}
                      </Button>
                    ))}
                  </div>
                </div>

                <div className="flex items-center gap-2 text-[#5a7d61] border-t border-[#d1e0d3] pt-4">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="text-[#5a7d61] hover:text-[#2c5530] hover:bg-[#d1e0d3]"
                  >
                    <ImageIcon className="h-4 w-4 mr-1" />
                    Add Image
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="text-[#5a7d61] hover:text-[#2c5530] hover:bg-[#d1e0d3]"
                  >
                    <Link2 className="h-4 w-4 mr-1" />
                    Add Link
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="text-[#5a7d61] hover:text-[#2c5530] hover:bg-[#d1e0d3]"
                  >
                    <Smile className="h-4 w-4 mr-1" />
                    Add Emoji
                  </Button>
                </div>

                {/* Submit Button */}
                <div className="flex justify-end gap-2 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => router.push('/blog')}
                    className="border-[#d1e0d3] text-[#5a7d61] hover:bg-[#e9f0e6] hover:text-[#2c5530]"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={isLoading}
                    className="bg-[#e76f51] hover:bg-[#e25b3a] text-white"
                  >
                    {isLoading ? (
                      <>
                        <Spinner className="h-4 w-4 mr-2" />
                        Creating Post...
                      </>
                    ) : (
                      'Create Post'
                    )}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
} 