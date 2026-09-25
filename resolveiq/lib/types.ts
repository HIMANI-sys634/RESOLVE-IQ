// ---------------------------------------------------------------------------
// Shared data contract. These types mirror the fields the backend (Student 1),
// the NLP/clustering service (Student 2), and the resolution agent
// (Student 3) will eventually return. Keep this file as the single source of
// truth — services/ and mock data both depend on it.
// ---------------------------------------------------------------------------

export type Severity = "low" | "medium" | "high" | "critical";
export type Sentiment = "positive" | "neutral" | "negative";
export type TicketStatus = "open" | "investigating" | "resolved" | "escalated";
export type EscalationState = "none" | "recommended" | "escalated";

export interface Customer {
  id: string;
  displayName: string; // generic demo identifier, e.g. "Customer #4821"
  tier: "standard" | "priority" | "enterprise";
  region: string;
  totalOrders: number;
  totalTickets: number;
  lastContact: string; // ISO date
}

export interface Order {
  id: string;
  customerId: string;
  status: "placed" | "shipped" | "delivered" | "cancelled" | "refunded";
  amount: number;
  item: string;
  placedAt: string; // ISO date
}

export interface Complaint {
  id: string;
  customerId: string;
  orderId?: string;
  text: string;
  category: string;
  createdAt: string; // ISO date
}

/** Output produced by Student 2's NLP + clustering pipeline. */
export interface ComplaintAnalysis {
  complaintId: string;
  category: string;
  sentiment: Sentiment;
  severity: Severity;
  confidence: number; // 0-1
  clusterId?: string;
}

/** A recurring pattern detected across many complaints. */
export interface Trend {
  clusterId: string;
  clusterName: string;
  category: string;
  count: number;
  growthPercent: number;
  severity: Severity;
  sentiment: Sentiment;
  regionsAffected: number;
  potentialPattern: string;
  firstDetected: string; // ISO date
  status: "monitoring" | "confirmed" | "resolved";
  history: { date: string; count: number }[];
}

/** Output produced by Student 3's resolution agent. */
export interface Recommendation {
  issueType: string;
  evidence: string[];
  confidence: number; // 0-1
  escalation: EscalationState;
  recommendedActions: string[];
  recommendedResponse: string;
  relatedComplaintCount: number;
  relatedClusterId?: string;
  relatedClusterName?: string;
}

export interface Ticket {
  id: string;
  customerId: string;
  /**
   * Denormalized display name for the ticket list, the way a real ticket-list
   * endpoint would already join it server-side rather than making the UI
   * fetch every customer to render a table. Falls back to customerId when
   * absent so the UI never breaks if a backend omits it.
   */
  customerName?: string;
  orderId?: string;
  subject: string;
  message: string;
  category: string;
  sentiment: Sentiment;
  severity: Severity;
  status: TicketStatus;
  escalation: EscalationState;
  createdAt: string; // ISO date
  updatedAt: string; // ISO date
  relatedClusterId?: string;
  recommendation?: Recommendation;
}

export interface CaseHistoryEntry {
  id: string;
  ticketId: string;
  issue: string;
  actionTaken: string;
  recommendation: string;
  escalation: EscalationState;
  resolution: "resolved" | "pending" | "reopened";
  timestamp: string; // ISO date
}

export interface DashboardMetrics {
  totalConversations: number;
  totalConversationsDelta: number;
  activeCases: number;
  activeCasesDelta: number;
  highSeverityCases: number;
  highSeverityDelta: number;
  escalations: number;
  escalationsDelta: number;
  resolutionRate: number; // 0-1
  slaCompliance: number; // 0-1
  volumeTrend: { date: string; count: number }[];
  categoryDistribution: { category: string; count: number }[];
  sentimentDistribution: { sentiment: Sentiment; count: number }[];
  severityDistribution: { severity: Severity; count: number }[];
  escalationTrend: { date: string; count: number }[];
}

export type AsyncState<T> =
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "empty" }
  | { status: "ready"; data: T };
