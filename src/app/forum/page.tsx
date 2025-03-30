'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/auth-context';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Search,
  Filter,
  MessageSquare,
  ThumbsUp,
  Eye,
  CheckCircle2,
  Clock,
  Plus,
  Leaf,
  Users,
  BookOpen,
  Sparkles,
  TrendingUp,
} from 'lucide-react';
import { Spinner } from '@/components/ui/spinner';
import { Pagination, PaginationContent, PaginationItem, PaginationLink } from '@/components/ui/pagination';
import { motion } from 'framer-motion';

// Animation variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      type: "spring",
      stiffness: 100,
      damping: 15,
    },
  },
};

interface Category {
  id: number;
  name: string;
  description: string;
}

interface Discussion {
  id: number;
  title: string;
  excerpt: string;
  author_name: string;
  category_name: string;
  views_count: number;
  likes_count: number;
  replies_count: number;
  created_at: string;
  has_solution: boolean;
}

interface Contributor {
  id: number;
  username: string;
  likes_count: number;
  avatar?: string;
}

interface PaginationData {
  currentPage: number;
  totalPages: number;
  totalItems: number;
}

export default function ForumPage() {
  const { user } = useAuth();
  const [categories, setCategories] = useState<Category[]>([]);
  const [discussions, setDiscussions] = useState<Discussion[]>([]);
  const [popularDiscussionIds, setPopularDiscussionIds] = useState<Set<number>>(new Set());
  const [topContributors, setTopContributors] = useState<Contributor[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [loadingContributors, setLoadingContributors] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  const [activeTab, setActiveTab] = useState("latest");
  const [categoryPostCounts, setCategoryPostCounts] = useState<Record<number, number>>({});
  const [allDiscussions, setAllDiscussions] = useState<Discussion[]>([]);

  // Check for reduced motion preference
  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    setPrefersReducedMotion(mediaQuery.matches);

    const handleChange = () => setPrefersReducedMotion(mediaQuery.matches);
    mediaQuery.addEventListener("change", handleChange);

    return () => mediaQuery.removeEventListener("change", handleChange);
  }, []);

  // Adjust animations based on preference
  const getAnimationProps = (variants: any) => {
    return prefersReducedMotion ? {} : variants;
  };

  useEffect(() => {
    const fetchDiscussions = async () => {
      setLoading(true);
      try {
        const categoryParam = selectedCategory !== 'all' ? `&category=${selectedCategory}` : '';
        const url = `/api/forum/discussions?page=${currentPage}${categoryParam}`;
        
        const token = localStorage.getItem('token');
        
        const response = await fetch(url, {
          headers: {
            'Authorization': `Bearer ${token || ''}`
          }
        });
        
        if (!response.ok) {
          const errorText = await response.text();
          console.error('Error response:', errorText);
          throw new Error(`Failed to fetch discussions: ${response.status} ${response.statusText}`);
        }
        
        const data = await response.json();
        
        if (!data.discussions) {
          console.warn('No discussions array in response:', data);
          setDiscussions([]);
          setTotalPages(1);
          setTotalItems(0);
          return;
        }
        
        let filteredDiscussions = data.discussions;
        
        // Calculate popular discussions
        const topByComments = [...filteredDiscussions]
          .sort((a, b) => b.replies_count - a.replies_count)
          .slice(0, 3)
          .map(d => d.id);
        
        const topByLikes = [...filteredDiscussions]
          .sort((a, b) => b.likes_count - a.likes_count)
          .slice(0, 3)
          .map(d => d.id);
        
        const topByViews = [...filteredDiscussions]
          .sort((a, b) => b.views_count - a.views_count)
          .slice(0, 3)
          .map(d => d.id);
        
        // Combine and eliminate duplicates using a Set
        const popularIds = new Set([...topByComments, ...topByLikes, ...topByViews]);
        
        // Limit to 3 discussions maximum
        const topPopularIds = new Set(Array.from(popularIds).slice(0, 3));
        
        setPopularDiscussionIds(topPopularIds);
        
        // Apply client-side filtering based on tab
        if (activeTab === "popular") {
          // Only show discussions that have the popular badge
          filteredDiscussions = filteredDiscussions.filter((d: Discussion) => 
            topPopularIds.has(d.id)
          );
        } else if (activeTab === "unanswered") {
          filteredDiscussions = filteredDiscussions.filter((d: Discussion) => d.replies_count === 0);
        }
        
        // Apply search filter if query exists
        if (searchQuery.trim()) {
          const query = searchQuery.toLowerCase();
          filteredDiscussions = filteredDiscussions.filter((d: Discussion) => 
            d.title.toLowerCase().includes(query) || 
            d.excerpt.toLowerCase().includes(query) ||
            d.author_name.toLowerCase().includes(query) ||
            d.category_name.toLowerCase().includes(query)
          );
        }
        
        setDiscussions(filteredDiscussions);
        setTotalPages(data.pagination?.totalPages || 1);
        setTotalItems(data.pagination?.totalItems || 0);
      } catch (error) {
        console.error('Error fetching discussions:', error);
        setDiscussions([]);
        setTotalPages(1);
        setTotalItems(0);
      } finally {
        setLoading(false);
      }
    };

    fetchDiscussions();
  }, [selectedCategory, currentPage, activeTab, searchQuery]);

  useEffect(() => {
    const fetchCategories = async () => {
      setLoadingCategories(true);
      try {
        const token = localStorage.getItem('token');
        const response = await fetch('/api/forum/categories', {
          headers: {
            'Authorization': `Bearer ${token || ''}`
          }
        });
        
        if (!response.ok) {
          const errorText = await response.text();
          console.error('Error fetching categories:', errorText);
          throw new Error(`Failed to fetch categories: ${response.status} ${response.statusText}`);
        }
        
        const data = await response.json();
        
        // Handle different API response structures
        if (Array.isArray(data)) {
          // If data is directly an array of categories
          setCategories(data);
        } else if (data.categories && Array.isArray(data.categories)) {
          // If data has a categories property that is an array
          setCategories(data.categories);
        } else {
          // If we need to transform the data into the expected format
          const transformedCategories: Category[] = [];
          
          // Check if data is an object with category information
          if (typeof data === 'object' && data !== null) {
            // Extract categories from the data object
            Object.keys(data).forEach(key => {
              if (typeof data[key] === 'object' && data[key] !== null) {
                transformedCategories.push({
                  id: transformedCategories.length + 1,
                  name: key,
                  description: typeof data[key].description === 'string' ? data[key].description : ''
                });
              }
            });
          }
          
          if (transformedCategories.length > 0) {
            setCategories(transformedCategories);
          } else {
            console.warn('Could not extract categories from response:', data);
          setCategories([]);
          }
        }
      } catch (error) {
        console.error('Error fetching categories:', error);
        setCategories([]);
      } finally {
        setLoadingCategories(false);
      }
    };

    fetchCategories();
  }, []);

  // Fetch top contributors based on likes received on their replies
  useEffect(() => {
    const fetchTopContributors = async () => {
      setLoadingContributors(true);
      try {
        const token = localStorage.getItem('token');
        const response = await fetch('/api/forum/top-contributors', {
          headers: {
            'Authorization': `Bearer ${token || ''}`
          }
        });
        
        if (!response.ok) {
          const errorText = await response.text();
          console.error('Error fetching top contributors:', errorText);
          throw new Error(`Failed to fetch top contributors: ${response.status} ${response.statusText}`);
        }
        
        const data = await response.json();
        
        if (data.contributors && Array.isArray(data.contributors)) {
          setTopContributors(data.contributors);
        } else if (Array.isArray(data)) {
          setTopContributors(data);
        } else {
          console.warn('Unexpected response format for top contributors:', data);
          setTopContributors([]);
        }
      } catch (error) {
        console.error('Error fetching top contributors:', error);
        setTopContributors([]);
      } finally {
        setLoadingContributors(false);
      }
    };

    fetchTopContributors();
  }, []);

  // Fetch all discussions for category counts without filtering
  useEffect(() => {
    const fetchAllDiscussions = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await fetch('/api/forum/discussions?limit=999', {
          headers: {
            'Authorization': `Bearer ${token || ''}`
          }
        });
        
        if (!response.ok) {
          throw new Error(`Failed to fetch all discussions: ${response.status}`);
        }
        
        const data = await response.json();
        if (data.discussions) {
          setAllDiscussions(data.discussions);
        }
      } catch (error) {
        console.error('Error fetching all discussions for category counts:', error);
      }
    };
    
    fetchAllDiscussions();
  }, []);
  
  // Calculate post counts using all discussions
  useEffect(() => {
    if (allDiscussions.length && categories.length) {
      const counts: Record<number, number> = {};
      
      allDiscussions.forEach(discussion => {
        const category = categories.find(c => c.name === discussion.category_name);
        if (category) {
          counts[category.id] = (counts[category.id] || 0) + 1;
        }
      });
      
      setCategoryPostCounts(counts);
    }
  }, [allDiscussions, categories]);

  // Get top 3 categories by post count
  const getTopCategories = () => {
    return categories
      .map(category => ({
        ...category,
        postCount: categoryPostCounts[category.id] || 0
      }))
      .sort((a, b) => b.postCount - a.postCount)
      .slice(0, 3);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (diffInSeconds < 0) return 'just now';
    if (diffInSeconds < 60) return `${diffInSeconds} second${diffInSeconds === 1 ? '' : 's'} ago`;
    
    const diffInMinutes = Math.floor(diffInSeconds / 60);
    if (diffInMinutes < 60) return `${diffInMinutes} minute${diffInMinutes === 1 ? '' : 's'} ago`;
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours} hour${diffInHours === 1 ? '' : 's'} ago`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays} day${diffInDays === 1 ? '' : 's'} ago`;
    
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  // Helper function to get category icon
  const getCategoryIcon = (categoryName: string) => {
    const name = categoryName.toLowerCase();
    if (name.includes('getting started')) return <BookOpen className="h-4 w-4" />;
    if (name.includes('best practices')) return <CheckCircle2 className="h-4 w-4" />;
    if (name.includes('technical')) return <Search className="h-4 w-4" />;
    if (name.includes('community') || name.includes('project')) return <Users className="h-4 w-4" />;
    if (name.includes('success') || name.includes('stories')) return <ThumbsUp className="h-4 w-4" />;
    if (name.includes('environmental') || name.includes('impact')) return <Leaf className="h-4 w-4" />;
    if (name.includes('urban') || name.includes('gardening')) return <Sparkles className="h-4 w-4" />;
    return <MessageSquare className="h-4 w-4" />;
  };

  return (
    <div className="min-h-screen bg-[#f8f9f3]">
      <div className="relative">
        {/* Background Pattern */}

    <div className="container mx-auto px-4 py-8">
          <div className="flex flex-col lg:flex-row gap-8">
            {/* Left Sidebar */}
            <motion.div
              className="lg:w-64 shrink-0"
              initial={getAnimationProps({ opacity: 0, x: -30 })}
              animate={getAnimationProps({ opacity: 1, x: 0 })}
              transition={{ duration: 0.5 }}
            >
              <div className="sticky top-20">
                <div className="mb-8">
                  <h1 className="text-3xl font-bold text-[#2c5530]">Community Forum</h1>
                  <p className="mt-2 text-[#5a7d61]">Connect, share, and learn with fellow nature enthusiasts</p>
        </div>

                <motion.div
                  whileHover={getAnimationProps({ scale: 1.02 })}
                  whileTap={getAnimationProps({ scale: 0.98 })}
                  className="mb-6"
                >
                  {user ? (
          <Link href="/forum/new">
                      <Button className="w-full bg-[#e76f51] hover:bg-[#e25b3a] text-white border-none shadow-md">
                        <Plus className="mr-2 h-5 w-5" />
              New Discussion
            </Button>
          </Link>
                  ) : (
                    <Link href="/auth/login">
                      <Button className="w-full bg-[#e76f51] hover:bg-[#e25b3a] text-white border-none shadow-md">
                        <Plus className="mr-2 h-5 w-5" />
                        Login to Post
                      </Button>
                    </Link>
                  )}
                </motion.div>

                <div className="mb-4">
                  <h3 className="font-medium text-[#2c5530] mb-2 px-3">Categories</h3>
      </div>
                <nav className="space-y-1">
                  <NavItem 
                    icon={<Leaf className="h-4 w-4" />} 
                    label="All Categories" 
                    active={selectedCategory === 'all'} 
                    onClick={() => setSelectedCategory('all')}
                  />
          {!loadingCategories && categories.map((category) => (
                    <NavItem 
                      key={category.id}
                      icon={getCategoryIcon(category.name)}
                      label={category.name}
                      active={selectedCategory === category.name}
                      onClick={() => setSelectedCategory(category.name)}
                    />
                  ))}
                </nav>

                <div className="mt-8 p-4 bg-[#f0f4e9] rounded-lg border border-[#d1e0d3]">
                  <h3 className="font-medium text-[#2c5530] mb-2">Forum Guidelines</h3>
                  <p className="text-sm text-[#5a7d61]">
                    Be respectful, stay on topic, and share your knowledge to help our community grow together.
                  </p>
                </div>
              </div>
            </motion.div>

            {/* Main Content */}
            <div className="flex-1">
              {/* Search Bar */}
              <motion.div
                className="mb-6"
                initial={getAnimationProps({ opacity: 0, y: -20 })}
                animate={getAnimationProps({ opacity: 1, y: 0 })}
                transition={{ duration: 0.5 }}
              >
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#5a7d61]" />
                  <Input
                    placeholder="Search discussions..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 border-[#d1e0d3] focus-visible:ring-[#2c5530] bg-white rounded-full"
                  />
                  <Button
                    variant="outline"
                    className="absolute right-1 top-1/2 -translate-y-1/2 h-8 rounded-full border-[#d1e0d3] text-[#5a7d61]"
                  >
                    <Filter className="h-4 w-4 mr-1" />
                    Filter
                  </Button>
                </div>
              </motion.div>

              {/* Tabs */}
              <Tabs defaultValue="latest" className="mb-6" onValueChange={setActiveTab}>
                <motion.div
                  initial={getAnimationProps({ opacity: 0, y: 10 })}
                  animate={getAnimationProps({ opacity: 1, y: 0 })}
                  transition={{ delay: 0.2, duration: 0.5 }}
                >
                  <TabsList className="bg-[#e9f0e6] p-1 rounded-full w-full max-w-md mx-auto flex justify-between">
                    <TabsTrigger
                      value="latest"
                      className="rounded-full data-[state=active]:bg-[#2c5530] data-[state=active]:text-white flex-1"
                    >
                      Latest
                    </TabsTrigger>
                    <TabsTrigger
                      value="popular"
                      className="rounded-full data-[state=active]:bg-[#2c5530] data-[state=active]:text-white flex-1"
                    >
                      Popular
                    </TabsTrigger>
                    <TabsTrigger
                      value="unanswered"
                      className="rounded-full data-[state=active]:bg-[#2c5530] data-[state=active]:text-white flex-1"
                    >
                      Unanswered
            </TabsTrigger>
        </TabsList>
                </motion.div>

                <TabsContent value="latest">
          {loading ? (
            <div className="flex justify-center py-8">
              <Spinner className="h-8 w-8" />
            </div>
          ) : (
                    <DiscussionList 
                      discussions={discussions} 
                      getAnimationProps={getAnimationProps} 
                      formatDate={formatDate}
                      popularDiscussionIds={popularDiscussionIds}
                    />
                  )}
                </TabsContent>

                <TabsContent value="popular">
                  {loading ? (
                    <div className="flex justify-center py-8">
                      <Spinner className="h-8 w-8" />
                    </div>
                  ) : (
                    <DiscussionList 
                      discussions={discussions} 
                      getAnimationProps={getAnimationProps} 
                      formatDate={formatDate}
                      popularDiscussionIds={popularDiscussionIds}
                    />
                  )}
                </TabsContent>

                <TabsContent value="unanswered">
                  {loading ? (
                    <div className="flex justify-center py-8">
                      <Spinner className="h-8 w-8" />
                    </div>
                  ) : (
                    <DiscussionList 
                      discussions={discussions} 
                      getAnimationProps={getAnimationProps} 
                      formatDate={formatDate}
                      popularDiscussionIds={popularDiscussionIds}
                    />
                  )}
                </TabsContent>
              </Tabs>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="mt-6 flex justify-center">
                <Pagination>
                  <PaginationContent>
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                      <PaginationItem key={page}>
                        <PaginationLink
                          onClick={() => setCurrentPage(page)}
                          isActive={currentPage === page}
                            className={currentPage === page ? "bg-[#2c5530] text-white" : ""}
                        >
                          {page}
                        </PaginationLink>
                      </PaginationItem>
                    ))}
                  </PaginationContent>
                </Pagination>
                </div>
              )}

              {/* Featured Discussion */}
              {discussions.length > 0 && (
                <motion.div
                  initial={getAnimationProps({ opacity: 0, y: 30 })}
                  animate={getAnimationProps({ opacity: 1, y: 0 })}
                  transition={{ delay: 0.4, duration: 0.6 }}
                  className="mt-8 mb-8"
                >
                  <div className="relative overflow-hidden rounded-xl bg-gradient-to-r from-[#2c5530] to-[#3a6b3e] p-6 text-white shadow-lg">
                    <div className="absolute right-0 top-0 h-full w-1/3 bg-[url('/placeholder.svg?height=200&width=200')] bg-cover opacity-10"></div>
                    <div className="relative z-10">
                      <Badge className="bg-[#e76f51] hover:bg-[#e25b3a] mb-2">Featured Discussion</Badge>
                      <h3 className="text-xl font-bold mb-2">Join Our Community Challenge</h3>
                      <p className="mb-4 text-[#d1e0d3]">
                        Participate in our monthly environmental challenge and share your progress with the community!
                      </p>
                      <div className="flex items-center gap-4">
                        <Button variant="secondary" className="bg-white/20 hover:bg-white/30 text-white">
                          Learn More
                        </Button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </div>

            {/* Right Sidebar */}
            <motion.div
              className="lg:w-72 shrink-0"
              initial={getAnimationProps({ opacity: 0, x: 30 })}
              animate={getAnimationProps({ opacity: 1, x: 0 })}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <div className="sticky top-20 space-y-6">
                {/* Top Contributors */}
                <Card className="border-[#d1e0d3] overflow-hidden bg-white">
                  <CardHeader className="bg-[#f0f4e9] border-b border-[#d1e0d3] pb-3">
                    <CardTitle className="text-[#2c5530] text-lg">Top Contributors</CardTitle>
                  </CardHeader>
                  <CardContent className="p-4">
                    {loadingContributors ? (
                      <div className="flex justify-center py-4">
                        <Spinner className="h-6 w-6" />
              </div>
            ) : (
              <>
                        <div className="space-y-4">
                          {topContributors.length > 0 ? (
                            topContributors.slice(0, 3).map((contributor, index) => (
                              <motion.div
                                key={contributor.id}
                                className="flex items-center gap-3"
                                whileHover={getAnimationProps({ x: 5 })}
                              >
                                <div className="relative">
                                  <Avatar className="border-2 border-[#d1e0d3]">
                                    <AvatarImage src={contributor.avatar || `/placeholder.svg?height=40&width=40`} />
                                    <AvatarFallback className="bg-[#e9f0e6] text-[#2c5530]">
                                      {contributor.username ? contributor.username[0].toUpperCase() : '?'}
                                    </AvatarFallback>
                                  </Avatar>
                                  <div className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-[#e76f51] text-[10px] font-bold text-white">
                                    {index + 1}
                                  </div>
                                </div>
                                <div className="flex-1">
                                  <div className="font-medium text-[#2c5530]">{contributor.username}</div>
                                  <div className="text-sm text-[#5a7d61]">{contributor.likes_count} likes</div>
                                </div>
                              </motion.div>
                            ))
                          ) : (
                            <div className="text-center py-2 text-[#5a7d61]">
                              No contributors found
                            </div>
                          )}
                        </div>
                      </>
                    )}
                  </CardContent>
                </Card>

                {/* Categories */}
                <Card className="border-[#d1e0d3] overflow-hidden bg-white">
                  <CardHeader className="bg-[#f0f4e9] border-b border-[#d1e0d3] pb-3">
                    <CardTitle className="text-[#2c5530] text-lg">Popular Categories</CardTitle>
                  </CardHeader>
                  <CardContent className="p-0">
                    <div>
                      {!loadingCategories && getTopCategories().map((category, index) => (
                        <motion.div
                          key={index}
                          whileHover={getAnimationProps({ backgroundColor: "rgba(209, 224, 211, 0.3)" })}
                          className="flex items-center justify-between px-4 py-3 hover:bg-[#f0f4e9] transition-colors cursor-pointer border-b border-[#d1e0d3] last:border-b-0"
                          onClick={() => setSelectedCategory(category.name)}
                        >
                          <span className="font-medium text-[#2c5530]">{category.name}</span>
                          <Badge variant="secondary" className="bg-[#e9f0e6] text-[#2c5530] hover:bg-[#d1e0d3]">
                            {category.postCount}
                          </Badge>
                        </motion.div>
                      ))}
                      {loadingCategories && (
                        <div className="flex justify-center py-8">
                          <Spinner className="h-6 w-6" />
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}

function NavItem({ 
  icon, 
  label, 
  active = false,
  onClick
}: { 
  icon: React.ReactNode; 
  label: string; 
  active?: boolean;
  onClick?: () => void;
}) {
  return (
    <div
      onClick={onClick}
      className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer ${
        active ? "bg-[#2c5530] text-white" : "text-[#5a7d61] hover:bg-[#e9f0e6] hover:text-[#2c5530]"
      }`}
    >
      {icon}
      {label}
    </div>
  );
}

function DiscussionList({ 
  discussions, 
  getAnimationProps,
  formatDate,
  popularDiscussionIds
}: { 
  discussions: Discussion[];
  getAnimationProps: Function;
  formatDate: (date: string) => string;
  popularDiscussionIds: Set<number>;
}) {
  return (
    <motion.div className="space-y-4" variants={containerVariants} initial="hidden" animate="visible">
      {discussions.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-[#5a7d61]">No discussions found</p>
        </div>
      ) : (
        discussions.map((discussion, index) => (
          <motion.div key={discussion.id} variants={itemVariants} whileHover={getAnimationProps({ y: -3 })}>
            <DiscussionCard discussion={discussion} formatDate={formatDate} popularDiscussionIds={popularDiscussionIds} />
          </motion.div>
        ))
      )}
    </motion.div>
  );
}

function DiscussionCard({ 
  discussion, 
  formatDate, 
  popularDiscussionIds 
}: { 
  discussion: Discussion; 
  formatDate: (date: string) => string;
  popularDiscussionIds: Set<number>;
}): JSX.Element {
  return (
    <Link href={`/forum/discussions/${discussion.id}`}>
      <Card className="border-[#d1e0d3] hover:border-[#5a7d61] transition-all duration-300 hover:shadow-md overflow-hidden bg-white group">
        <CardContent className="p-0">
          <div className="p-5">
            <div className="flex items-center gap-2 flex-wrap mb-2">
              <h3 className="font-semibold text-[#2c5530] group-hover:text-[#3a6b3e] transition-colors duration-300 text-lg">
                {discussion.title}
              </h3>
              <Badge
                variant="secondary"
                className="bg-[#e9f0e6] text-[#2c5530] group-hover:bg-[#d1e0d3] transition-colors duration-300"
              >
                {discussion.category_name}
              </Badge>
              {popularDiscussionIds.has(discussion.id) && (
                <Badge
                  variant="secondary"
                  className="bg-[#f59e0b]/10 text-[#f59e0b] group-hover:bg-[#f59e0b]/20 transition-colors duration-300"
                >
                  <TrendingUp className="mr-1 h-3 w-3" />
                  Popular
                </Badge>
              )}
              {discussion.has_solution && (
                <Badge
                  variant="secondary"
                  className="bg-[#e76f51]/10 text-[#e76f51] group-hover:bg-[#e76f51]/20 transition-colors duration-300"
                >
                  <CheckCircle2 className="mr-1 h-3 w-3" />
                  Solved
                </Badge>
              )}
            </div>
            <p className="text-[#5a7d61] line-clamp-2 mb-4">{discussion.excerpt}</p>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Avatar className="h-8 w-8 border-2 border-[#d1e0d3]">
                  <AvatarFallback className="bg-[#e9f0e6] text-[#2c5530]">{discussion.author_name[0]}</AvatarFallback>
                </Avatar>
                <div>
                  <span className="text-sm font-medium text-[#2c5530]">{discussion.author_name}</span>
                  <div className="flex items-center text-xs text-[#5a7d61]">
                    <Clock className="mr-1 h-3 w-3" />
                    {formatDate(discussion.created_at)}
                  </div>
                        </div>
                      </div>

              <div className="flex items-center gap-3 text-sm text-[#5a7d61]">
                        <div className="flex items-center gap-1">
                  <MessageSquare className="h-4 w-4" />
                  <span>{discussion.replies_count}</span>
                        </div>
                <div className="flex items-center gap-1 transition-all duration-300 group-hover:text-[#e76f51]">
                          <ThumbsUp className="h-4 w-4" />
                          <span>{discussion.likes_count}</span>
                        </div>
                        <div className="flex items-center gap-1">
                  <Eye className="h-4 w-4" />
                  <span>{discussion.views_count}</span>
                </div>
                        </div>
                      </div>
                    </div>
        </CardContent>
                  </Card>
    </Link>
  );
} 