import Link from "next/link";
import { SearchX } from "lucide-react";
import { EmptyState } from "@/components/ui/States";

export default function GlobalNotFound() {
  return (
    <div className="mx-auto max-w-3xl py-12">
      <EmptyState
        icon={<SearchX size={16} strokeWidth={2} />}
        title="Page not found"
        description="The page you're looking for doesn't exist or has moved."
      />
      <div className="mt-4 text-center">
        <Link href="/dashboard" className="text-[12px] font-medium text-accent-strong hover:underline">
          Back to overview
        </Link>
      </div>
    </div>
  );
}
