import { cn } from "@/lib/utils"

interface MetricCardProps {
  label: string
  value?: string
  customValue?: React.ReactNode
  className?: string
}

export function MetricCard({ 
  label, 
  value,
  customValue,
  className
}: MetricCardProps) {
  return (
    <div className={cn(
      "bg-[#141414] rounded-lg p-4 border border-[#222222] shadow-sm",
      className
    )}>
      <h3 className="text-sm text-gray-500 mb-2">{label}</h3>
      {customValue ? (
        customValue
      ) : (
        <p className="text-xl font-medium text-gray-200">{value}</p>
      )}
    </div>
  )
}