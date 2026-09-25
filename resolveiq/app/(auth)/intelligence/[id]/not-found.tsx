import Link from "next/link";
import { EmptyState } from "@/components/ui/States";
import { SearchX } from "lucide-react";

export default function ClusterNotFound() {
  return (
    <div className="mx-auto max-w-5xl">
      <EmptyState
        icon={<SearchX size={16} strokeWidth={2} />}
        title="This issue cluster doesn't exist"
        description="It may have been resolved and archived, or the link is out of date."
      />
      <div className="mt-4 text-center">
        <Link href="/intelligence" className="text-[12px] font-medium text-accent-strong hover:underline">
          Back to complaint intelligence
        </Link>
      </div>
    </div>
  );
}
