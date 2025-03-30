import { Suspense } from "react"
import { Spinner } from "@/components/ui/spinner"
import { LearningPageContent } from "./learning-page-content"

export const metadata = {
  title: "Learning Hub - Green Buddy",
  description: "Discover everything you need to know about tree planting and environmental conservation.",
}

function LoadingState() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <Spinner size="lg" className="text-green-600" />
    </div>
  )
}

export default function LearningPage() {
  return (
    <Suspense fallback={<LoadingState />}>
      <LearningPageContent />
    </Suspense>
  )
}



// Remove incomplete handleDelete function