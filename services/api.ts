// ---------------------------------------------------------------------------
// Service layer. Every screen reads data through these functions instead of
// importing lib/mock-data directly, so swapping mock data for real backend
// calls later means editing this file only.
//
// Two latency tiers, matching the real system:
//   - Ticket, customer, and cluster/trend data comes from Student 1's API
//     and Student 2's classification pipeline — fast.
//   - `fetchRecommendationForTicket` is Student 3's RAG resolution agent —
//     a genuinely separate, slower call (retrieval + generation). It is
//     intentionally NOT bundled onto the Ticket object, so the UI can render
//     the ticket immediately and stream the recommendation in once it's
//     ready (see app/tickets/[id]/page.tsx, which wraps it in <Suspense>).
//
// Once the backend is live, replace each function body with a fetch against
// NEXT_PUBLIC_API_URL, e.g.:
//
//   const res = await fetch(`${API_BASE_URL}/tickets/${id}/recommendation`);
//   if (!res.ok) throw new Error("Failed to load recommendation");
//   return res.json();
// ---------------------------------------------------------------------------

import {
  customers,
  orders,
  trends,
  tickets,
  caseHistory,
  dashboardMetrics,
  getCustomerById,
  getTicketById,
  getTrendById,
  getTicketsByCluster,
} from "@/lib/mock-data";
import {
  Customer,
  Order,
  Trend,
  Ticket,
  CaseHistoryEntry,
  DashboardMetrics,
  Recommendation,
} from "@/lib/types";

export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

const FAST_LATENCY_MS = 180; // ticket / customer / cluster data
const AGENT_LATENCY_MS = 900; // resolution-agent recommendation (RAG)

function delay<T>(value: T, ms = FAST_LATENCY_MS): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(value), ms));
}

export async function fetchDashboardMetrics(): Promise<DashboardMetrics> {
  return delay(dashboardMetrics);
}

/** Ticket record without the agent recommendation — fast path. */
export async function fetchTickets(): Promise<Ticket[]> {
  return delay(tickets.map(({ recommendation, ...t }) => t));
}

export async function fetchTicketById(id: string): Promise<Ticket | undefined> {
  const ticket = getTicketById(id);
  if (!ticket) return delay(undefined);
  const { recommendation, ...fast } = ticket;
  return delay(fast);
}

/** Student 3's resolution agent output. Fetched separately — see note above. */
export async function fetchRecommendationForTicket(
  id: string
): Promise<Recommendation | undefined> {
  return delay(getTicketById(id)?.recommendation, AGENT_LATENCY_MS);
}

export async function fetchTrends(): Promise<Trend[]> {
  return delay(trends);
}

export async function fetchTrendById(id: string): Promise<Trend | undefined> {
  return delay(getTrendById(id));
}

export async function fetchTicketsByCluster(clusterId: string): Promise<Ticket[]> {
  return delay(getTicketsByCluster(clusterId).map(({ recommendation, ...t }) => t));
}

export async function fetchCustomers(): Promise<Customer[]> {
  return delay(customers);
}

export async function fetchCustomerById(id: string): Promise<Customer | undefined> {
  return delay(getCustomerById(id));
}

export async function fetchOrders(): Promise<Order[]> {
  return delay(orders);
}

export async function fetchCaseHistory(): Promise<CaseHistoryEntry[]> {
  return delay(caseHistory);
}
