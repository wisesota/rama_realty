import * as React from "react"
import { cn } from "@/lib/utils"

export interface LagomAccentButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  asChild?: boolean
}

const LagomAccentButton = React.forwardRef<HTMLButtonElement, LagomAccentButtonProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          "inline-flex items-center justify-center gap-4 text-sm font-bold uppercase tracking-[0.2em]",
          "bg-[#5889BB] text-white hover:text-white",
          "rounded-tl-full rounded-tr-none rounded-br-none rounded-bl-none",
          // impeccable-disable-next-line bounce-easing -- rejected Archivanta exploration; never imported by an active route or registry item
          "transition-transform duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)] hover:scale-110",
          "px-8 py-4 pb-3",
          className
        )}
        {...props}
      >
        {children}
      </button>
    )
  }
)
LagomAccentButton.displayName = "LagomAccentButton"

export { LagomAccentButton }
