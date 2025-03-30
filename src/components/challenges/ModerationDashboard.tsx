"use client"

import { useState, useEffect, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle, CardFooter, CardDescription } from "@/components/ui/card"
import {
  CheckCircle,
  XCircle,
  ExternalLink,
  Search,
  Clock,
  User,
  Award,
  Calendar,
  ChevronDown,
  Loader2,
  CheckCheck,
  Shield,
  RefreshCw,
  SlidersHorizontal,
  LinkIcon,
} from "lucide-react"
import { toast } from "sonner"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { motion, AnimatePresence } from "framer-motion"

interface Submission {
  submission_id: number
  submitter_username: string
  challenge_title: string
  exp_reward: number
  proof_text: string
  proof_urls: string[] | null
  submitted_at: string
}

export function ModerationDashboard() {
  const [submissions, setSubmissions] = useState<Submission[]>([])
  const [loading, setLoading] = useState(true)
  const [feedback, setFeedback] = useState<{ [key: number]: string }>({})
  const [searchQuery, setSearchQuery] = useState("")
  const [sortBy, setSortBy] = useState<"date" | "exp">("date")
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc")
  const [activeTab, setActiveTab] = useState("all")
  const [expandedSubmission, setExpandedSubmission] = useState<number | null>(null)
  const [reviewingSubmission, setReviewingSubmission] = useState<number | null>(null)

  const fetchSubmissions = async () => {
    try {
      setLoading(true)
      const token = localStorage.getItem("token")
      const response = await fetch("/api/challenges/submissions/pending", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || "Failed to fetch submissions")
      }

      const data = await response.json()
      setSubmissions(data)
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to fetch submissions"
      toast.error(message)
      console.error("Error fetching submissions:", error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchSubmissions()
  }, [])

  const handleReview = async (submissionId: number, approved: boolean) => {
    try {
      setReviewingSubmission(submissionId)
      const token = localStorage.getItem("token")
      const currentFeedback = feedback[submissionId]?.trim() || null

      const response = await fetch(`/api/challenges/submissions/${submissionId}/review`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          approved,
          feedback: currentFeedback,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || "Failed to review submission")
      }

      toast.success(approved ? "Submission approved successfully" : "Submission rejected", {
        icon: approved ? (
          <CheckCircle className="h-4 w-4 text-green-500" />
        ) : (
          <XCircle className="h-4 w-4 text-red-500" />
        ),
      })

      // Remove the reviewed submission from the list
      setSubmissions(submissions.filter((s) => s.submission_id !== submissionId))

      // Clear the feedback for this submission
      setFeedback((prev) => {
        const { [submissionId]: _, ...rest } = prev
        return rest
      })
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to review submission"
      toast.error(message)
      console.error("Error reviewing submission:", error)
    } finally {
      setReviewingSubmission(null)
    }
  }

  const toggleExpand = (submissionId: number) => {
    setExpandedSubmission(expandedSubmission === submissionId ? null : submissionId)
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return new Intl.DateTimeFormat("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date)
  }

  const getTimeAgo = (dateString: string) => {
    const now = new Date()
    const date = new Date(dateString)
    const diffMs = now.getTime() - date.getTime()
    const diffSec = Math.floor(diffMs / 1000)
    const diffMin = Math.floor(diffSec / 60)
    const diffHour = Math.floor(diffMin / 60)
    const diffDay = Math.floor(diffHour / 24)

    if (diffSec < 60) return "just now"
    if (diffMin < 60) return `${diffMin}m ago`
    if (diffHour < 24) return `${diffHour}h ago`
    return `${diffDay}d ago`
  }

  // Filter and sort submissions
  const filteredSubmissions = useMemo(() => {
    let result = [...submissions]

    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      result = result.filter(
        (s) => s.challenge_title.toLowerCase().includes(query) || s.submitter_username.toLowerCase().includes(query),
      )
    }

    // Apply sorting
    result.sort((a, b) => {
      if (sortBy === "date") {
        return sortOrder === "asc"
          ? new Date(a.submitted_at).getTime() - new Date(b.submitted_at).getTime()
          : new Date(b.submitted_at).getTime() - new Date(a.submitted_at).getTime()
      } else {
        return sortOrder === "asc" ? a.exp_reward - b.exp_reward : b.exp_reward - a.exp_reward
      }
    })

    return result
  }, [submissions, searchQuery, sortBy, sortOrder])

  const handleRefresh = () => {
    fetchSubmissions()
  }

  const toggleSortOrder = () => {
    setSortOrder(sortOrder === "asc" ? "desc" : "asc")
  }

  const renderEmptyState = () => (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="text-center py-12 px-4"
    >
      <div className="bg-[#f0f4e9] rounded-full p-4 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
        <CheckCheck className="h-8 w-8 text-[#2c5530]" />
      </div>
      <h3 className="text-xl font-semibold text-[#2c5530] mb-2">All caught up!</h3>
      <p className="text-[#5a7d61] max-w-md mx-auto mb-6">
        There are no pending submissions to review at the moment. Check back later or refresh to see new submissions.
      </p>
      <Button onClick={handleRefresh} variant="outline" className="border-[#2c5530] text-[#2c5530] hover:bg-[#f0f4e9]">
        <RefreshCw className="mr-2 h-4 w-4" />
        Refresh
      </Button>
    </motion.div>
  )

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#2c5530] flex items-center gap-2">
            <Shield className="h-6 w-6" />
            Moderation Dashboard
          </h1>
          <p className="text-[#5a7d61]">Review and manage challenge submissions</p>
        </div>
        <Button
          onClick={handleRefresh}
          variant="outline"
          className="border-[#2c5530] text-[#2c5530] hover:bg-[#f0f4e9]"
        >
          <RefreshCw className="mr-2 h-4 w-4" />
          Refresh
        </Button>
      </div>

      {/* Filters and Search */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-[#5a7d61]" />
          <Input
            placeholder="Search by challenge or username..."
            className="pl-9 border-[#d1e0d3] focus-visible:ring-[#2c5530]"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="flex gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="border-[#d1e0d3] text-[#2c5530]">
                <SlidersHorizontal className="mr-2 h-4 w-4" />
                Sort by
                <ChevronDown className="ml-2 h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                className={sortBy === "date" ? "bg-[#f0f4e9] text-[#2c5530]" : ""}
                onClick={() => setSortBy("date")}
              >
                <Calendar className="mr-2 h-4 w-4" />
                Date
              </DropdownMenuItem>
              <DropdownMenuItem
                className={sortBy === "exp" ? "bg-[#f0f4e9] text-[#2c5530]" : ""}
                onClick={() => setSortBy("exp")}
              >
                <Award className="mr-2 h-4 w-4" />
                XP Reward
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={toggleSortOrder}>
                {sortOrder === "asc" ? "Ascending" : "Descending"}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Submissions List */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-12">
          <Loader2 className="h-8 w-8 text-[#2c5530] animate-spin mb-4" />
          <p className="text-[#5a7d61]">Loading submissions...</p>
        </div>
      ) : filteredSubmissions.length === 0 ? (
        renderEmptyState()
      ) : (
        <div className="space-y-4">
          <AnimatePresence>
            {filteredSubmissions.map((submission) => (
              <motion.div
                key={submission.submission_id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3 }}
              >
                <Card className="border-[#d1e0d3] overflow-hidden hover:shadow-md transition-shadow">
                  <CardHeader className="bg-[#f8f9f3] pb-4">
                    <div className="flex justify-between items-start">
                      <div className="flex items-start gap-3">
                        <Avatar className="h-10 w-10 border border-[#d1e0d3]">
                          <AvatarImage
                            src={`https://api.dicebear.com/7.x/initials/svg?seed=${submission.submitter_username}`}
                          />
                          <AvatarFallback className="bg-[#e9f0e6] text-[#2c5530]">
                            {submission.submitter_username[0]}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <CardTitle className="text-lg text-[#2c5530]">{submission.challenge_title}</CardTitle>
                          <CardDescription className="flex items-center gap-2">
                            <User className="h-3 w-3" />
                            <span>{submission.submitter_username}</span>
                            <span className="inline-block w-1 h-1 rounded-full bg-[#5a7d61]"></span>
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <span className="flex items-center gap-1 cursor-help">
                                    <Clock className="h-3 w-3" />
                                    <span>{getTimeAgo(submission.submitted_at)}</span>
                                  </span>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>{formatDate(submission.submitted_at)}</p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          </CardDescription>
                        </div>
                      </div>
                      <Badge className="bg-[#e76f51] hover:bg-[#e76f51]">+{submission.exp_reward} XP</Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-4">
                    <div className="space-y-4">
                      <div>
                        <h4 className="font-medium mb-2 text-[#2c5530] flex items-center gap-2">
                          Proof Description
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 px-2 text-xs text-[#5a7d61] hover:text-[#2c5530] hover:bg-[#f0f4e9]"
                            onClick={() => toggleExpand(submission.submission_id)}
                          >
                            {expandedSubmission === submission.submission_id ? "Show less" : "Show more"}
                          </Button>
                        </h4>
                        <p
                          className={`text-[#5a7d61] whitespace-pre-wrap ${expandedSubmission !== submission.submission_id && "line-clamp-3"}`}
                        >
                          {submission.proof_text}
                        </p>
                      </div>

                      {submission.proof_urls && submission.proof_urls.length > 0 && (
                        <div>
                          <h4 className="font-medium mb-2 text-[#2c5530] flex items-center gap-2">
                            <LinkIcon className="h-4 w-4" />
                            Proof URLs
                          </h4>
                          <div className="space-y-1">
                            {submission.proof_urls.map((url, index) => (
                              <a
                                key={index}
                                href={url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center text-[#2c5530] hover:text-[#3a6b3e] hover:underline bg-[#f0f4e9] px-3 py-2 rounded-md"
                              >
                                <span className="truncate flex-1">{url}</span>
                                <ExternalLink className="ml-2 h-4 w-4 flex-shrink-0" />
                              </a>
                            ))}
                          </div>
                        </div>
                      )}

                      <div>
                        <h4 className="font-medium mb-2 text-[#2c5530]">Feedback (Optional)</h4>
                        <Textarea
                          value={feedback[submission.submission_id] || ""}
                          onChange={(e) =>
                            setFeedback((prev) => ({
                              ...prev,
                              [submission.submission_id]: e.target.value,
                            }))
                          }
                          placeholder="Provide feedback to the user..."
                          className="mb-4 border-[#d1e0d3] focus-visible:ring-[#2c5530]"
                        />
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter className="bg-[#f8f9f3] border-t border-[#d1e0d3] flex gap-3">
                    <Button
                      onClick={() => handleReview(submission.submission_id, true)}
                      className="flex-1 bg-[#2c5530] hover:bg-[#3a6b3e] text-white"
                      disabled={reviewingSubmission === submission.submission_id}
                    >
                      {reviewingSubmission === submission.submission_id ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <CheckCircle className="mr-2 h-4 w-4" />
                      )}
                      Approve
                    </Button>
                    <Button
                      onClick={() => handleReview(submission.submission_id, false)}
                      className="flex-1 bg-white border-[#d1e0d3] text-[#e76f51] hover:bg-[#fff8f6] hover:text-[#e25b3a]"
                      variant="outline"
                      disabled={reviewingSubmission === submission.submission_id}
                    >
                      {reviewingSubmission === submission.submission_id ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <XCircle className="mr-2 h-4 w-4" />
                      )}
                      Reject
                    </Button>
                  </CardFooter>
                </Card>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  )
}

