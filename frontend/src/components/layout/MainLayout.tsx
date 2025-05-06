import React from "react";
import { cn } from "@/utils";
import { UI_CONFIG } from "@/config";

interface MainLayoutProps {
  children: React.ReactNode;
  className?: string;
}

export function MainLayout({ children, className }: MainLayoutProps) {
  return (
    <div
      className={cn(
        "min-h-screen bg-background font-sans antialiased",
        UI_CONFIG.DEFAULT_THEME,
        className
      )}
    >
      <div className="relative flex min-h-screen flex-col">
        <div className="flex-1">{children}</div>
      </div>
    </div>
  );
}
