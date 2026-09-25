import Link from "next/link";
import { EmptyState } from "@/components/ui/States";
import { SearchX } from "lucide-react";

export default function TicketNotFound() {
  return (
    <div className="mx-auto max-w-5xl">
      <EmptyState
        icon={<SearchX size={16} strokeWidth={2} />}
        title="This ticket doesn't exist"
        description="It may have been merged into another case or the ID was mistyped."
      />
      <div className="mt-4 text-center">
        <Link href="/tickets" className="text-[12px] font-medium text-accent-strong hover:underline">
          Back to tickets
        </Link>
      </div>
    </div>
  );
}
