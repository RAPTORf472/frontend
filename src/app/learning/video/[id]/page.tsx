import { Metadata } from "next"
import { VideoPageContent } from "./video-page-content"

export const metadata: Metadata = {
  title: "Video Tutorial",
  description: "Watch and learn from our video tutorials about tree planting and environmental conservation.",
}

interface VideoPageProps {
  params: {
    id: string
  }
}

export default function VideoPage({ params }: VideoPageProps) {
  return <VideoPageContent params={params} />
} 