import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Info } from "lucide-react"

export function StakingCard() {
  return (
    <div className="w-full max-w-md">
      <Tabs defaultValue="stake" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="stake">Stake</TabsTrigger>
          <TabsTrigger value="withdraw">Withdraw</TabsTrigger>
        </TabsList>
        <TabsContent value="stake">
          <div className="bg-[#141414] border border-[#222222] rounded-lg p-4 space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between">
                <label className="text-sm text-gray-400">Amount</label>
                <span className="text-sm text-gray-400">Balance: 0 ETH</span>
              </div>
              <div className="flex gap-2">
                <Input
                  type="number"
                  placeholder="0.0"
                  className="text-lg bg-[#1A1A1A] border-[#333333] focus-visible:ring-[#FDB32A]"
                />
                <Button 
                  variant="outline"
                  className="border-[#333333] hover:bg-[#222222] text-gray-300"
                >
                  Max
                </Button>
              </div>
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-1">
                  <span className="text-gray-400">You will receive</span>
                  <Info className="h-4 w-4 text-gray-400" />
                </div>
                <span className="text-gray-200">0 stETH</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-400">Exchange rate</span>
                <span className="text-gray-200">1 ETH = 1 stETH</span>
              </div>
            </div>

            <Button className="w-full" size="lg">
              Connect Wallet
            </Button>
          </div>
        </TabsContent>
        
        <TabsContent value="withdraw">
          <div className="bg-[#141414] border border-[#222222] rounded-lg p-4 space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between">
                <label className="text-sm text-gray-400">Amount</label>
                <span className="text-sm text-gray-400">Balance: 0 stETH</span>
              </div>
              <div className="flex gap-2">
                <Input
                  type="number"
                  placeholder="0.0"
                  className="text-lg bg-[#1A1A1A] border-[#333333] focus-visible:ring-[#FDB32A]"
                />
                <Button 
                  variant="outline"
                  className="border-[#333333] hover:bg-[#222222] text-gray-300"
                >
                  Max
                </Button>
              </div>
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-1">
                  <span className="text-gray-400">You will receive</span>
                  <Info className="h-4 w-4 text-gray-400" />
                </div>
                <span className="text-gray-200">0 ETH</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-400">Exchange rate</span>
                <span className="text-gray-200">1 stETH = 1 ETH</span>
              </div>
            </div>

            <Button className="w-full" size="lg">
              Connect Wallet
            </Button>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}