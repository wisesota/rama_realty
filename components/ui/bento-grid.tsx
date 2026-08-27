import { type ComponentPropsWithoutRef, type ReactNode } from "react"
import { ArrowRightIcon } from "@radix-ui/react-icons"

import { cn } from "@/lib/utils"
import { LinkButton } from "@/components/ui/button"

interface BentoGridProps extends ComponentPropsWithoutRef<"div"> {
  children: ReactNode
  className?: string
}

interface BentoCardProps extends ComponentPropsWithoutRef<"div"> {
  name: string
  className: string
  background: ReactNode
  Icon: React.ElementType
  description: string
  href: string
  cta: string
}

const BentoGrid = ({ children, className, ...props }: BentoGridProps) => {
  return (
    <div
      className={cn(
        "grid w-full auto-rows-[22rem] grid-cols-3 gap-4",
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
}

const BentoCard = ({
  name,
  className,
  background,
  Icon,
  description,
  href,
  cta,
  ...props
}: BentoCardProps) => (
  <div
    key={name}
    className={cn(
      "group relative col-span-3 flex flex-col justify-between overflow-hidden rounded-xl",
      // light styles
      "bg-background [box-shadow:0_0_0_1px_rgba(0,0,0,.03),0_2px_4px_rgba(0,0,0,.05),0_12px_24px_rgba(0,0,0,.05)]",
      // dark styles
      "dark:bg-background transform-gpu dark:[box-shadow:0_-20px_80px_-20px_#ffffff1f_inset] dark:[border:1px_solid_rgba(255,255,255,.1)]",
      className
    )}
    {...props}
  >
    {/* Image Container */}
    <div className="relative flex-1 w-full overflow-hidden">
      <div className="absolute inset-0">{background}</div>
    </div>
    
    {/* Text Container */}
    <div className="relative z-10 p-6 flex flex-col gap-3 bg-white dark:bg-black border-t border-neutral-100 dark:border-neutral-800 shrink-0">
      <div className="flex items-center gap-3">
        <Icon className="h-6 w-6 text-[#1E1E1E] dark:text-white" />
        <h3 className="text-xl font-semibold text-[#1E1E1E] dark:text-white">
          {name}
        </h3>
      </div>
      <p className="text-[#535353] dark:text-neutral-400 text-sm">
        {description}
      </p>

      <div className="pt-2">
        <LinkButton
          variant="link"
          size="sm"
          className="p-0 text-[#0000EE] hover:text-[#0000EE]/80 font-medium tracking-widest uppercase text-xs inline-flex items-center"
          href={href}
        >
          {cta}
          <ArrowRightIcon className="ms-2 h-4 w-4" />
        </LinkButton>
      </div>
    </div>
  </div>
)

export { BentoCard, BentoGrid }
