import {
  customers as mockCustomers,
  orders as mockOrders,
  trends as mockTrends,
  tickets as mockTickets,
  caseHistory as mockCaseHistory,
  dashboardMetrics as mockDashboardMetrics,
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
  Sentiment,
  Severity,
  TicketStatus,
  EscalationState,
} from "@/lib/types";

/**
 * ResolveIQ service adapter.
 *
 * Live mode:
 *   Student 1: NEXT_PUBLIC_BACKEND_URL (default http://127.0.0.1:8000)
 *   Student 3: NEXT_PUBLIC_AGENT_URL   (default http://127.0.0.1:8001)
 *
 * The UI falls back to the bundled demo dataset when a service is unavailable,
 * so the hackathon demo still renders instead of showing a blank screen.
 */

const BACKEND_URL =
  process.env.NEXT_PUBLIC_BACKEND_URL ??
  process.env.NEXT_PUBLIC_API_URL ??
  "http://127.0.0.1:8000";

const AGENT_URL =
  process.env.NEXT_PUBLIC_AGENT_URL ??
  "http://127.0.0.1:8001";

const LIVE_TIMEOUT_MS = 5000;

type BackendCustomer = {
  customer_id: string;
  name: string;
  email: string;
  phone?: string;
};

type BackendOrder = {
  order_id: string;
  customer_id: string;
  item: string;
  amount: number;
  status: string;
  created_at?: string;
};

type BackendComplaint = {
  complaint_id: string;
  customer_id: string;
  order_id?: string | null;
  text: string;
  timestamp: string;
  status: string;
};

type IntelligenceComplaint = {
  complaint_id: string;
  customer_id: string;
  order_id?: string | null;
  text?: string;
  clean_text: string;
  issue_type: string;
  sentiment: string;
  severity: string;
  cluster?: string;
  cluster_id?: number | string;
  created_at: string;
};

type IntelligenceOutput = {
  analyzed_complaints?: IntelligenceComplaint[];
  trends?: Array<Record<string, unknown>>;
  clusters?: Array<Record<string, unknown>>;
};

type AgentOutput = {
  complaint_id: string;
  summary: string;
  action: string;
  reason: string;
  customer_message: string;
  escalate: boolean;
  missing_information: string[];
  escalate_reason?: string | null;
  guardrail_flags?: string[];
  severity: string;
  issue_type: string;
  used_llm: boolean;
  llm_provider: string;
  policy_version: string;
};

async function liveFetch<T>(url: string): Promise<T> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), LIVE_TIMEOUT_MS);

  try {
    const response = await fetch(url, {
      cache: "no-store",
      signal: controller.signal,
    });
    if (!response.ok) throw new Error(`${response.status} ${response.statusText}`);
    return (await response.json()) as T;
  } finally {
    clearTimeout(timeout);
  }
}

function lower(value: unknown): string {
  return String(value ?? "").toLowerCase();
}

function severity(value: unknown): Severity {
  const v = lower(value);
  if (v === "critical") return "critical";
  if (v === "high") return "high";
  if (v === "medium") return "medium";
  return "low";
}

function sentiment(value: unknown): Sentiment {
  const v = lower(value);
  if (v === "positive") return "positive";
  if (v === "negative") return "negative";
  return "neutral";
}

function status(value: unknown): TicketStatus {
  const v = lower(value);
  if (v === "resolved" || v === "closed") return "resolved";
  if (v === "escalated") return "escalated";
  if (v === "investigating" || v === "in_progress") return "investigating";
  return "open";
}

function escalation(value: boolean | string | undefined): EscalationState {
  if (value === true || lower(value) === "escalated") return "escalated";
  if (lower(value) === "recommended") return "recommended";
  return "none";
}

function titleFromText(text: string, issue: string): string {
  const clean = text.replace(/\s+/g, " ").trim();
  if (!clean) return issue;
  return clean.length > 72 ? `${clean.slice(0, 69)}…` : clean;
}

function daysAgo(iso: string): number {
  const diff = Date.now() - new Date(iso).getTime();
  return Math.max(0, Math.round(diff / 86400000));
}

function mapCustomer(c: BackendCustomer, ticketCount = 0, orderCount = 0): Customer {
  return {
    id: c.customer_id,
    displayName: c.name || c.customer_id,
    tier: "standard",
    region: "—",
    totalOrders: orderCount,
    totalTickets: ticketCount,
    lastContact: new Date().toISOString(),
  };
}

async function loadLiveData() {
  const [customersResult, ordersResult, complaintsResult, intelligenceResult] =
    await Promise.all([
      liveFetch<BackendCustomer[]>(`${BACKEND_URL}/customers`),
      liveFetch<BackendOrder[]>(`${BACKEND_URL}/orders`),
      liveFetch<BackendComplaint[]>(`${BACKEND_URL}/complaints`),
      liveFetch<IntelligenceOutput>(`${BACKEND_URL}/intelligence/analyze`),
    ]);

  return {
    customers: customersResult,
    orders: ordersResult,
    complaints: complaintsResult,
    intelligence: intelligenceResult,
  };
}

