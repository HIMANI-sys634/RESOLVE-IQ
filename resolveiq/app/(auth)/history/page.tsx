import { fetchCaseHistory } from "@/services/api";
import { CaseHistoryTable } from "@/components/history/CaseHistoryTable";

export default async function HistoryPage() {
  const entries = await fetchCaseHistory();
  return (
    <div className="mx-auto max-w-6xl space-y-4">
      <p className="text-[13px] text-text-secondary">
        A record of every case that has moved through investigation, resolution, or escalation.
      </p>
      <CaseHistoryTable entries={entries} />
    </div>
  );
}
