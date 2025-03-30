import { Metadata } from "next"
import { CommunityPageContent } from "./community-page-content"

export const metadata: Metadata = {
  title: "Community Article",
  description: "Read articles contributed by our community about tree planting and environmental conservation.",
}

interface CommunityPageProps {
  params: {
    id: string
  }
}

export default function CommunityPage({ params }: CommunityPageProps) {
  return <CommunityPageContent params={params} />
} 