import { WikiPageContent } from "./wiki-page-content"

export const metadata = {
  title: "Wiki Article",
  description: "Read our wiki articles about tree planting and environmental conservation.",
}

interface WikiPageProps {
  params: {
    id: string
  }
}

export default function WikiPage({ params }: WikiPageProps) {
  return <WikiPageContent params={params} />
} 