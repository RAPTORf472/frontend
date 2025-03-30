"use client"

import { Tag } from "lucide-react"
import { useArrayData } from "@/hooks/use-array-data"
import { EmptyState } from "@/components/ui/empty-state"
import { Spinner } from "@/components/ui/spinner"
import { useEffect } from "react"

interface Category {
  id: number
  name: string
  description: string | null
  event_count: number
  created_at: string
}

export default function AdminCategoriesPage() {
  const {
    data: categories,
    isEmpty: isCategoriesEmpty,
    isLoading: isCategoriesLoading,
    setData: setCategories,
    setIsLoading: setCategoriesLoading
  } = useArrayData<Category>({
    emptyMessage: 'No categories found.'
  })

  useEffect(() => {
    fetchCategories()
  }, [])

  const fetchCategories = async () => {
    setCategoriesLoading(true)
    try {
      const response = await fetch('/api/admin/categories', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      })
      const data = await response.json()
      setCategories(data.categories)
    } catch (error) {
      console.error('Error fetching categories:', error)
    } finally {
      setCategoriesLoading(false)
    }
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Category Management</h1>

      {isCategoriesLoading ? (
        <div className="flex justify-center py-8">
          <Spinner size="lg" />
        </div>
      ) : isCategoriesEmpty ? (
        <EmptyState 
          message="No categories found."
          icon={<Tag className="h-8 w-8 text-gray-400" />}
        />
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-gray-50">
                <th className="px-4 py-2 text-left">Name</th>
                <th className="px-4 py-2 text-left">Description</th>
                <th className="px-4 py-2 text-left">Event Count</th>
                <th className="px-4 py-2 text-left">Created At</th>
              </tr>
            </thead>
            <tbody>
              {categories.map((category) => (
                <tr key={category.id} className="border-t">
                  <td className="px-4 py-2">{category.name}</td>
                  <td className="px-4 py-2">{category.description || 'No description'}</td>
                  <td className="px-4 py-2">{category.event_count}</td>
                  <td className="px-4 py-2">
                    {new Date(category.created_at).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
} 