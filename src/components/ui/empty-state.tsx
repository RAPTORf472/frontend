import { InboxIcon } from 'lucide-react'

interface EmptyStateProps {
  message?: string
  icon?: React.ReactNode
  className?: string
}

export const EmptyState = ({
  message = 'No items found.',
  icon = <InboxIcon className="h-8 w-8 text-gray-400" />,
  className = ''
}: EmptyStateProps) => {
  return (
    <div className={`flex flex-col items-center justify-center space-y-3 rounded-lg border border-dashed border-gray-200 bg-gray-50 px-4 py-8 text-center ${className}`}>
      {icon}
      <p className="text-sm text-gray-500">{message}</p>
    </div>
  )
} 