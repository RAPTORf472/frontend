import { useState } from 'react'
import { ensureArray, isEmptyArray } from '@/lib/utils'

interface UseArrayDataProps<T> {
  initialData?: T[] | null
  loadingMessage?: string
  emptyMessage?: string
}

interface UseArrayDataReturn<T> {
  data: T[]
  isEmpty: boolean
  isLoading: boolean
  setData: (data: T[] | null | undefined | ((prevData: T[]) => T[])) => void
  setIsLoading: (loading: boolean) => void
  loadingMessage: string
  emptyMessage: string
}

export const useArrayData = <T>({
  initialData = null,
  loadingMessage = 'Loading...',
  emptyMessage = 'No items found.'
}: UseArrayDataProps<T> = {}): UseArrayDataReturn<T> => {
  const [data, setData] = useState<T[]>(ensureArray(initialData))
  const [isLoading, setIsLoading] = useState(false)

  return {
    data,
    isEmpty: isEmptyArray(data),
    isLoading,
    setData: (newData) => {
      if (typeof newData === 'function') {
        setData(newData as (prevData: T[]) => T[])
      } else {
        setData(ensureArray(newData))
      }
    },
    setIsLoading,
    loadingMessage,
    emptyMessage
  }
} 