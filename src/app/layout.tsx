import type React from "react"
import "./globals.css"
import { Inter } from "next/font/google"
import { MainNav } from "@/components/main-nav"
import { Footer } from "@/components/Footer"
import { GlobalChat } from "@/components/chat/GlobalChat"
import { Providers } from "@/components/providers"

const inter = Inter({ subsets: ["latin"] })

export const metadata = {
  title: 'Green Buddy - Plant Trees, Grow Future',
  description: 'Join Green Buddy in our mission to make Earth greener, one tree at a time.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <Providers>
          <div className="flex min-h-screen flex-col">
            <MainNav />
            <main className="flex-1">{children}</main>
            <Footer />
            <GlobalChat />
          </div>
        </Providers>
      </body>
    </html>
  )
}

