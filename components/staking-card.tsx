'use client'

import { useState, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Info, Loader2 } from "lucide-react"
import { useWriteContract, useReadContract, useAccount } from "wagmi"
import * as ERC20 from "@openzeppelin/contracts/build/contracts/ERC20.json"
import { parseEther, formatEther } from "viem"
import { ToastAction } from "@/components/ui/toast"
import { useToast } from "@/hooks/use-toast"
import vERC20 from "@/context/votingERC20.json"
import vailtABI from "@/context/vault.json"

/* ------------------------------------------------------------------
 * IMPORTANT: Addresses + on-chain function names remain EXACTLY as provided.
 * We only fixed display / formatting + hook usage so the UI reflects:
 *   - staked balance (from vault.staked)
 *   - remaining lock (from vault.timeUntilUnlock)
 *   - correct lock duration label (30 days)
 *   - proper bigint math
 *   - safe hook calls (no hooks inside functions)
 * ------------------------------------------------------------------ */

const STAKING_CONTRACT = '0x48592D1411f05396F6e6Ce7CceB729Ef33b7cc0b'
const DGOLD_TOKEN      = '0xEeD878017f027FE96316007D0ca5fDA58Ee93a6b'
const DVOTE_TOKEN      = '0xD6a9563f3EeDE5eFA9183F938c4aDF7ccA7D6DB0'

