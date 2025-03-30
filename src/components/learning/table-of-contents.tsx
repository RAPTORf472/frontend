import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import { List, ChevronRight } from "lucide-react"

export interface TableOfContentsItem {
  id: string
  title: string
  level: number
}

export interface TableOfContentsProps {
  items: TableOfContentsItem[]
  className?: string
  isSticky?: boolean
}

export function TableOfContents({ items, className, isSticky = true }: TableOfContentsProps) {
  if (items.length === 0) {
    return null;
  }
  
  // Function to get heading style based on level
  const getHeadingStyle = (level: number) => {
    switch (level) {
      case 1:
        return "font-bold text-[#2c5530]";
      case 2:
        return "font-semibold text-[#2c5530]";
      case 3:
        return "font-medium text-[#2c5530]/90";
      case 4:
        return "font-normal text-[#2c5530]/80";
      default:
        return "font-light text-[#2c5530]/70";
    }
  };
  
  return (
    <div className={cn(isSticky ? "sticky top-24" : "", "space-y-6", className)}>
      <Card className="border-[#d1e0d3] bg-white overflow-hidden">
        <CardHeader className="bg-[#f0f4e9] border-b border-[#d1e0d3] pb-3 flex flex-row items-center">
          <List className="h-5 w-5 text-[#2c5530] mr-2" />
          <CardTitle className="text-[#2c5530]">Contents</CardTitle>
        </CardHeader>
        <CardContent className="p-4">
          <nav className="space-y-1">
            {items.map((item, index) => (
              <div 
                key={index} 
                className="flex items-start group hover:bg-[#f8f9f3] rounded py-1 transition-colors"
                style={{ 
                  paddingLeft: `${(item.level - 1) * 0.75}rem`,
                  marginTop: item.level === 1 || (index > 0 && items[index-1].level < item.level) ? '0.5rem' : '0'
                }}
              >
                <ChevronRight className="h-3.5 w-3.5 text-[#2c5530]/70 shrink-0 mt-0.5 mr-1 transition-transform group-hover:translate-x-0.5" />
                <a 
                  href={`#${item.id}`} 
                  className={cn(
                    "text-sm hover:text-[#2c5530] transition-colors line-clamp-2",
                    getHeadingStyle(item.level)
                  )}
                  onClick={(e) => {
                    e.preventDefault();
                    const element = document.getElementById(item.id);
                    if (element) {
                      element.scrollIntoView({ 
                        behavior: 'smooth',
                        block: 'start'
                      });
                      
                      // Add a highlight effect
                      element.classList.add('bg-[#f0f4e9]', 'transition-colors');
                      setTimeout(() => {
                        element.classList.remove('bg-[#f0f4e9]', 'transition-colors');
                      }, 1500);
                    }
                  }}
                >
                  {item.title}
                </a>
              </div>
            ))}
          </nav>
        </CardContent>
      </Card>
    </div>
  )
} 