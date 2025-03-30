import { Metadata } from "next"
import { ArticlePageContent } from "./article-page-content"

export const metadata: Metadata = {
  title: "Article",
  description: "Read our articles about tree planting and environmental conservation.",
}

interface ArticlePageProps {
  params: {
    id: string
  }
}

export default function ArticlePage({ params }: ArticlePageProps) {
  return <ArticlePageContent params={params} />
} 