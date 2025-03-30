"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  Search,
  Filter,
  Users,
  TreePine,
  MapPin,
  Plus,
  TrendingUp,
  Leaf,
  Sprout,
  Flower2,
  Droplets,
  Star,
} from "lucide-react"
import Link from "next/link"
import { useAuth } from "@/contexts/auth-context"
import { Spinner } from "@/components/ui/spinner"
import { useMediaQuery } from "@/hooks/use-media-query"
import { cn } from "@/lib/utils"

interface Group {
  id: number
  name: string
  description: string
  creator_name: string
  member_count: number
  image_url: string
  created_at: string
  location?: string // Some of these are optional as they might not be in the API
}

interface GroupsResponse {
  groups: Group[]
  page: number
  total: number
  total_pages: number
}

export default function GroupsPage() {
  const { user } = useAuth()
  const [groupsData, setGroupsData] = useState<GroupsResponse>({
    groups: [],
    page: 1,
    total: 0,
    total_pages: 0
  })
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [activeCategory, setActiveCategory] = useState("all")
  const isDesktop = useMediaQuery("(min-width: 1024px)")
  const [userGroup, setUserGroup] = useState<Group | null>(null)

  const fetchGroups = async () => {
    try {
      setIsLoading(true)
      const response = await fetch('/api/groups')
      if (response.ok) {
        const data = await response.json()
        setGroupsData(data)
      }
    } catch (error) {
      console.error('Error fetching groups:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const fetchUserMembership = async () => {
    if (!user) return
    
    try {
      const token = localStorage.getItem('token')
      const headers = {
        'Authorization': token ? `Bearer ${token}` : ''
      }
      
      const response = await fetch('/api/groups/memberships', { headers })
      if (response.ok) {
        const data = await response.json()
        if (data.length > 0) {
          setUserGroup(data[0]) // Set the first group as user's group (users can only be in one group)
        }
      }
    } catch (error) {
      console.error('Error fetching user memberships:', error)
    }
  }

  useEffect(() => {
    fetchGroups()
    fetchUserMembership()
  }, [user])

  const filteredGroups = groupsData.groups.filter(group =>
    group.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    group.description.toLowerCase().includes(searchQuery.toLowerCase())
  )

  // Split groups into featured and regular groups
  // For this implementation, we'll consider the first 3 groups as featured
  const featuredGroups = filteredGroups.slice(0, 3).map(group => ({
    ...group,
    location: group.location || "Global",
    tags: ["Community", "Environment"], // Example tags
    treesPlanted: Math.floor(Math.random() * 1000) // Example data
  }))
  
  const regularGroups = filteredGroups.slice(3)

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  }

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 },
  }

  const getCategoryIcon = (category: string) => {
    switch (category.toLowerCase()) {
      case "tree planting":
        return <TreePine className="h-4 w-4" />
      case "conservation":
        return <Leaf className="h-4 w-4" />
      case "education":
        return <Sprout className="h-4 w-4" />
      case "community":
        return <Users className="h-4 w-4" />
      case "garden":
        return <Flower2 className="h-4 w-4" />
      default:
        return <Leaf className="h-4 w-4" />
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Spinner size="lg" className="text-green-600" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#f8f9f3]">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-[#2c5530] to-[#1a3a1f] py-16">
        <div className="container px-4">
          <div className="mx-auto max-w-3xl text-center">
            <motion.h1
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="text-4xl font-bold tracking-tight text-white sm:text-5xl"
            >
              Environmental Groups
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="mt-4 text-[#c1e1c1]"
            >
              Join or create groups of like-minded individuals passionate about environmental conservation
            </motion.p>
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              {user && !userGroup && (
                <Link href="/groups/create">
                  <Button className="mt-8 bg-[#e76f51] text-white hover:bg-[#e76f51]/90">
                    <Plus className="mr-2 h-5 w-5" />
                    Create New Group
                  </Button>
                </Link>
              )}
              {user && userGroup && (
                <div className="mt-8 flex flex-col items-center">
                  <p className="text-white mb-2">You are a member of:</p>
                  <Link href={`/groups/${userGroup.id}`}>
                    <Button className="bg-[#c1e1c1] text-[#2c5530] hover:bg-[#c1e1c1]/90">
                      <Users className="mr-2 h-5 w-5" />
                      {userGroup.name}
                    </Button>
                  </Link>
                </div>
              )}
            </motion.div>
          </div>
        </div>
        <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-b from-transparent to-[#f8f9f3]" />
      </section>

      {/* Main Content */}
      <section className="container px-4 py-8">
        <div className="grid gap-8 lg:grid-cols-[240px_1fr]">
          {/* Sidebar */}
          {isDesktop && (
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
              className="space-y-6"
            >
              <div className="rounded-xl bg-white p-5 shadow-sm">
                <h3 className="mb-4 font-semibold text-[#2c5530]">Categories</h3>
                <div className="space-y-2">
                  {["all", "tree planting", "conservation", "education", "community", "garden"].map((category) => (
                    <Button
                      key={category}
                      variant="ghost"
                      className={cn(
                        "w-full justify-start font-normal capitalize",
                        activeCategory === category
                          ? "bg-[#e8f2e8] text-[#2c5530]"
                          : "text-gray-600 hover:bg-[#e8f2e8] hover:text-[#2c5530]",
                      )}
                      onClick={() => setActiveCategory(category)}
                    >
                      {getCategoryIcon(category)}
                      <span className="ml-2">{category === "all" ? "All Groups" : category}</span>
                    </Button>
                  ))}
                </div>
              </div>

              <div className="rounded-xl bg-white p-5 shadow-sm">
                <h3 className="mb-4 font-semibold text-[#2c5530]">Quick Stats</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Total Groups</span>
                    <Badge className="bg-[#2c5530]">{groupsData.total}</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Your Groups</span>
                    <Badge className="bg-[#2c5530]">{userGroup ? 1 : 0}</Badge>
                  </div>
                </div>
              </div>

            </motion.div>
          )}

          {/* Main Content */}
          <div className="space-y-6">
            {/* Search and Filter */}
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="sticky top-16 z-10 rounded-xl bg-white p-4 shadow-sm"
            >
              <div className="flex flex-wrap items-center gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                  <Input
                    placeholder="Search groups..."
                    className="border-[#e8f2e8] pl-10 focus-visible:ring-[#2c5530]"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                <div className="flex items-center gap-4">
                  {!isDesktop && (
                    <Select>
                      <SelectTrigger className="w-[160px] border-[#e8f2e8] focus:ring-[#2c5530]">
                        <SelectValue placeholder="Category" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Categories</SelectItem>
                        <SelectItem value="tree-planting">Tree Planting</SelectItem>
                        <SelectItem value="conservation">Conservation</SelectItem>
                        <SelectItem value="education">Education</SelectItem>
                        <SelectItem value="community">Community</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                  <Select>
                    <SelectTrigger className="w-[160px] border-[#e8f2e8] focus:ring-[#2c5530]">
                      <SelectValue placeholder="Sort by" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="newest">Newest First</SelectItem>
                      <SelectItem value="members">Most Members</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </motion.div>

            {/* My Group Section */}
            {userGroup && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="space-y-4"
              >
                <div className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-[#2c5530]" />
                  <h2 className="text-xl font-semibold text-[#2c5530]">My Group</h2>
                </div>

                <Link href={`/groups/${userGroup.id}`}>
                  <Card className="group relative cursor-pointer border-2 border-[#2c5530]/20 transition-all hover:border-[#2c5530] hover:shadow-md">
                    <Badge className="absolute top-2 right-2 z-10 bg-[#2c5530] text-white">
                      <Users className="mr-1 h-3 w-3" /> Member
                    </Badge>
                    <CardContent className="p-6">
                      <div className="mb-4 flex items-center gap-4">
                        <Avatar className="h-16 w-16 border-2 border-[#e8f2e8]">
                          <AvatarImage src={userGroup.image_url || "/placeholder.svg"} alt={userGroup.name} />
                          <AvatarFallback className="bg-[#2c5530] text-white">{userGroup.name[0]}</AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold group-hover:text-[#2c5530]">{userGroup.name}</h3>
                          </div>
                          <div className="mt-1 flex items-center gap-2 text-sm text-gray-500">
                            <MapPin className="h-4 w-4 text-[#2c5530]" />
                            <span>{userGroup.location || "Global"}</span>
                          </div>
                        </div>
                      </div>
                      <p className="mb-4 text-gray-600">{userGroup.description}</p>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-sm text-gray-500">
                          <Users className="h-4 w-4 text-[#2c5530]" />
                          <span>{userGroup.member_count} members</span>
                        </div>
                        <Button className="bg-[#2c5530] hover:bg-[#2c5530]/90">
                          Go to Group
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              </motion.div>
            )}

            {/* Featured Groups */}
            {featuredGroups.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="space-y-4"
              >
                <div className="flex items-center gap-2">
                  <Star className="h-5 w-5 text-[#e76f51]" />
                  <h2 className="text-xl font-semibold text-[#2c5530]">Featured Groups</h2>
                </div>

                <motion.div
                  variants={container}
                  initial="hidden"
                  animate="show"
                  className="grid gap-6 md:grid-cols-2 lg:grid-cols-3"
                >
                  {featuredGroups.map((group, index) => (
                    <motion.div key={index} variants={item} whileHover={{ y: -5 }} transition={{ duration: 0.2 }}>
                      <Link href={`/groups/${group.id}`}>
                        <Card className="group relative h-full cursor-pointer border-2 border-[#e76f51]/20 transition-all hover:border-[#e76f51] hover:shadow-md">
                          <Badge className="absolute top-2 right-2 z-10 bg-[#e76f51] text-white">
                            <Star className="mr-1 h-3 w-3" /> Featured
                          </Badge>
                          {userGroup && userGroup.id === group.id && (
                            <Badge className="absolute top-2 right-2 z-10 bg-[#2c5530] text-white">
                              <Users className="mr-1 h-3 w-3" /> My Group
                            </Badge>
                          )}
                          <CardContent className="p-6">
                            <div className="mb-4 flex items-center gap-4">
                              <Avatar className="h-16 w-16 border-2 border-[#e8f2e8]">
                                <AvatarImage src={group.image_url || "/placeholder.svg"} alt={group.name} />
                                <AvatarFallback className="bg-[#2c5530] text-white">{group.name[0]}</AvatarFallback>
                              </Avatar>
                              <div>
                                <div className="flex items-center gap-2">
                                  <h3 className="font-semibold group-hover:text-[#2c5530]">{group.name}</h3>
                                </div>
                                <div className="mt-1 flex items-center gap-2 text-sm text-gray-500">
                                  <MapPin className="h-4 w-4 text-[#2c5530]" />
                                  <span>{group.location}</span>
                                </div>
                              </div>
                            </div>
                            <p className="mb-4 text-gray-600">{group.description}</p>
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2 text-sm text-gray-500">
                                <Users className="h-4 w-4 text-[#2c5530]" />
                                <span>{group.member_count} members</span>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      </Link>
                    </motion.div>
                  ))}
                </motion.div>
              </motion.div>
            )}

            {/* All Groups */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-[#2c5530]">All Groups</h2>
              </div>

              <Tabs defaultValue="grid" className="w-full">
                <TabsList className="bg-[#e8f2e8]">
                  <TabsTrigger value="grid" className="data-[state=active]:bg-white">
                    Grid
                  </TabsTrigger>
                  <TabsTrigger value="list" className="data-[state=active]:bg-white">
                    List
                  </TabsTrigger>
                </TabsList>

                {/* Grid View */}
                <TabsContent value="grid" className="mt-6">
                  {filteredGroups.length > 0 ? (
                    <motion.div
                      variants={container}
                      initial="hidden"
                      animate="show"
                      className="grid gap-6 md:grid-cols-2 lg:grid-cols-3"
                    >
                      {filteredGroups.map((group, index) => (
                        <motion.div key={index} variants={item}>
                          <Link href={`/groups/${group.id}`}>
                            <Card className="group relative h-full cursor-pointer transition-all hover:border-[#2c5530] hover:shadow-md">
                              {index < 3 && (
                                <Badge className="absolute top-2 right-2 z-10 bg-[#e76f51] text-white">
                                  <Star className="mr-1 h-3 w-3" /> Featured
                                </Badge>
                              )}
                              {userGroup && userGroup.id === group.id && (
                                <Badge className="absolute top-2 right-2 z-10 bg-[#2c5530] text-white">
                                  <Users className="mr-1 h-3 w-3" /> My Group
                                </Badge>
                              )}
                              <CardContent className="p-6">
                                <div className="mb-4 flex items-center gap-4">
                                  <Avatar className="h-12 w-12">
                                    <AvatarImage src={group.image_url || "/placeholder.svg"} alt={group.name} />
                                    <AvatarFallback className="bg-[#2c5530] text-white">{group.name[0]}</AvatarFallback>
                                  </Avatar>
                                  <div>
                                    <div className="flex items-center gap-2">
                                      <h3 className="font-semibold group-hover:text-[#2c5530]">{group.name}</h3>
                                    </div>
                                    <div className="mt-1 flex items-center gap-2 text-sm text-gray-500">
                                      <MapPin className="h-4 w-4 text-[#2c5530]" />
                                      <span>{group.location || "Global"}</span>
                                    </div>
                                  </div>
                                </div>
                                <p className="mb-4 text-gray-600">{group.description}</p>
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-2 text-sm text-gray-500">
                                    <Users className="h-4 w-4 text-[#2c5530]" />
                                    <span>{group.member_count} members</span>
                                  </div>
                                </div>
                              </CardContent>
                            </Card>
                          </Link>
                        </motion.div>
                      ))}
                    </motion.div>
                  ) : (
                    <div className="flex h-40 flex-col items-center justify-center rounded-lg border border-dashed border-gray-300 bg-white p-8 text-center">
                      <Leaf className="mb-2 h-10 w-10 text-gray-400" />
                      <h3 className="text-lg font-medium text-gray-900">No groups found</h3>
                      <p className="mt-1 text-sm text-gray-500">
                        Try adjusting your search or filter to find what you're looking for.
                      </p>
                    </div>
                  )}
                </TabsContent>

                {/* List View */}
                <TabsContent value="list" className="mt-6">
                  {filteredGroups.length > 0 ? (
                    <motion.div variants={container} initial="hidden" animate="show" className="space-y-4">
                      {filteredGroups.map((group, index) => (
                        <motion.div key={index} variants={item}>
                          <Link href={`/groups/${group.id}`}>
                            <Card className="group relative overflow-hidden transition-all hover:border-[#2c5530] hover:shadow-md">
                              {index < 3 && (
                                <Badge className="absolute top-2 right-2 z-10 bg-[#e76f51] text-white">
                                  <Star className="mr-1 h-3 w-3" /> Featured
                                </Badge>
                              )}
                              {userGroup && userGroup.id === group.id && (
                                <Badge className="absolute top-2 right-2 z-10 bg-[#2c5530] text-white">
                                  <Users className="mr-1 h-3 w-3" /> My Group
                                </Badge>
                              )}
                              <div className="flex flex-col p-4 sm:flex-row sm:items-center">
                                <Avatar className="h-16 w-16 sm:mr-4">
                                  <AvatarImage src={group.image_url || "/placeholder.svg"} alt={group.name} />
                                  <AvatarFallback className="bg-[#2c5530] text-white">{group.name[0]}</AvatarFallback>
                                </Avatar>
                                <div className="mt-4 flex-1 sm:mt-0">
                                  <div className="flex flex-wrap items-center justify-between gap-2">
                                    <div className="flex items-center gap-2">
                                      <h3 className="font-semibold group-hover:text-[#2c5530]">{group.name}</h3>
                                    </div>
                                  </div>
                                  <div className="mt-1 flex items-center gap-2 text-sm text-gray-500">
                                    <MapPin className="h-4 w-4 text-[#2c5530]" />
                                    <span>{group.location || "Global"}</span>
                                  </div>
                                  <p className="mt-2 text-sm text-gray-600">{group.description}</p>
                                  <div className="mt-3 flex items-center gap-4">
                                    <div className="flex items-center gap-2 text-sm text-gray-500">
                                      <Users className="h-4 w-4 text-[#2c5530]" />
                                      <span>{group.member_count} members</span>
                                    </div>
                                    <Button size="sm" className="ml-auto bg-[#2c5530] hover:bg-[#2c5530]/90">
                                      View Group
                                    </Button>
                                  </div>
                                </div>
                              </div>
                            </Card>
                          </Link>
                        </motion.div>
                      ))}
                    </motion.div>
                  ) : (
                    <div className="flex h-40 flex-col items-center justify-center rounded-lg border border-dashed border-gray-300 bg-white p-8 text-center">
                      <Leaf className="mb-2 h-10 w-10 text-gray-400" />
                      <h3 className="text-lg font-medium text-gray-900">No groups found</h3>
                      <p className="mt-1 text-sm text-gray-500">
                        Try adjusting your search or filter to find what you're looking for.
                      </p>
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
} 