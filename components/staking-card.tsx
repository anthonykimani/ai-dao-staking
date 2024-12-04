'use client'

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Info } from "lucide-react"
import { useWriteContract, useReadContract, useAccount } from "wagmi"
import { useState } from "react"
import * as ERC20 from "@openzeppelin/contracts/build/contracts/ERC20.json"

const STAKING_CONTRACT = '0x8cb1174ed0bDFF74cd99CcBD690eEaa7288993cB'
const DGOLD_TOKEN = '0x082C329Ae8637bc89FD480B3d87484b5db441d6d'

// Define types for stake data
interface StakeData {
  amount: bigint
  unlockTime: bigint
}

export function StakingCard() {
  const [stakeAmount, setStakeAmount] = useState('')
  const [unstakeAmount, setUnstakeAmount] = useState('')
  const { writeContract } = useWriteContract()
  const { address } = useAccount()

  // Read DGOLD balance
  const { data: dgoldBalance }  = useReadContract({
    abi: ERC20.abi,
    address: DGOLD_TOKEN,
    functionName: 'balanceOf',
    args: [address],
  }) as { data: bigint }

  // Read staked amount
  const stakeInfo  = useReadContract({
    abi: [
      {
        inputs: [{ name: 'user', type: 'address' }],
        name: 'getStake',
        outputs: [
          { name: 'amount', type: 'uint256' },
          { name: 'unlockTime', type: 'uint256' }
        ],
        stateMutability: 'view',
        type: 'function'
      }
    ],
    address: STAKING_CONTRACT,
    functionName: 'getStake',
    args: [address as `0x${string}`],
  }) as unknown as StakeData

  // Read token allowance
  const { data: allowance } = useReadContract({
    abi: ERC20.abi,
    address: DGOLD_TOKEN,
    functionName: 'allowance',
    args: [address, STAKING_CONTRACT],
  })

  // Handle max button click for staking
  const handleStakeMax = () => {
    setStakeAmount(dgoldBalance ? dgoldBalance.toString() : '0')
  }

  // Handle max button click for unstaking
  const handleUnstakeMax = () => {
    setUnstakeAmount(stakeInfo ? stakeInfo.amount.toString() : '0')
  }

  // Handle token approval
  const handleApprove = async () => {
    if (!stakeAmount || Number(stakeAmount) <= 0) return
    
    writeContract({
      abi: ERC20.abi,
      address: DGOLD_TOKEN,
      functionName: 'approve',
      args: [STAKING_CONTRACT, BigInt(stakeAmount)],
    })
  }

  // Handle staking
  const handleStake = async () => {
    if (!stakeAmount || Number(stakeAmount) <= 0) return

    writeContract({
      abi: [
        {
          inputs: [{ name: 'amount', type: 'uint256' }],
          name: 'stake',
          outputs: [],
          stateMutability: 'nonpayable',
          type: 'function'
        }
      ],
      address: STAKING_CONTRACT,
      functionName: 'stake',
      args: [BigInt(stakeAmount)],
    })
  }

  // Handle unstaking
  const handleUnstake = async () => {
    if (!unstakeAmount || !stakeInfo) return

    writeContract({
      abi: [
        {
          inputs: [{ name: 'amount', type: 'uint256' }],
          name: 'unstake',
          outputs: [],
          stateMutability: 'nonpayable',
          type: 'function'
        }
      ],
      address: STAKING_CONTRACT,
      functionName: 'unstake',
      args: [BigInt(unstakeAmount)],
    })
  }

  const formatBalance = (balance: bigint | undefined) => {
    return balance ? (Number(balance) / 1e18).toFixed(4) : '0'
  }

  const getRemainingLockTime = () => {
    if (!stakeInfo?.unlockTime) return 'No active stake'
    const unlockTime = Number(stakeInfo.unlockTime) * 1000
    const now = Date.now()
    if (now >= unlockTime) return 'Unlocked'
    
    const diff = unlockTime - now
    const days = Math.floor(diff / (1000 * 60 * 60 * 24))
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
    return `${days}d ${hours}h remaining`
  }

  return (
    <div className="w-full max-w-md">
      <Tabs defaultValue="stake" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="stake">Stake</TabsTrigger>
          <TabsTrigger value="unstake">Unstake</TabsTrigger>
        </TabsList>
        <TabsContent value="stake">
          <div className="bg-[#141414] border border-[#222222] rounded-lg p-4 space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between">
                <label className="text-sm text-gray-400">Amount</label>
                <span className="text-sm text-gray-400">
                  Balance: {dgoldBalance} DGOLD
                </span>
              </div>
              <div className="flex gap-2">
                <Input
                  type="number"
                  placeholder="0.0"
                  value={stakeAmount}
                  onChange={(e) => setStakeAmount(e.target.value)}
                  className="text-lg bg-[#1A1A1A] border-[#333333] focus-visible:ring-[#FDB32A]"
                />
                <Button
                  variant="outline"
                  onClick={handleStakeMax}
                  className="border-[#333333] hover:bg-[#222222] text-gray-300"
                >
                  Max
                </Button>
              </div>
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-1">
                  <span className="text-gray-400">Lock Duration</span>
                  <Info className="h-4 w-4 text-gray-400" />
                </div>
                <span className="text-gray-200">90 days</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-400">You will receive</span>
                <span className="text-gray-200">{stakeAmount || '0'} DVOTE</span>
              </div>
            </div>

            {address ? (
              Number(allowance) >= Number(stakeAmount) ? (
                <Button 
                  onClick={handleStake} 
                  className="w-full" 
                  size="lg"
                  disabled={!stakeAmount || Number(stakeAmount) <= 0}
                >
                  Stake DGOLD
                </Button>
              ) : (
                <Button 
                  onClick={handleApprove} 
                  className="w-full" 
                  size="lg"
                  disabled={!stakeAmount || Number(stakeAmount) <= 0}
                >
                  Approve DGOLD
                </Button>
              )
            ) : (
              <Button className="w-full" size="lg">
                Connect Wallet
              </Button>
            )}
          </div>
        </TabsContent>
        
        <TabsContent value="unstake">
          <div className="bg-[#141414] border border-[#222222] rounded-lg p-4 space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between">
                <label className="text-sm text-gray-400">Amount</label>
                <span className="text-sm text-gray-400">
                  Staked: {formatBalance(stakeInfo?.amount)} DVOTE
                </span>
              </div>
              <div className="flex gap-2">
                <Input
                  type="number"
                  placeholder="0.0"
                  value={unstakeAmount}
                  onChange={(e) => setUnstakeAmount(e.target.value)}
                  className="text-lg bg-[#1A1A1A] border-[#333333] focus-visible:ring-[#FDB32A]"
                />
                <Button
                  variant="outline"
                  onClick={handleUnstakeMax}
                  className="border-[#333333] hover:bg-[#222222] text-gray-300"
                >
                  Max
                </Button>
              </div>
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-1">
                  <span className="text-gray-400">Lock Status</span>
                  <Info className="h-4 w-4 text-gray-400" />
                </div>
                <span className="text-gray-200">{getRemainingLockTime()}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-400">You will receive</span>
                <span className="text-gray-200">{unstakeAmount || '0'} DGOLD</span>
              </div>
            </div>

            {address ? (
              <Button 
                onClick={handleUnstake} 
                className="w-full" 
                size="lg"
                disabled={
                  !stakeInfo || 
                  !unstakeAmount || 
                  Number(unstakeAmount) <= 0 ||
                  BigInt(unstakeAmount) > stakeInfo.amount ||
                  Date.now() < Number(stakeInfo.unlockTime) * 1000
                }
              >
                {!stakeInfo || Date.now() < Number(stakeInfo.unlockTime) * 1000 
                  ? "Tokens Locked" 
                  : "Unstake DGOLD"}
              </Button>
            ) : (
              <Button className="w-full" size="lg">
                Connect Wallet
              </Button>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}