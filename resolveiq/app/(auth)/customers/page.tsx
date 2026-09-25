import { fetchCustomers } from "@/services/api";
import { CustomerTable } from "@/components/customers/CustomerTable";

export default async function CustomersPage() {
  const customers = await fetchCustomers();
  return (
    <div className="mx-auto max-w-6xl space-y-4">
      <p className="text-[13px] text-text-secondary">
        {customers.length} customers · Demo data only, generic identifiers used throughout.
      </p>
      <CustomerTable customers={customers} />
    </div>
  );
}
