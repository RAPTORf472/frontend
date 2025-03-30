import { Metadata } from "next"

export const metadata: Metadata = {
  title: "Learn",
  description: "Educational resources about tree planting and environmental conservation.",
}

export default function LearnLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
} 