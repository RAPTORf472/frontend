import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const ensureArray = <T>(data: T[] | null | undefined): T[] => {
  if (!data) return []
  return Array.isArray(data) ? data : []
}

export const isEmptyArray = (arr: any[] | null | undefined): boolean => {
  return !arr || !Array.isArray(arr) || arr.length === 0
} 