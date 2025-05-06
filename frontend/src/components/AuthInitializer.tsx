"use client";

import { useAuthInit } from "@/hooks/useAuthInit";

export function AuthInitializer({ children }: { children: React.ReactNode }) {
  useAuthInit();
  return <>{children}</>;
}
