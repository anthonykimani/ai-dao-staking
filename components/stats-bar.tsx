export function StatsBar() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      <StatCard
        title="Total staked with Lido"
        value="9,137,293 ETH"
        change="+0.12%"
      />
      <StatCard
        title="stETH Market Cap"
        value="$21.2B"
        change="+1.24%"
      />
      <StatCard
        title="APR"
        value="3.8%"
        subtitle="Current staking rewards"
      />
      <StatCard
        title="Holders"
        value="219,826"
        change="+123 (24h)"
      />
    </div>
  )
}

function StatCard({ 
  title, 
  value, 
  change, 
  subtitle 
}: { 
  title: string
  value: string
  change?: string
  subtitle?: string
}) {
  return (
    <div className="bg-card rounded-lg p-4 border">
      <h3 className="text-sm text-muted-foreground">{title}</h3>
      <div className="mt-2 flex items-baseline gap-2">
        <p className="text-2xl font-semibold">{value}</p>
        {change && (
          <span className="text-sm text-green-500">{change}</span>
        )}
      </div>
      {subtitle && (
        <p className="text-sm text-muted-foreground mt-1">{subtitle}</p>
      )}
    </div>
  )
}