export function StakingCard() {
  /* ---------------------------- local state ---------------------------- */
  const [stakeAmount, setStakeAmount]     = useState('')
  const [unstakeAmount, setUnstakeAmount] = useState('')
  const [isApproving, setIsApproving]     = useState(false)
  const [isStaking, setIsStaking]         = useState(false)
  const [isUnstaking, setIsUnstaking]     = useState(false)

  const { writeContractAsync } = useWriteContract()
  const { address } = useAccount()
  const { toast } = useToast()

  /* ---------------------------- on-chain reads ------------------------- */
  // User DGOLD (AIDAO) wallet balance
  const { data: dgoldBalanceRaw } = useReadContract({
    abi: ERC20.abi,
    address: DGOLD_TOKEN,
    functionName: 'balanceOf',
    args: [address],
    query: { enabled: Boolean(address) },
  }) as { data?: bigint }

  // User vAIDAO wallet balance
  const { data: dvoteBalanceRaw } = useReadContract({
    abi: ERC20.abi, // vERC20 inherits ERC20Votes; ERC20 ABI is enough for balanceOf
    address: DVOTE_TOKEN,
    functionName: 'balanceOf',
    args: [address],
    query: { enabled: Boolean(address)},
  }) as { data?: bigint }

  // User staked balance (vault mapping staked(user) -> uint256)
  const { data: stakedBalanceRaw } = useReadContract({
    abi: vailtABI.abi,
    address: STAKING_CONTRACT,
    functionName: 'staked',
    args: [address as `0x${string}`],
    query: { enabled: Boolean(address) },
  }) as { data?: bigint }

  // User remaining lock time in seconds (vault.timeUntilUnlock(user))
  const { data: secondsRemainingRaw, isLoading: isLoadingRemaining } = useReadContract({
    abi: vailtABI.abi,
    address: STAKING_CONTRACT,
    functionName: 'timeUntilUnlock',
    args: [address as `0x${string}`],
    query: { enabled: Boolean(address), refetchInterval: 10_000 },
  }) as { data?: bigint, isLoading: boolean }

  // DGOLD allowance granted to staking vault
  const { data: allowanceRaw } = useReadContract({
    abi: ERC20.abi,
    address: DGOLD_TOKEN,
    functionName: 'allowance',
    args: [address, STAKING_CONTRACT],
    query: { enabled: Boolean(address) },
  }) as { data?: bigint }

  /* ---------------------------- derived values ------------------------ */
  const dgoldBalance  = dgoldBalanceRaw  ?? 0n
  const dvoteBalance  = dvoteBalanceRaw  ?? 0n
  const stakedBalance = stakedBalanceRaw ?? 0n
  const allowance     = allowanceRaw     ?? 0n
  const secondsRemaining = secondsRemainingRaw ?? 0n // duration, NOT timestamp

  const isLocked = secondsRemaining > 0n

  // UI helper: human readable countdown
  const remainingLabel = useMemo(() => {
    if (isLoadingRemaining) return '...'
    if (!isLocked) return 'Unlocked'

    const s = Number(secondsRemaining)
    const days = Math.floor(s / 86400)
    const hours = Math.floor((s % 86400) / 3600)
    const mins = Math.floor((s % 3600) / 60)

    if (days > 0) return `${days}d ${hours}h`
    if (hours > 0) return `${hours}h ${mins}m`
    return `${mins}m`
  }, [isLoadingRemaining, isLocked, secondsRemaining])

  const unlockDateLabel = useMemo(() => {
    if (!isLocked) return ''
    const ms = Number(secondsRemaining) * 1000
    const d  = new Date(Date.now() + ms)
    return d.toLocaleString()
  }, [isLocked, secondsRemaining])

  /* ---------------------------- handlers ------------------------------ */
  const handleStakeMax = () => {
    setStakeAmount(formatEther(dgoldBalance))
  }

  const handleUnstakeMax = () => {
    // user can at most unstake what is staked (vault) *and* what they hold as votes; prefer vault value
    const max = stakedBalance > 0n ? stakedBalance : dvoteBalance
    setUnstakeAmount(formatEther(max))
  }

  const handleApprove = async () => {
    if (!stakeAmount || Number(stakeAmount) <= 0) return

    setIsApproving(true)
    try {
      toast({ title: "Approval pending", description: "Confirm in wallet" })

      await writeContractAsync({
        abi: ERC20.abi,
        address: DGOLD_TOKEN,
        functionName: 'approve',
        args: [STAKING_CONTRACT, parseEther(stakeAmount)],
      })

      toast({ title: "Approval successful", description: "You can now stake" })
    } catch (error) {
      toast({ variant: "destructive", title: "Approval failed", description: "Transaction error" })
      console.error('Approval failed:', error)
    } finally {
      setIsApproving(false)
    }
  }

  const handleStake = async () => {
    if (!stakeAmount || Number(stakeAmount) <= 0) return

    setIsStaking(true)
    try {
      toast({ title: "Staking pending", description: "Confirm in wallet" })

      await writeContractAsync({
        abi: vailtABI.abi,
        address: STAKING_CONTRACT,
        functionName: 'stake',
        args: [parseEther(stakeAmount)],
      })

      toast({ title: "Staking successful", description: "Voting power minted" })
      setStakeAmount('')
    } catch (error) {
      toast({ variant: "destructive", title: "Staking failed", description: "Transaction error" })
      console.error('Staking failed:', error)
    } finally {
      setIsStaking(false)
    }
  }

  const handleUnstake = async () => {
    if (!unstakeAmount || Number(unstakeAmount) <= 0) return

    setIsUnstaking(true)
    try {
      toast({ title: "Unstaking pending", description: "Confirm in wallet" })

      await writeContractAsync({
        abi: [
          {
            inputs: [{ name: 'amount', type: 'uint256' }],
            name: 'unstake',
            outputs: [],
            stateMutability: 'nonpayable',
            type: 'function',
          },
        ],
        address: STAKING_CONTRACT,
        functionName: 'unstake',
        args: [parseEther(unstakeAmount)],
      })

      toast({
        title: "Success",
        description: "Tokens unstaked",
        action: <ToastAction altText="View transaction">View</ToastAction>,
      })
      setUnstakeAmount('')
    } catch (error) {
      toast({ variant: "destructive", title: "Unstake failed", description: "Transaction error" })
      console.error('Unstaking failed:', error)
    } finally {
      setIsUnstaking(false)
    }
  }

  /* ---------------------------- render helpers ------------------------ */
  const youReceiveStake = stakeAmount && Number(stakeAmount) > 0 ? stakeAmount : '0'
  const youReceiveUnstake = unstakeAmount && Number(unstakeAmount) > 0 ? unstakeAmount : '0'

  return (
    <div className="w-full max-w-md">
      <Tabs defaultValue="stake" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="stake">Stake</TabsTrigger>
          <TabsTrigger value="unstake">Unstake</TabsTrigger>
        </TabsList>

        {/* ------------------------------ STAKE TAB ------------------------------ */}
        <TabsContent value="stake">
          <div className="bg-[#141414] border border-[#222222] rounded-lg p-4 space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between">
                <label className="text-sm text-gray-400">Amount</label>
                <div className="text-right text-sm text-gray-400">
                  Balance: {formatEther(dgoldBalance)} AIDAO
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
                <span className="text-gray-200">30 days (extends on each stake)</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-400">You will receive</span>
                <span className="text-gray-200">{youReceiveStake} vAIDAO</span>
              </div>
            </div>

            {address ? (
              allowance >= (stakeAmount ? parseEther(stakeAmount) : 0n) ? (
                <Button
                  onClick={handleStake}
                  className="w-full"
                  size="lg"
                  disabled={
                    !stakeAmount ||
                    Number(stakeAmount) <= 0 ||
                    (stakeAmount ? parseEther(stakeAmount) : 0n) > dgoldBalance ||
                    isStaking
                  }
                >
                  {isStaking ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Staking...
                    </>
                  ) : (
                    "Stake AIDAO"
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
                    "Approve AIDAO"
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

        {/* ----------------------------- UNSTAKE TAB ---------------------------- */}
        <TabsContent value="unstake">
          <div className="bg-[#141414] border border-[#222222] rounded-lg p-4 space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between">
                <label className="text-sm text-gray-400">Amount</label>
                <div className="text-right text-sm text-gray-400">
                  <div>Balance: {formatEther(dvoteBalance)} vAIDAO</div>
                  <div>Staked: {formatEther(stakedBalance)} AIDAO</div>
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
                <span className="text-gray-200">{remainingLabel}</span>
              </div>
              {isLocked && (
                <div className="flex items-center justify-between text-xs text-gray-500">
                  <span>Unlocks approx:</span>
                  <span>{unlockDateLabel}</span>
                </div>
              )}
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-400">You will receive</span>
                <span className="text-gray-200">{youReceiveUnstake} AIDAO</span>
              </div>
            </div>

            {address ? (
              <Button
                onClick={handleUnstake}
                className="w-full"
                size="lg"
                disabled={
                  isUnstaking ||
                  !unstakeAmount ||
                  Number(unstakeAmount) <= 0 ||
                  (unstakeAmount ? parseEther(unstakeAmount) : 0n) > dvoteBalance ||
                  isLocked
                }
              >
                {isUnstaking ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Unstaking...
                  </>
                ) : isLocked ? (
                  "Tokens Locked"
                ) : (
                  "Unstake AIDAO"
                )}
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
