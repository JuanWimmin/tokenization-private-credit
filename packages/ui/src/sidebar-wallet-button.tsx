"use client"

import { WalletButton } from "@tokenization/tw-blocks-shared/src/wallet-kit/WalletButtons"
import { useSidebar } from "./sidebar"
import { cn } from "@tokenization/shared/lib/utils"

export function SidebarWalletButton() {
  const { state } = useSidebar()
  const isCollapsed = state === "collapsed"

  return (
    <div
      className={cn(
        "flex w-full items-center rounded-xl h-12",
        isCollapsed && "justify-center"
      )}
    >
      <WalletButton variant="sidebar" />
    </div>
  )
}
