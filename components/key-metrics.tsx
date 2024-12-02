import { MetricCard } from "./metric-card"
import { Badge } from "./ui/badge"

export function KeyMetrics() {
  return (
    <div className="space-y-8">
      <h2 className="text-3xl font-bold text-[#FDB32A]">
        Key Metrics
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="grid grid-cols-1 gap-4">
          <MetricCard
            label="INITIAL SUPPLY"
            value="10,000,000,000"
          />
          <MetricCard
            label="INITIAL MARKET CAP"
            value="$3,572,999"
          />
          <MetricCard
            label="BLOCKCHAIN"
            value="ERC20 (ETH)"
          />
        </div>
        <div className="grid grid-cols-1 gap-4">
          <MetricCard
            label="MAXIMUM SUPPLY"
            value="10,000,000,000"
          />
          <MetricCard
            label="SOFT CAP"
            value="$0"
          />
          <MetricCard
            label="TOKEN UTILITY"
            customValue={<Badge variant="secondary">DeFi</Badge>}
          />
        </div>
        <div className="grid grid-cols-1 gap-4">
          <MetricCard
            label="TOKEN INVENTORY"
            value="714,599,919"
          />
          <MetricCard
            label="HARD CAP"
            value="$250,000"
          />
          <MetricCard
            label="EXCHANGES"
            customValue={<Badge variant="secondary">Coming Soon</Badge>}
          />
        </div>
      </div>
    </div>
  )
}