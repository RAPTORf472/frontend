import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { TreePine, Heart, Globe, Users, Target, ArrowRight, Mail, Phone, MapPin, CheckCircle2 } from "lucide-react"
import Link from "next/link"

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-[#f0f4e9]">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-r from-[#2c5530] to-[#3a6b3e] py-24">
        <div className="container px-4">
          <div className="mx-auto max-w-3xl text-center text-white">
            <Badge className="mb-4 bg-[#3a6b3e]/30">Our Story</Badge>
            <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
              Making Earth Greener,
              <br />
              One Tree at a Time
            </h1>
            <p className="mt-6 text-xl text-[#d1e0d3]">
              Green Buddy started with a simple idea: empower individuals to make a real difference in the fight against
              climate change through community-driven tree planting initiatives.
            </p>
          </div>
        </div>
        <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-b from-transparent to-[#f0f4e9]" />
      </section>

      {/* Mission & Vision */}
      <section className="container px-4 py-16">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="text-3xl font-bold text-[#2c5530]">Our Mission & Vision</h2>
          <p className="mt-4 text-[#5a7d61]">
            We envision a world where every person understands their power to create positive environmental change. Our
            mission is to make tree planting accessible, educational, and impactful for everyone.
          </p>
          <div className="mt-12 grid gap-8 sm:grid-cols-2">
            <Card className="border-2 border-[#d1e0d3] bg-white/50 text-center">
              <CardContent className="pt-6">
                <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-[#e9f0e6]">
                  <Target className="h-6 w-6 text-[#2c5530]" />
                </div>
                <h3 className="text-xl font-bold text-[#2c5530]">Mission</h3>
                <p className="mt-2 text-[#5a7d61]">
                  To create a global movement of environmental stewardship through accessible tree planting initiatives
                  and education.
                </p>
              </CardContent>
            </Card>
            <Card className="border-2 border-[#d1e0d3] bg-white/50 text-center">
              <CardContent className="pt-6">
                <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-[#e9f0e6]">
                  <Globe className="h-6 w-6 text-[#2c5530]" />
                </div>
                <h3 className="text-xl font-bold text-[#2c5530]">Vision</h3>
                <p className="mt-2 text-[#5a7d61]">
                  A world where communities are united in creating and maintaining sustainable, green environments for
                  future generations.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Impact Stats */}
      <section className="bg-[#e9f0e6] py-16">
        <div className="container px-4">
          <div className="mx-auto max-w-6xl">
            <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
              {stats.map((stat, index) => (
                <Card key={index} className="border-none bg-white text-center shadow-md">
                  <CardContent className="p-6">
                    <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-[#e9f0e6]">
                      <stat.icon className="h-6 w-6 text-[#2c5530]" />
                    </div>
                    <div className="text-3xl font-bold text-[#2c5530]">{stat.value}</div>
                    <p className="mt-2 text-[#5a7d61]">{stat.label}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Team Section */}
      <section className="container px-4 py-16">
        <div className="mx-auto max-w-6xl">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-[#2c5530]">Meet Our Team</h2>
            <p className="mt-4 text-[#5a7d61]">
              Passionate individuals dedicated to making our planet greener and healthier.
            </p>
          </div>
          <div className="mt-12 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {team.map((member, index) => (
              <Card key={index} className="overflow-hidden border-[#d1e0d3]">
                <div className="aspect-[4/3] relative">
                  <img
                    src={member.image || "/placeholder.svg"}
                    alt={member.name}
                    className="absolute inset-0 h-full w-full object-cover"
                  />
                </div>
                <CardContent className="p-6 text-center">
                  <h3 className="text-xl font-bold text-[#2c5530]">{member.name}</h3>
                  <p className="text-[#e76f51]">{member.role}</p>
                  <p className="mt-2 text-[#5a7d61]">{member.bio}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="bg-gradient-to-r from-[#2c5530] to-[#3a6b3e] py-16">
        <div className="container px-4">
          <div className="mx-auto max-w-6xl">
            <div className="text-center text-white">
              <h2 className="text-3xl font-bold">Our Values</h2>
              <p className="mt-4 text-[#d1e0d3]">The principles that guide everything we do.</p>
            </div>
            <div className="mt-12 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
              {values.map((value, index) => (
                <div key={index} className="flex gap-4">
                  <div className="flex-none">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white">
                      <CheckCircle2 className="h-5 w-5 text-[#2c5530]" />
                    </div>
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white">{value.title}</h3>
                    <p className="mt-2 text-[#d1e0d3]">{value.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section className="container px-4 py-16">
        <div className="mx-auto max-w-6xl">
          <div className="grid gap-8 lg:grid-cols-2">
            <div>
              <h2 className="text-3xl font-bold text-[#2c5530]">Get in Touch</h2>
              <p className="mt-4 text-[#5a7d61]">Have questions or want to get involved? We'd love to hear from you.</p>
              <div className="mt-8 space-y-6">
                <div className="flex items-center gap-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#e9f0e6]">
                    <Mail className="h-5 w-5 text-[#2c5530]" />
                  </div>
                  <div>
                    <p className="font-medium text-[#2c5530]">Email</p>
                    <p className="text-[#5a7d61]">contact@greenbuddy.com</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#e9f0e6]">
                    <Phone className="h-5 w-5 text-[#2c5530]" />
                  </div>
                  <div>
                    <p className="font-medium text-[#2c5530]">Phone</p>
                    <p className="text-[#5a7d61]">(555) 123-4567</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#e9f0e6]">
                    <MapPin className="h-5 w-5 text-[#2c5530]" />
                  </div>
                  <div>
                    <p className="font-medium text-[#2c5530]">Address</p>
                    <p className="text-[#5a7d61]">123 Green Street, Eco City, EC 12345</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="relative aspect-video overflow-hidden rounded-xl lg:aspect-auto">
              <img
                src="/placeholder.svg?height=400&width=600"
                alt="Office"
                className="absolute inset-0 h-full w-full object-cover"
              />
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container px-4 py-16">
        <Card className="border-none bg-[#f0f4e9] shadow-lg">
          <CardContent className="p-12 text-center">
            <h2 className="text-3xl font-bold text-[#2c5530]">Ready to Make a Difference?</h2>
            <p className="mx-auto mt-4 max-w-2xl text-[#5a7d61]">
              Join our community of environmental champions and help us create a greener planet for future generations.
            </p>
            <Button className="mt-8 bg-[#e76f51] hover:bg-[#e25b3a] text-white" asChild>
              <Link href="/auth/register">
                Get Started Today
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </CardContent>
        </Card>
      </section>
    </div>
  )
}

const stats = [
  {
    icon: TreePine,
    value: "10K+",
    label: "Trees Planted",
  },
  {
    icon: Heart,
    value: "5K+",
    label: "Active Members",
  },
  {
    icon: Globe,
    value: "20+",
    label: "Countries Reached",
  },
  {
    icon: Users,
    value: "100+",
    label: "Local Communities",
  },
]

const team = [
  {
    name: "Sarah Johnson",
    role: "Founder & Executive Director",
    bio: "Environmental scientist with 15 years of experience in conservation and community engagement.",
    image: "/placeholder.svg?height=400&width=400",
  },
  {
    name: "Michael Chen",
    role: "Head of Operations",
    bio: "Expert in sustainable project management and community organization.",
    image: "/placeholder.svg?height=400&width=400",
  },
  {
    name: "Emma Wilson",
    role: "Education Director",
    bio: "Passionate educator focused on environmental awareness and youth engagement.",
    image: "/placeholder.svg?height=400&width=400",
  },
]

const values = [
  {
    title: "Environmental Stewardship",
    description: "We believe in taking active responsibility for protecting and enhancing our environment.",
  },
  {
    title: "Community Empowerment",
    description: "We empower communities to take charge of their environmental impact and future.",
  },
  {
    title: "Education First",
    description: "We prioritize learning and sharing knowledge about environmental conservation.",
  },
  {
    title: "Sustainable Impact",
    description: "We focus on creating lasting, meaningful change through sustainable practices.",
  },
  {
    title: "Collaboration",
    description: "We believe in the power of working together to achieve greater environmental impact.",
  },
  {
    title: "Innovation",
    description: "We embrace new ideas and technologies to improve our environmental initiatives.",
  },
] 