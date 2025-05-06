import * as React from "react";
import { cn } from "@/utils";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link";
  size?: "default" | "sm" | "lg" | "icon";
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "default", size = "default", children, ...props }, ref) => {
    // Component can render as a different element if asChild is true
    const Comp = props.asChild ? React.Fragment : "button";
    
    return (
      <Comp
        className={cn(
          // Base styles
          "inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-all duration-200",
          "focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-1",
          "disabled:opacity-60 disabled:cursor-not-allowed",
          
          // Variant styles
          variant === "default" && "bg-emerald-500 text-white hover:bg-emerald-600 active:bg-emerald-700 shadow-sm",
          variant === "destructive" && "bg-red-500 text-white hover:bg-red-600 active:bg-red-700 shadow-sm",
          variant === "outline" && "border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 hover:border-emerald-500 hover:text-emerald-600",
          variant === "secondary" && "bg-gray-100 text-gray-800 hover:bg-gray-200 active:bg-gray-300",
          variant === "ghost" && "bg-transparent hover:bg-gray-100 text-gray-700",
          variant === "link" && "text-emerald-600 underline-offset-4 hover:underline bg-transparent p-0 h-auto shadow-none",
          
          // Size styles
          size === "default" && "h-10 px-4 py-2",
          size === "sm" && "h-8 px-3 py-1 text-xs",
          size === "lg" && "h-12 px-6 py-3 text-base",
          size === "icon" && "h-10 w-10 p-0",
          
          className
        )}
        ref={ref}
        {...props}
      >
        {children}
      </Comp>
    );
  }
);

Button.displayName = "Button";

export { Button };