function mapLiveTicket(
  complaint: BackendComplaint,
  analysis: IntelligenceComplaint | undefined,
  customer?: BackendCustomer,
): Ticket {
  const category = analysis?.issue_type ?? "General Inquiry";
  const createdAt = complaint.timestamp ?? analysis?.created_at ?? new Date().toISOString();

  return {
    id: complaint.complaint_id,
    customerId: complaint.customer_id,
    customerName: customer?.name ?? complaint.customer_id,
    orderId: complaint.order_id ?? undefined,
    subject: titleFromText(complaint.text, category),
    message: complaint.text,
    category,
    sentiment: sentiment(analysis?.sentiment),
    severity: severity(analysis?.severity),
    status: status(complaint.status),
    escalation: "none",
    createdAt,
    updatedAt: createdAt,
    relatedClusterId:
      analysis?.cluster_id !== undefined
        ? String(analysis.cluster_id)
        : analysis?.cluster,
  };
}

async function getLiveTicketData(): Promise<{
  customers: Customer[];
  orders: Order[];
  tickets: Ticket[];
  intelligence: IntelligenceOutput;
}> {
  const live = await loadLiveData();
  const analyses = live.intelligence.analyzed_complaints ?? [];
  const byComplaint = new Map(analyses.map((a) => [a.complaint_id, a]));
  const ticketCounts = new Map<string, number>();
  const orderCounts = new Map<string, number>();

  for (const c of live.complaints) {
    ticketCounts.set(c.customer_id, (ticketCounts.get(c.customer_id) ?? 0) + 1);
  }
  for (const o of live.orders) {
    orderCounts.set(o.customer_id, (orderCounts.get(o.customer_id) ?? 0) + 1);
  }

  const customers = live.customers.map((c) =>
    mapCustomer(c, ticketCounts.get(c.customer_id) ?? 0, orderCounts.get(c.customer_id) ?? 0),
  );

  const tickets = live.complaints.map((c) =>
    mapLiveTicket(c, byComplaint.get(c.complaint_id), live.customers.find((x) => x.customer_id === c.customer_id)),
  );

  return {
    customers,
    orders: live.orders.map((o) => ({
      id: o.order_id,
      customerId: o.customer_id,
      status: (["placed", "shipped", "delivered", "cancelled", "refunded"].includes(lower(o.status))
        ? lower(o.status)
        : "placed") as Order["status"],
      amount: Number(o.amount ?? 0),
      item: o.item,
      placedAt: o.created_at ?? new Date().toISOString(),
    })),
    tickets,
    intelligence: live.intelligence,
  };
}

async function withFallback<T>(live: () => Promise<T>, fallback: T): Promise<T> {
  try {
    return await live();
  } catch {
    return fallback;
  }
}

