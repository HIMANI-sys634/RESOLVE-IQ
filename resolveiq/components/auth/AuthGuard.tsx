"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";

export function AuthGuard({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("access_token");

    if (!token && pathname !== "/login") {
      router.replace("/login");
      return;
    }

    setChecking(false);
  }, [pathname, router]);

  if (checking && pathname !== "/login") {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center">
        <div className="text-sm text-muted">
          Loading ResolveIQ...
        </div>
      </div>
    );
  }

  return <>{children}</>;
}