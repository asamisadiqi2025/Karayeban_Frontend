"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";

import { Loader2 } from "lucide-react";
import { useAuth } from "@/contexts/auth-context";

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (isLoading) return;

    if (!user) {
      router.replace("/login");
      return;
    }

    const isAdmin = user.role === "admin" || user.role === "superadmin";
    const allowedPaths = ["/market-profile", "/settings/currencies/adtocurrency"];
    const isAllowed = allowedPaths.some((p) => pathname.startsWith(p));

    if (isAdmin && !user.isSetupComplete && !isAllowed) {
      router.replace("/market-profile");
    }
  }, [isLoading, user, router, pathname]);

  if (isLoading || !user) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return <>{children}</>;
}
