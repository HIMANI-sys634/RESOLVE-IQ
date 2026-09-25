import { LoadingRows } from "@/components/ui/States";
export default function CustomersLoading() {
  return <div className="mx-auto max-w-6xl"><LoadingRows rows={6} /></div>;
}
