'use client'

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Info, Loader2 } from "lucide-react"
import { useWriteContract, useReadContract, useAccount } from "wagmi"
import { useState } from "react"
import * as ERC20 from "@openzeppelin/contracts/build/contracts/ERC20.json"
import { parseEther, formatEther } from "viem"
import { ToastAction } from "@/components/ui/toast"
import { useToast } from "@/hooks/use-toast"

const STAKING_CONTRACT = '0x8cb1174ed0bDFF74cd99CcBD690eEaa7288993cB'
const DGOLD_TOKEN = '0x082C329Ae8637bc89FD480B3d87484b5db441d6d'
const DVOTE_TOKEN = '0x9bCA1e9852868d822Cd2c06da58253428F2B291D'

export function StakingCard() {
  const [stakeAmount, setStakeAmount] = useState('')
  const [unstakeAmount, setUnstakeAmount] = useState('')
  const [isApproving, setIsApproving] = useState(false)
  const [isStaking, setIsStaking] = useState(false)
  const [isUnstaking, setIsUnstaking] = useState(false)
  const { writeContractAsync } = useWriteContract()
  const { address } = useAccount()
  const { toast } = useToast()

  const { data: dgoldBalance } = useReadContract({
    abi: ERC20.abi,
    address: DGOLD_TOKEN,
    functionName: 'balanceOf',
    args: [address],
  }) as { data: bigint }

  const { data: dvoteBalance } = useReadContract({
    abi: ERC20.abi,
    address: DVOTE_TOKEN,
    functionName: 'balanceOf',
    args: [address],
  }) as { data: bigint }

  const { data: stakeInfo } = useReadContract({
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
  }) as { data: [bigint, bigint] }

  const { data: allowance } = useReadContract({
    abi: ERC20.abi,
    address: DGOLD_TOKEN,
    functionName: 'allowance',
    args: [address, STAKING_CONTRACT],
  }) as { data: bigint }

  const handleStakeMax = () => {
    setStakeAmount(dgoldBalance ? formatEther(dgoldBalance) : '0')
  }

  const handleUnstakeMax = () => {
    setUnstakeAmount(dvoteBalance ? formatEther(dvoteBalance) : '0')
  }

  const handleApprove = async () => {
    if (!stakeAmount || Number(stakeAmount) <= 0) return
    
    setIsApproving(true)
    try {
      toast({
        title: "Approval pending",
        description: "Please confirm the transaction in your wallet",
      })

      await writeContractAsync({
        abi: ERC20.abi,
        address: DGOLD_TOKEN,
        functionName: 'approve',
        args: [STAKING_CONTRACT, parseEther(stakeAmount)],
      })

      toast({
        title: "Approval successful",
        description: "You can now stake your DGOLD tokens",
      })
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Approval failed",
        description: "There was an error approving your tokens",
      })
      console.error('Approval failed:', error)
    } finally {
      setIsApproving(false)
    }
  }

  const handleStake = async () => {
    if (!stakeAmount || Number(stakeAmount) <= 0) return

    setIsStaking(true)
    try {
      toast({
        title: "Staking pending",
        description: "Please confirm the staking transaction",
      })

      await writeContractAsync({
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
        args: [parseEther(stakeAmount)],
      })

      toast({
        title: "Staking successful",
        description: "Now delegating your voting power...",
      })

      await writeContractAsync({
        abi: [
          {
            inputs: [{ name: 'delegatee', type: 'address' }],
            name: 'delegate',
            outputs: [],
            stateMutability: 'nonpayable',
            type: 'function'
          }
        ],
        address: DVOTE_TOKEN,
        functionName: 'delegate',
        args: [address as `0x${string}`],
      })

      toast({
        title: "Success",
        description: "Tokens staked and voting power delegated",
      })

      setStakeAmount('')
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Transaction failed",
        description: "There was an error with your transaction",
      })
      console.error('Staking or delegation failed:', error)
    } finally {
      setIsStaking(false)
    }
  }

  const handleUnstake = async () => {
    if (!unstakeAmount || !dvoteBalance) return

    setIsUnstaking(true)
    try {
      toast({
        title: "Unstaking pending",
        description: "Please confirm the unstaking transaction",
      })

      await writeContractAsync({
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
        args: [parseEther(unstakeAmount)],
      })

      toast({
        title: "Success",
        description: "Tokens successfully unstaked",
        action: (
          <ToastAction altText="View transaction">View</ToastAction>
        ),
      })

      setUnstakeAmount('')
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Unstaking failed",
        description: "There was an error unstaking your tokens",
      })
      console.error('Unstaking failed:', error)
    } finally {
      setIsUnstaking(false)
    }
  }

  const getRemainingLockTime = () => {
    if (!stakeInfo?.[1]) return 'No active stake'
    const unlockTime = Number(stakeInfo[1]) * 1000
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
                <div className="text-right">
                  <div className="text-sm text-gray-400">
                    Balance: {formatEther(dgoldBalance || BigInt(0))} DGOLD
                  </div>
                </div>
              </div>
              <div className="flex gap-2">
                <Input
                  type="number"
                  placeholder="0.0"
                  value={stakeAmount}
                  onChange={(e) => setStakeAmount(e.target.value)}
                  className="text-lg bg-[#1A1A1A] border-[#333333] focus-visible:ring-[#0ad197d4]"
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
                <span className="text-gray-200">{formatEther(BigInt(parseEther(stakeAmount || '0')))} DVOTE</span>
              </div>
            </div>

            {address ? (
              (allowance || BigInt(0)) >= parseEther(stakeAmount || '0') ? (
                <Button 
                  onClick={handleStake} 
                  className="w-full" 
                  size="lg"
                  disabled={
                    !stakeAmount || 
                    Number(stakeAmount) <= 0 ||
                    parseEther(stakeAmount) > (dgoldBalance || BigInt(0)) ||
                    isStaking
                  }
                >
                  {isStaking ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Staking...
                    </>
                  ) : (
                    "Stake DGOLD"
                  )}
                </Button>
              ) : (
                <Button 
                  onClick={handleApprove} 
                  className="w-full" 
                  size="lg"
                  disabled={!stakeAmount || Number(stakeAmount) <= 0 || isApproving}
                >
                  {isApproving ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Approving...
                    </>
                  ) : (
                    "Approve DGOLD"
                  )}
                </Button>
              )
            ) : (
              <Button className="w-full hover:bg-[#0ad197d4]" size="lg">
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
                <div className="text-right">
                  <div className="text-sm text-gray-400">
                    Balance: {formatEther(dvoteBalance || BigInt(0))} DVOTE
                  </div>
                  <div className="text-sm text-gray-400">
                    Staked: {formatEther(stakeInfo?.[0] || BigInt(0))} DGOLD
                  </div>
                </div>
              </div>
              <div className="flex gap-2">
                <Input
                  type="number"
                  placeholder="0.0"
                  value={unstakeAmount}
                  onChange={(e) => setUnstakeAmount(e.target.value)}
                  className="text-lg bg-[#1A1A1A] border-[#333333] focus-visible:ring-[#0ad197d4]"
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
                <span className="text-gray-200">{formatEther(BigInt(parseEther(unstakeAmount || '0')))} DGOLD</span>
              </div>
            </div>

            {address ? (
              <Button 
                onClick={handleUnstake} 
                className="w-full" 
                size="lg"
                disabled={
                  !dvoteBalance || 
                  !unstakeAmount || 
                  Number(unstakeAmount) <= 0 ||
                  parseEther(unstakeAmount) > (dvoteBalance || BigInt(0)) ||
                  Date.now() < Number(stakeInfo?.[1] || 0) * 1000 ||
                  isUnstaking
                }
              >
                {isUnstaking ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Unstaking...
                  </>
                ) : !stakeInfo || Date.now() < Number(stakeInfo?.[1] || 0) * 1000 
                  ? "Tokens Locked" 
                  : "Unstake DGOLD"}
              </Button>
            ) : (
              <Button className="w-full hover:bg-[#0ad197d4]" size="lg">
                Connect Wallet
              </Button>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}