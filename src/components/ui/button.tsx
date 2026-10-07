import * as React from "react"

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'outline' | 'destructive' | 'secondary' | 'ghost' | 'glow'
  size?: 'default' | 'sm' | 'lg' | 'icon'
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className = '', variant = 'default', size = 'default', ...props }, ref) => {
    const baseStyles = 'inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950 active:scale-[0.98] disabled:opacity-40 disabled:pointer-events-none cursor-pointer'
    
    const variants = {
      default: 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/20 border border-indigo-500/30',
      glow: 'bg-gradient-to-r from-indigo-500 via-purple-500 to-cyan-500 text-white shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40 hover:brightness-110 border border-indigo-400/30',
      outline: 'border border-slate-800 bg-slate-900/60 hover:bg-slate-800/80 text-slate-200 hover:border-slate-700 hover:text-white backdrop-blur-sm',
      destructive: 'bg-rose-600/90 hover:bg-rose-600 text-white shadow-lg shadow-rose-600/20 border border-rose-500/30',
      secondary: 'bg-slate-800/80 hover:bg-slate-700 text-slate-200 border border-slate-700/50',
      ghost: 'hover:bg-slate-800/60 text-slate-300 hover:text-white'
    }

    const sizes = {
      default: 'h-9 px-4 py-2 text-sm',
      sm: 'h-8 px-3 text-xs',
      lg: 'h-11 px-6 text-base font-semibold',
      icon: 'h-9 w-9 p-0'
    }

    return (
      <button
        className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button }
