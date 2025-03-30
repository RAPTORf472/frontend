"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Upload, X, AlertCircle } from "lucide-react"
import { toast } from "sonner"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface SubmitChallengeFormProps {
  challengeId: number
  onSubmitSuccess: () => void
}

export function SubmitChallengeForm({ challengeId, onSubmitSuccess }: SubmitChallengeFormProps) {
  const [proofText, setProofText] = useState("")
  const [proofUrls, setProofUrls] = useState<string[]>([])
  const [newUrl, setNewUrl] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const validateUrl = (url: string) => {
    try {
      new URL(url)
      return true
    } catch {
      return false
    }
  }

  const handleAddUrl = () => {
    if (!newUrl) return

    if (!validateUrl(newUrl)) {
      toast.error("Please enter a valid URL")
      return
    }

    if (proofUrls.includes(newUrl)) {
      toast.error("This URL has already been added")
      return
    }

    setProofUrls([...proofUrls, newUrl])
    setNewUrl("")
  }

  const handleRemoveUrl = (urlToRemove: string) => {
    setProofUrls(proofUrls.filter(url => url !== urlToRemove))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    // Validate proof text
    if (!proofText.trim()) {
      setError("Please provide a description of how you completed the challenge")
      return
    }

    if (proofText.length < 20) {
      setError("Please provide a more detailed description (at least 20 characters)")
      return
    }

    setIsSubmitting(true)
    try {
      const token = localStorage.getItem('token')
      if (!token) {
        throw new Error('You must be logged in to submit a challenge')
      }

      const response = await fetch(`api/challenges/${challengeId}/submit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          submission: {
            text: proofText,
            urls: proofUrls.length > 0 ? proofUrls : undefined
          }
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to submit challenge')
      }

      toast.success("Challenge submitted successfully! Awaiting moderator review.")
      setProofText("")
      setProofUrls([])
      onSubmitSuccess()
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to submit challenge'
      setError(message)
      toast.error(message)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div>
        <label className="block text-sm font-medium mb-1">
          Proof Description
        </label>
        <Textarea
          value={proofText}
          onChange={(e) => {
            setProofText(e.target.value)
            setError(null)
          }}
          placeholder="Describe in detail how you completed this challenge..."
          className="min-h-[100px]"
          required
        />
        <p className="text-sm text-gray-500 mt-1">
          Minimum 20 characters. Be specific about how you completed the challenge.
        </p>
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">
          Add Proof URLs (Optional)
        </label>
        <div className="flex gap-2 mb-2">
          <Input
            type="url"
            value={newUrl}
            onChange={(e) => setNewUrl(e.target.value)}
            placeholder="Enter URL to photo/video proof"
            onKeyPress={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault()
                handleAddUrl()
              }
            }}
          />
          <Button
            type="button"
            variant="outline"
            onClick={handleAddUrl}
            disabled={!newUrl}
          >
            Add
          </Button>
        </div>

        {proofUrls.length > 0 && (
          <div className="space-y-2">
            {proofUrls.map((url, index) => (
              <div key={index} className="flex items-center gap-2 bg-gray-50 p-2 rounded">
                <a
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-blue-600 hover:underline flex-1 truncate"
                >
                  {url}
                </a>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => handleRemoveUrl(url)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>

      <Button type="submit" disabled={isSubmitting} className="w-full">
        <Upload className="mr-2 h-4 w-4" />
        {isSubmitting ? "Submitting..." : "Submit Challenge"}
      </Button>
    </form>
  )
} 