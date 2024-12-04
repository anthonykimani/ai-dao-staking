import { Navbar } from '@/components/navbar'
import { StakingCard } from '@/components/staking-card'

export default function Home() {
  return (
    <main className="min-h-screen p-4 md:p-8">
      <Navbar />
      <div className="max-w-7xl mx-auto space-y-12">
        <div className="flex justify-center">
          <StakingCard />
        </div>
      </div>
    </main>
  )
}