function buildMetrics(tickets: Ticket[], intelligence: IntelligenceOutput): DashboardMetrics {
  const total = tickets.length;
  const active = tickets.filter((t) => t.status !== "resolved").length;
  const high = tickets.filter((t) => t.severity === "high" || t.severity === "critical").length;
  const escalated = tickets.filter((t) => t.escalation !== "none" || t.status === "escalated").length;
  const resolved = tickets.filter((t) => t.status === "resolved").length;

  const countBy = <T extends string>(values: T[]) =>
    values.reduce<Record<string, number>>((acc, v) => {
      acc[v] = (acc[v] ?? 0) + 1;
      return acc;
    }, {});

  const categories = countBy(tickets.map((t) => t.category));
  const sentiments = countBy(tickets.map((t) => t.sentiment));
  const severities = countBy(tickets.map((t) => t.severity));

  const byDay = new Map<string, number>();
  const byEscalationDay = new Map<string, number>();
  for (const t of tickets) {
    const day = new Date(t.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" });
    byDay.set(day, (byDay.get(day) ?? 0) + 1);
    if (t.status === "escalated") byEscalationDay.set(day, (byEscalationDay.get(day) ?? 0) + 1);
  }

  return {
    totalConversations: total,
    totalConversationsDelta: 0,
    activeCases: active,
    activeCasesDelta: 0,
    highSeverityCases: high,
    highSeverityDelta: 0,
    escalations: escalated,
    escalationsDelta: 0,
    resolutionRate: total ? resolved / total : 0,
    slaCompliance: total ? Math.max(0, 1 - high / total) : 0,
    volumeTrend: Array.from(byDay, ([date, count]) => ({ date, count })),
    categoryDistribution: Object.entries(categories).map(([category, count]) => ({ category, count })),
    sentimentDistribution: Object.entries(sentiments).map(([sentiment, count]) => ({
      sentiment: sentiment as Sentiment,
      count,
    })),
    severityDistribution: Object.entries(severities).map(([severity, count]) => ({
      severity: severity as Severity,
      count,
    })),
    escalationTrend: Array.from(byEscalationDay, ([date, count]) => ({ date, count })),
  };
}

function mapLiveTrends(output: IntelligenceOutput): Trend[] {
  const raw = output.trends ?? [];
  if (!raw.length) return [];

  return raw.map((item, index) => {
    const clusterName = String(item.cluster ?? item.cluster_name ?? item.issue_type ?? `Cluster ${index + 1}`);
    const count = Number(item.count ?? item.current_count ?? 0);
    const growth = Number(item.growth_percent ?? item.growth ?? 0);
    const historyRaw = Array.isArray(item.history) ? item.history : [];

    return {
      clusterId: String(item.cluster_id ?? item.cluster ?? `cluster-${index}`),
      clusterName,
      category: String(item.category ?? item.issue_type ?? "General"),
      count,
      growthPercent: growth,
      severity: severity(item.severity),
      sentiment: sentiment(item.sentiment),
      regionsAffected: Number(item.regions_affected ?? 1),
      potentialPattern: String(item.potential_pattern ?? "Pattern detected from recent complaints."),
      firstDetected: String(item.first_detected ?? new Date().toISOString()),
      status: (lower(item.status) === "resolved" ? "resolved" : lower(item.status) === "confirmed" ? "confirmed" : "monitoring"),
      history: historyRaw.map((h: any) => ({ date: String(h.date ?? h.month ?? ""), count: Number(h.count ?? 0) })),
    };
  });
}

export async function fetchDashboardMetrics(): Promise<DashboardMetrics> {
  return withFallback(
    async () => {
      const data = await getLiveTicketData();
      return buildMetrics(data.tickets, data.intelligence);
    },
    mockDashboardMetrics,
  );
}

export async function fetchTickets(): Promise<Ticket[]> {
  return withFallback(
    async () => (await getLiveTicketData()).tickets,
    mockTickets.map(({ recommendation, ...t }) => t),
  );
}

export async function fetchTicketById(id: string): Promise<Ticket | undefined> {
  return withFallback(
    async () => (await getLiveTicketData()).tickets.find((t) => t.id === id),
    (() => {
      const ticket = getTicketById(id);
      if (!ticket) return undefined;
      const { recommendation, ...fast } = ticket;
      return fast;
    })(),
  );
}

export async function fetchRecommendationForTicket(id: string): Promise<Recommendation | undefined> {
  try {
    const result = await liveFetch<AgentOutput>(`${AGENT_URL}/agent/analyze/${encodeURIComponent(id)}`);
    const ticket = await fetchTicketById(id);

    return {
      issueType: result.issue_type,
      evidence: [
        result.reason,
        result.escalate_reason ? `Escalation: ${result.escalate_reason}` : "No human escalation required.",
        ...(result.guardrail_flags ?? []).map((flag) => `Guardrail: ${flag}`),
      ],
      confidence: result.used_llm ? 0.9 : 0.86,
      escalation: escalation(result.escalate),
      recommendedActions: [
        result.action,
        ...(result.missing_information.length
          ? [`Collect: ${result.missing_information.join(", ")}`]
          : []),
      ],
      recommendedResponse: result.customer_message,
      relatedComplaintCount: 1,
      relatedClusterId: ticket?.relatedClusterId,
      relatedClusterName: ticket?.category,
    };
  } catch {
    return getTicketById(id)?.recommendation;
  }
}

export async function fetchTrends(): Promise<Trend[]> {
  return withFallback(
    async () => mapLiveTrends((await getLiveTicketData()).intelligence),
    mockTrends,
  );
}

export async function fetchTrendById(id: string): Promise<Trend | undefined> {
  const live = await fetchTrends();
  return live.find((t) => t.clusterId === id) ?? getTrendById(id);
}

export async function fetchTicketsByCluster(clusterId: string): Promise<Ticket[]> {
  return withFallback(
    async () => (await getLiveTicketData()).tickets.filter((t) => t.relatedClusterId === clusterId),
    getTicketsByCluster(clusterId).map(({ recommendation, ...t }) => t),
  );
}

export async function fetchCustomers(): Promise<Customer[]> {
  return withFallback(
    async () => (await getLiveTicketData()).customers,
    mockCustomers,
  );
}

export async function fetchCustomerById(id: string): Promise<Customer | undefined> {
  return withFallback(
    async () => (await fetchCustomers()).find((c) => c.id === id),
    getCustomerById(id),
  );
}

export async function fetchOrders(): Promise<Order[]> {
  return withFallback(
    async () => (await getLiveTicketData()).orders,
    mockOrders,
  );
}

export async function fetchCaseHistory(): Promise<CaseHistoryEntry[]> {
  // Student 1 currently exposes complaints, not a dedicated case-history
  // endpoint. Keep the rich history dataset as the demo fallback.
  return mockCaseHistory;
}

export async function fetchSystemStatus(): Promise<{ backend: boolean; agent: boolean }> {
  const [backend, agent] = await Promise.all([
    liveFetch(`${BACKEND_URL}/`).then(() => true).catch(() => false),
    liveFetch(`${AGENT_URL}/health`).then(() => true).catch(() => false),
  ]);
  return { backend, agent };
}

export { BACKEND_URL, AGENT_URL };
