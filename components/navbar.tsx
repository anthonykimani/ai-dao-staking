import { Button } from "@/components/ui/button"
import Image from "next/image"

export function Navbar() {
  return (
    <nav className="border-b border-[#222222]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Image
                src="/lido-logo.svg"
                alt="Lido"
                width={92}
                height={32}
                className="h-8 w-auto invert"
              />
            </div>
          </div>
          <div className="flex items-center gap-4">
            <Button 
              variant="outline" 
              className="border-[#333333] hover:bg-[#222222] text-gray-300"
            >
              Connect Wallet
            </Button>
          </div>
        </div>
      </div>
    </nav>
  )
}