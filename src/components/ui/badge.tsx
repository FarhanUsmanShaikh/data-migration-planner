import * as React from "react"

interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'outline' | 'secondary' | 'destructive' | 'success' | 'warning' | 'info'
}

const Badge = React.forwardRef<HTMLDivElement, BadgeProps>(
  ({ className = '', variant = 'default', ...props }, ref) => {
    const variants = {
      default: 'bg-indigo-500/15 text-indigo-300 border border-indigo-500/30',
      success: 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30',
      warning: 'bg-amber-500/15 text-amber-300 border border-amber-500/30',
      info: 'bg-cyan-500/15 text-cyan-300 border border-cyan-500/30',
      outline: 'border border-slate-700 bg-slate-900/60 text-slate-300',
      secondary: 'bg-slate-800 text-slate-300 border border-slate-700/50',
      destructive: 'bg-rose-500/15 text-rose-300 border border-rose-500/30'
    }

    return (
      <div
        ref={ref}
        className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium backdrop-blur-sm transition-all ${variants[variant]} ${className}`}
        {...props}
      />
    )
  }
)
Badge.displayName = "Badge"

export { Badge }
