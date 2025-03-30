"use client"

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/auth-context'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Calendar, MapPin, Users, Image as ImageIcon, X, ArrowLeft, Leaf, Link2, Smile } from 'lucide-react'
import { Spinner } from '@/components/ui/spinner'
import Editor from '@/components/Editor'
import { Label } from '@/components/ui/label'

interface Category {
  id: number;
  name: string;
}

export default function CreateEventPage() {
  const router = useRouter()
  const { user } = useAuth()
  const [isLoading, setIsLoading] = useState(false)
  const [categories, setCategories] = useState<Category[]>([])
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    location: '',
    start_date: '',
    end_date: '',
    category_id: '',
    max_participants: '',
    image_url: '',
    requirements: '',
    schedule: ''
  })
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    // Redirect if user is not admin or moderator
    if (user && !user.roles?.some(role => ['admin', 'moderator'].includes(role))) {
      router.push('/events')
      return
    }
    fetchCategories()
  }, [user, router])

  const fetchCategories = async () => {
    try {
      const response = await fetch('/api/events/categories')
      const data = await response.json()
      setCategories(data)
    } catch (error) {
      console.error('Error fetching categories:', error)
    }
  }

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setImageFile(file)
    setPreviewUrl(URL.createObjectURL(file))

    // Upload image to server
    const formData = new FormData()
    formData.append('image', file)

    try {
      const response = await fetch('/api/events/upload-image', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: formData
      })

      if (!response.ok) throw new Error('Failed to upload image')

      const data = await response.json()
      setFormData(prev => ({ ...prev, image_url: data.url }))
    } catch (error) {
      console.error('Error uploading image:', error)
      setError('Failed to upload image')
    }
  }

  const removeImage = () => {
    setImageFile(null)
    setPreviewUrl('')
    setFormData(prev => ({ ...prev, image_url: '' }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    try {
      // Get the category name from the selected category_id
      const selectedCategory = categories.find(c => c.id.toString() === formData.category_id)
      if (!selectedCategory) {
        throw new Error('Invalid category selected')
      }

      const response = await fetch('/api/events', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          ...formData,
          category: selectedCategory.name, // Send category name instead of ID
          max_participants: parseInt(formData.max_participants)
        })
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to create event')
      }

      router.push('/events')
    } catch (error) {
      console.error('Error creating event:', error)
      setError(error instanceof Error ? error.message : 'Failed to create event')
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
              href="/events"
              className="inline-flex items-center text-[#2c5530] hover:text-[#3a6b3e] transition-colors"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Events
            </Link>
          </div>

          <Card className="border-[#d1e0d3] overflow-hidden bg-white shadow-md">
            <CardHeader className="bg-[#f0f4e9] border-b border-[#d1e0d3] pb-6">
              <div className="flex items-center mb-2">
                <Leaf className="mr-2 h-5 w-5 text-[#e76f51]" />
                <CardTitle className="text-2xl font-bold text-[#2c5530]">Create New Event</CardTitle>
              </div>
              <p className="text-[#5a7d61]">Organize an environmental event to engage the community.</p>
            </CardHeader>
            <CardContent className="p-6">
              {error && (
                <div className="mb-4 rounded-lg bg-red-50 p-4 text-red-500 border border-red-200">
                  {error}
                </div>
              )}
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Title */}
                <div className="space-y-2">
                  <Label htmlFor="title" className="text-[#2c5530] font-medium">
                    Event Title
                  </Label>
                  <input
                    id="title"
                    type="text"
                    required
                    value={formData.title}
                    onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                    className="mt-1 block w-full rounded-md border border-[#d1e0d3] px-3 py-2 focus:border-[#2c5530] focus:outline-none focus:ring-1 focus:ring-[#2c5530]"
                    placeholder="Enter event title"
                  />
                </div>

                {/* Category selection */}
                <div className="space-y-2">
                  <Label htmlFor="category" className="text-[#2c5530] font-medium">
                    Category
                  </Label>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {categories.length > 0 ? (
                      categories.map((category) => (
                        <Button
                          key={category.id}
                          type="button"
                          onClick={() => setFormData(prev => ({ ...prev, category_id: category.id.toString() }))}
                          className={`rounded-full px-3 py-1 text-sm font-medium transition-colors ${
                            formData.category_id === category.id.toString()
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
                      Selected: <span className="font-medium">
                        {categories.find(c => c.id.toString() === formData.category_id)?.name}
                      </span>
                    </p>
                  )}
                </div>

                {/* Description */}
                <div className="space-y-2">
                  <Label htmlFor="description" className="text-[#2c5530] font-medium">
                    Description
                  </Label>
                  <div className="border border-[#d1e0d3] rounded-md focus-within:ring-1 focus-within:ring-[#2c5530]">
                    <Editor
                      value={formData.description}
                      onChange={(value) => setFormData(prev => ({ ...prev, description: value }))}
                      placeholder="Provide a detailed description of your event..."
                    />
                  </div>
                </div>

                {/* Location */}
                <div className="space-y-2">
                  <Label htmlFor="location" className="text-[#2c5530] font-medium">
                    Location
                  </Label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#5a7d61]" />
                    <input
                      id="location"
                      type="text"
                      required
                      value={formData.location}
                      onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                      className="block w-full rounded-md border border-[#d1e0d3] pl-10 pr-3 py-2 focus:border-[#2c5530] focus:outline-none focus:ring-1 focus:ring-[#2c5530]"
                      placeholder="Event location"
                    />
                  </div>
                </div>

                {/* Date and Time */}
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="start_date" className="text-[#2c5530] font-medium">
                      Start Date & Time
                    </Label>
                    <div className="relative">
                      <Calendar className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#5a7d61]" />
                      <input
                        id="start_date"
                        type="datetime-local"
                        required
                        value={formData.start_date}
                        onChange={(e) => setFormData(prev => ({ ...prev, start_date: e.target.value }))}
                        className="block w-full rounded-md border border-[#d1e0d3] pl-10 pr-3 py-2 focus:border-[#2c5530] focus:outline-none focus:ring-1 focus:ring-[#2c5530]"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="end_date" className="text-[#2c5530] font-medium">
                      End Date & Time
                    </Label>
                    <div className="relative">
                      <Calendar className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#5a7d61]" />
                      <input
                        id="end_date"
                        type="datetime-local"
                        required
                        value={formData.end_date}
                        onChange={(e) => setFormData(prev => ({ ...prev, end_date: e.target.value }))}
                        className="block w-full rounded-md border border-[#d1e0d3] pl-10 pr-3 py-2 focus:border-[#2c5530] focus:outline-none focus:ring-1 focus:ring-[#2c5530]"
                      />
                    </div>
                  </div>
                </div>

                {/* Max Participants */}
                <div className="space-y-2">
                  <Label htmlFor="max_participants" className="text-[#2c5530] font-medium">
                    Maximum Participants
                  </Label>
                  <div className="relative">
                    <Users className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#5a7d61]" />
                    <input
                      id="max_participants"
                      type="number"
                      required
                      min="1"
                      value={formData.max_participants}
                      onChange={(e) => setFormData(prev => ({ ...prev, max_participants: e.target.value }))}
                      className="block w-full rounded-md border border-[#d1e0d3] pl-10 pr-3 py-2 focus:border-[#2c5530] focus:outline-none focus:ring-1 focus:ring-[#2c5530]"
                      placeholder="Enter maximum participants"
                    />
                  </div>
                </div>

                {/* Image Upload */}
                <div className="space-y-2">
                  <Label htmlFor="event_image" className="text-[#2c5530] font-medium">
                    Event Image
                  </Label>
                  <div className="mt-1 flex items-center gap-4">
                    {previewUrl ? (
                      <div className="relative h-32 w-32 rounded-lg overflow-hidden border border-[#d1e0d3]">
                        <img
                          src={previewUrl}
                          alt="Preview"
                          className="h-full w-full object-cover"
                        />
                        <button
                          type="button"
                          onClick={removeImage}
                          className="absolute -right-2 -top-2 rounded-full bg-red-500 p-1 text-white hover:bg-red-600"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    ) : (
                      <label className="flex h-32 w-32 cursor-pointer items-center justify-center rounded-lg border-2 border-dashed border-[#d1e0d3] hover:border-[#2c5530] bg-[#f0f4e9]/50">
                        <div className="text-center">
                          <ImageIcon className="mx-auto h-8 w-8 text-[#5a7d61]" />
                          <span className="mt-2 block text-sm text-[#5a7d61]">Upload Image</span>
                        </div>
                        <input
                          id="event_image"
                          type="file"
                          accept="image/*"
                          onChange={handleImageChange}
                          className="hidden"
                        />
                      </label>
                    )}
                  </div>
                </div>

                {/* Requirements */}
                <div className="space-y-2">
                  <Label htmlFor="requirements" className="text-[#2c5530] font-medium">
                    Requirements
                  </Label>
                  <div className="border border-[#d1e0d3] rounded-md focus-within:ring-1 focus-within:ring-[#2c5530]">
                    <Editor
                      value={formData.requirements}
                      onChange={(value) => setFormData(prev => ({ ...prev, requirements: value }))}
                      placeholder="What participants need to bring or prepare..."
                    />
                  </div>
                </div>

                {/* Schedule */}
                <div className="space-y-2">
                  <Label htmlFor="schedule" className="text-[#2c5530] font-medium">
                    Schedule
                  </Label>
                  <div className="border border-[#d1e0d3] rounded-md focus-within:ring-1 focus-within:ring-[#2c5530]">
                    <Editor
                      value={formData.schedule}
                      onChange={(value) => setFormData(prev => ({ ...prev, schedule: value }))}
                      placeholder="Outline the activities and timing of your event..."
                    />
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
                    onClick={() => router.push('/events')}
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
                        Creating Event...
                      </>
                    ) : (
                      'Create Event'
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