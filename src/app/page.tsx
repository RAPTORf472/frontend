import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Leaf, TreePine, Globe, Sprout } from "lucide-react"
import Link from "next/link"

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-[#f0f4e9] to-white">
      {/* Hero Section */}
      <section className="container mx-auto px-4 py-24">
        <div className="grid gap-8 lg:grid-cols-2 lg:gap-12">
          <div className="flex flex-col justify-center space-y-4">
            <h1 className="text-4xl font-bold tracking-tighter text-[#2c5530] sm:text-5xl xl:text-6xl/none">
              Plant a Tree,
              <br />
              Grow a Future
            </h1>
            <p className="max-w-[600px] text-[#5a7d61] md:text-xl">
              Join Green Buddy in our mission to make Earth greener, one tree at a time. Together, we can create a
              sustainable future for generations to come.
            </p>
            <div className="flex flex-col gap-2 min-[400px]:flex-row">
              <Button size="lg" className="bg-[#e76f51] hover:bg-[#e25b3a] text-white" asChild>
                <Link href="/auth/register">
                  Start Planting
                </Link>
              </Button>
              <Button size="lg" variant="outline" className="border-[#2c5530] text-[#2c5530] hover:bg-[#f0f4e9]" asChild>
                <Link href="/about">
                  Learn More
                </Link>
              </Button>
            </div>
          </div>
          <div className="relative hidden lg:block">
            <div className="absolute inset-0 bg-[#d1e0d3] rounded-full blur-3xl opacity-20" />
            <img
              alt="Forest trees with sunlight"
              className="relative mx-auto object-cover rounded-lg shadow-lg"
              height="400"
              src="https://images.unsplash.com/photo-1425913397330-cf8af2ff40a1?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80"
              width="400"
            />
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="container mx-auto px-4 py-12">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card className="border-2 border-[#d1e0d3] bg-white/50 backdrop-blur-sm">
            <CardContent className="flex flex-col items-center p-6">
              <TreePine className="h-12 w-12 text-[#2c5530]" />
              <h3 className="mt-4 text-3xl font-bold text-[#2c5530]">10K+</h3>
              <p className="text-center text-[#5a7d61]">Trees Planted</p>
            </CardContent>
          </Card>
          <Card className="border-2 border-[#d1e0d3] bg-white/50 backdrop-blur-sm">
            <CardContent className="flex flex-col items-center p-6">
              <Leaf className="h-12 w-12 text-[#2c5530]" />
              <h3 className="mt-4 text-3xl font-bold text-[#2c5530]">5K+</h3>
              <p className="text-center text-[#5a7d61]">Active Members</p>
            </CardContent>
          </Card>
          <Card className="border-2 border-[#d1e0d3] bg-white/50 backdrop-blur-sm">
            <CardContent className="flex flex-col items-center p-6">
              <Globe className="h-12 w-12 text-[#2c5530]" />
              <h3 className="mt-4 text-3xl font-bold text-[#2c5530]">20+</h3>
              <p className="text-center text-[#5a7d61]">Countries Reached</p>
            </CardContent>
          </Card>
          <Card className="border-2 border-[#d1e0d3] bg-white/50 backdrop-blur-sm">
            <CardContent className="flex flex-col items-center p-6">
              <Sprout className="h-12 w-12 text-[#2c5530]" />
              <h3 className="mt-4 text-3xl font-bold text-[#2c5530]">100+</h3>
              <p className="text-center text-[#5a7d61]">Local Communities</p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Features Section */}
      <section className="container mx-auto px-4 py-24">
        <h2 className="mb-12 text-center text-3xl font-bold text-[#2c5530] sm:text-4xl">Why Plant With Green Buddy?</h2>
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          {features.map((feature, index) => (
            <Card key={index} className="border-2 border-[#d1e0d3] bg-white/50 backdrop-blur-sm">
              <CardContent className="p-6">
                <feature.icon className="h-12 w-12 text-[#2c5530]" />
                <h3 className="mt-4 text-xl font-semibold text-[#2c5530]">{feature.title}</h3>
                <p className="mt-2 text-[#5a7d61]">{feature.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Progress Section */}
      <section className="container mx-auto px-4 py-24">
        <div className="rounded-2xl bg-[#f0f4e9] p-8 border border-[#d1e0d3]">
          <h2 className="mb-8 text-center text-3xl font-bold text-[#2c5530]">Our Impact This Year</h2>
          <div className="space-y-6">
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="font-medium text-[#2c5530]">Trees Planted</span>
                <span className="font-medium text-[#2c5530]">75%</span>
              </div>
              <Progress value={75} className="h-3 [&>div]:bg-[#e76f51] bg-[#d1e0d3]" />
            </div>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="font-medium text-[#2c5530]">Carbon Offset</span>
                <span className="font-medium text-[#2c5530]">60%</span>
              </div>
              <Progress value={60} className="h-3 [&>div]:bg-[#e76f51] bg-[#d1e0d3]" />
            </div>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="font-medium text-[#2c5530]">Community Engagement</span>
                <span className="font-medium text-[#2c5530]">90%</span>
              </div>
              <Progress value={90} className="h-3 [&>div]:bg-[#e76f51] bg-[#d1e0d3]" />
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-4 py-24">
        <div className="rounded-2xl bg-gradient-to-r from-[#2c5530] to-[#3a6b3e] p-12 text-center text-white">
          <h2 className="text-3xl font-bold sm:text-4xl">Ready to Make a Difference?</h2>
          <p className="mx-auto mt-4 max-w-xl text-[#d1e0d3]">
            Join our community of environmental champions and help us create a greener planet for future generations.
          </p>
          <Button size="lg" variant="secondary" className="mt-8 bg-[#e76f51] hover:bg-[#e25b3a] text-white" asChild>
            <Link href="/auth/register">
              Join Green Buddy Today
            </Link>
          </Button>
        </div>
      </section>
    </div>
  )
}

const features = [
  {
    icon: TreePine,
    title: "Easy Tree Planting",
    description: "Simple process to contribute to global reforestation efforts with just a few clicks.",
  },
  {
    icon: Leaf,
    title: "Track Your Impact",
    description: "Monitor your environmental contribution and watch your forest grow over time.",
  },
  {
    icon: Globe,
    title: "Global Community",
    description: "Connect with eco-conscious individuals from around the world.",
  },
]

