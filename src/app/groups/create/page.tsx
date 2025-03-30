"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { ImagePlus, X, Leaf, ArrowLeft } from "lucide-react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import { Spinner } from "@/components/ui/spinner"
import Link from "next/link"

export default function CreateGroupPage() {
  const router = useRouter()
  const { user } = useAuth()
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [imageUrl, setImageUrl] = useState("")
  const [imagePreview, setImagePreview] = useState<string>("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState("")

  const handleImageUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const url = e.target.value
    setImageUrl(url)
    
    // Only set the preview if there's an actual URL
    if (url.trim()) {
      setImagePreview(url)
    } else {
      setImagePreview("")
    }
  }

  const removeImage = () => {
    setImageUrl("")
    setImagePreview("")
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    if (!name.trim()) {
      setError("Group name is required")
      return
    }

    if (!description.trim()) {
      setError("Description is required")
      return
    }

    setIsSubmitting(true)

    try {
      const requestData = {
        name,
        description,
        image_url: imageUrl || undefined
      }
      
      const response = await fetch('/api/groups', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(requestData)
      })

      const data = await response.json()
      
      if (response.ok) {
        router.push(`/groups/${data.id}`)
      } else {
        setError(data.error || 'Failed to create group')
      }
    } catch (error) {
      console.error('Frontend Component - Error creating group:', error)
      setError('Failed to create group')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!user) {
    router.push('/auth/login')
    return null
  }

  return (
    <div className="min-h-screen bg-[#f8f9f3] py-12">
      <div className="container mx-auto px-4">
        <div className="max-w-3xl mx-auto">
          <div className="mb-6">
            <Link
              href="/groups"
              className="inline-flex items-center text-[#2c5530] hover:text-[#3a6b3e] transition-colors"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Groups
            </Link>
          </div>

          <Card className="border-[#d1e0d3] overflow-hidden bg-white shadow-md">
            <CardHeader className="bg-[#f0f4e9] border-b border-[#d1e0d3] pb-6">
              <div className="flex items-center mb-2">
                <Leaf className="mr-2 h-5 w-5 text-[#e76f51]" />
                <h1 className="text-2xl font-bold text-[#2c5530]">Create a Group</h1>
              </div>
              <p className="text-[#5a7d61]">Start a new environmental community and connect with like-minded individuals.</p>
            </CardHeader>

            <CardContent className="p-6">
              <form onSubmit={handleSubmit} className="space-y-6">
                {error && (
                  <div className="p-3 text-sm text-red-500 bg-red-50 border border-red-200 rounded">
                    {error}
                  </div>
                )}

                {/* Group Image */}
                <div className="space-y-2">
                  <Label htmlFor="group-image-url" className="text-[#2c5530] font-medium">
                    Group Image URL
                  </Label>
                  
                  <Input
                    id="group-image-url"
                    type="url"
                    value={imageUrl}
                    onChange={handleImageUrlChange}
                    placeholder="Enter image URL (https://...)"
                    className="border-[#d1e0d3] focus-visible:ring-[#2c5530]"
                  />
                  
                  {imagePreview && (
                    <div className="relative aspect-video mt-2">
                      <img
                        src={imagePreview}
                        alt="Group preview"
                        className="w-full h-full object-cover rounded-lg border border-[#d1e0d3]"
                        onError={() => setError("Invalid image URL. Please provide a valid direct link to an image.")}
                      />
                      <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        className="absolute top-2 right-2"
                        onClick={removeImage}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                  
                  <p className="text-xs text-[#5a7d61] mt-1">
                    Provide a direct URL to an image (JPG, PNG, etc.)
                  </p>
                </div>

                {/* Group Name */}
                <div className="space-y-2">
                  <Label htmlFor="group-name" className="text-[#2c5530] font-medium">
                    Group Name
                  </Label>
                  <Input
                    id="group-name"
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Enter group name"
                    className="border-[#d1e0d3] focus-visible:ring-[#2c5530]"
                    required
                  />
                </div>

                {/* Description */}
                <div className="space-y-2">
                  <Label htmlFor="group-description" className="text-[#2c5530] font-medium">
                    Description
                  </Label>
                  <Textarea
                    id="group-description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Describe your group's mission and activities"
                    required
                    className="min-h-[200px] border-[#d1e0d3] focus-visible:ring-[#2c5530]"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-4 border-t border-[#d1e0d3]">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => router.push("/groups")}
                    className="border-[#d1e0d3] text-[#5a7d61] hover:bg-[#e9f0e6] hover:text-[#2c5530]"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    className="bg-[#e76f51] hover:bg-[#e25b3a] text-white"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <>
                        <Spinner size="sm" className="mr-2" />
                        Creating Group...
                      </>
                    ) : (
                      'Create Group'
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
