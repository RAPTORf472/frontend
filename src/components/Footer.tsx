import Link from "next/link"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import {
  Facebook,
  Twitter,
  Instagram,
  Linkedin,
  Youtube,
  TreePine,
  ArrowRight,
  Mail,
  Phone,
  MapPin,
} from "lucide-react"

export function Footer() {
  return (
    <footer className="bg-green-950 text-white">
      {/* Main Footer */}
      <div className="container px-4 py-16">
        <div className="grid gap-12 lg:grid-cols-4">
          {/* Brand Column */}
          <div className="space-y-6">
            <div className="flex items-center space-x-2">
              <TreePine className="h-6 w-6 text-green-400" />
              <span className="text-xl font-bold">Green Buddy</span>
            </div>
            <p className="text-green-300">
              Making Earth greener, one tree at a time. Join our mission to create a sustainable future for all.
            </p>
            <div className="flex space-x-4">
              <a
                href="#"
                className="rounded-full bg-green-900 p-2 text-green-300 transition-colors hover:bg-green-800 hover:text-white"
              >
                <Facebook className="h-5 w-5" />
                <span className="sr-only">Facebook</span>
              </a>
              <a
                href="#"
                className="rounded-full bg-green-900 p-2 text-green-300 transition-colors hover:bg-green-800 hover:text-white"
              >
                <Twitter className="h-5 w-5" />
                <span className="sr-only">Twitter</span>
              </a>
              <a
                href="#"
                className="rounded-full bg-green-900 p-2 text-green-300 transition-colors hover:bg-green-800 hover:text-white"
              >
                <Instagram className="h-5 w-5" />
                <span className="sr-only">Instagram</span>
              </a>
              <a
                href="#"
                className="rounded-full bg-green-900 p-2 text-green-300 transition-colors hover:bg-green-800 hover:text-white"
              >
                <Linkedin className="h-5 w-5" />
                <span className="sr-only">LinkedIn</span>
              </a>
              <a
                href="#"
                className="rounded-full bg-green-900 p-2 text-green-300 transition-colors hover:bg-green-800 hover:text-white"
              >
                <Youtube className="h-5 w-5" />
                <span className="sr-only">YouTube</span>
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div className="space-y-6">
            <h3 className="text-lg font-semibold">Quick Links</h3>
            <ul className="space-y-3 text-green-300">
              <li>
                <Link href="/about" className="transition-colors hover:text-white">
                  About Us
                </Link>
              </li>
              <li>
                <Link href="/events" className="transition-colors hover:text-white">
                  Events
                </Link>
              </li>
              <li>
                <Link href="/blog" className="transition-colors hover:text-white">
                  Blog
                </Link>
              </li>
              <li>
                <Link href="/donate" className="transition-colors hover:text-white">
                  Donate
                </Link>
              </li>
              <li>
                <Link href="/learn" className="transition-colors hover:text-white">
                  Learning Resources
                </Link>
              </li>
              <li>
                <Link href="/challenges" className="transition-colors hover:text-white">
                  Challenges
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact Info */}
          <div className="space-y-6">
            <h3 className="text-lg font-semibold">Contact Us</h3>
            <ul className="space-y-4 text-green-300">
              <li className="flex items-center space-x-3">
                <Mail className="h-5 w-5" />
                <span>contact@greenbuddy.com</span>
              </li>
              <li className="flex items-center space-x-3">
                <Phone className="h-5 w-5" />
                <span>(555) 123-4567</span>
              </li>
              <li className="flex items-center space-x-3">
                <MapPin className="h-5 w-5" />
                <span>123 Green Street, Eco City, EC 12345</span>
              </li>
            </ul>
          </div>

          {/* Newsletter */}
          <div className="space-y-6">
            <h3 className="text-lg font-semibold">Stay Updated</h3>
            <p className="text-green-300">Subscribe to our newsletter for the latest updates and news.</p>
            <form className="space-y-2">
              <div className="flex space-x-2">
                <Input
                  type="email"
                  placeholder="Enter your email"
                  className="bg-green-900 text-white placeholder:text-green-500"
                />
                <Button type="submit" variant="secondary">
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
              <p className="text-xs text-green-400">
                By subscribing, you agree to our Privacy Policy and consent to receive updates from our company.
              </p>
            </form>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-green-900">
        <div className="container flex flex-col items-center gap-4 px-4 py-6 text-center sm:flex-row sm:justify-between">
          <p className="text-sm text-green-400">© 2024 Green Buddy. All rights reserved.</p>
          <div className="flex gap-6 text-sm text-green-400">
            <Link href="/privacy" className="transition-colors hover:text-white">
              Privacy Policy
            </Link>
            <Link href="/terms" className="transition-colors hover:text-white">
              Terms of Service
            </Link>
            <Link href="/cookies" className="transition-colors hover:text-white">
              Cookie Policy
            </Link>
          </div>
        </div>
      </div>
    </footer>
  )
} 