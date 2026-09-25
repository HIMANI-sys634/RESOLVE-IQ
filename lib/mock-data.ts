import {
  Customer,
  Order,
  Trend,
  Ticket,
  CaseHistoryEntry,
  DashboardMetrics,
} from "./types";

// All data below is static and hand-authored (not randomly generated) so the
// server-rendered and client-rendered output always match, and so demo runs
// are reproducible. Replace each export with a real API call once the
// corresponding backend endpoint (see services/) is available.

export const customers: Customer[] = [
  { id: "CUST-4821", displayName: "Customer #4821", tier: "priority", region: "North", totalOrders: 12, totalTickets: 3, lastContact: "2026-09-24T09:12:00Z" },
  { id: "CUST-3390", displayName: "Customer #3390", tier: "standard", region: "West", totalOrders: 4, totalTickets: 2, lastContact: "2026-09-23T14:41:00Z" },
  { id: "CUST-7742", displayName: "Customer #7742", tier: "enterprise", region: "East", totalOrders: 31, totalTickets: 5, lastContact: "2026-09-24T11:03:00Z" },
  { id: "CUST-1085", displayName: "Customer #1085", tier: "standard", region: "South", totalOrders: 2, totalTickets: 1, lastContact: "2026-09-22T08:55:00Z" },
  { id: "CUST-6603", displayName: "Customer #6603", tier: "priority", region: "North", totalOrders: 9, totalTickets: 4, lastContact: "2026-09-24T07:20:00Z" },
  { id: "CUST-2214", displayName: "Customer #2214", tier: "standard", region: "West", totalOrders: 6, totalTickets: 2, lastContact: "2026-09-21T16:30:00Z" },
  { id: "CUST-8890", displayName: "Customer #8890", tier: "enterprise", region: "East", totalOrders: 22, totalTickets: 6, lastContact: "2026-09-24T10:15:00Z" },
  { id: "CUST-5567", displayName: "Customer #5567", tier: "standard", region: "South", totalOrders: 3, totalTickets: 1, lastContact: "2026-09-20T13:05:00Z" },
];

export const orders: Order[] = [
  { id: "ORD-90142", customerId: "CUST-4821", status: "cancelled", amount: 1249, item: "Wireless Router X200", placedAt: "2026-09-20T10:00:00Z" },
  { id: "ORD-90188", customerId: "CUST-3390", status: "refunded", amount: 349, item: "Broadband Setup Kit", placedAt: "2026-09-19T12:30:00Z" },
  { id: "ORD-90201", customerId: "CUST-7742", status: "delivered", amount: 8990, item: "Enterprise Mesh Bundle", placedAt: "2026-09-15T09:00:00Z" },
  { id: "ORD-90233", customerId: "CUST-1085", status: "cancelled", amount: 599, item: "Fiber Extender Kit", placedAt: "2026-09-22T08:00:00Z" },
  { id: "ORD-90260", customerId: "CUST-6603", status: "shipped", amount: 1799, item: "Router X200 Pro", placedAt: "2026-09-21T15:00:00Z" },
];

// ---------------------------------------------------------------------------
// Complaint intelligence: recurring clusters (Student 2 output)
// ---------------------------------------------------------------------------

export const trends: Trend[] = [
  {
    clusterId: "CLU-1001",
    clusterName: "Network Connectivity",
    category: "Connectivity",
    count: 47,
    growthPercent: 34,
    severity: "high",
    sentiment: "negative",
    regionsAffected: 3,
    potentialPattern: "Repeated disconnects reported after the Sept 18 firmware push, concentrated in North and West regions.",
    firstDetected: "2026-09-18T00:00:00Z",
    status: "confirmed",
    history: [
      { date: "Sep 16", count: 8 }, { date: "Sep 17", count: 11 }, { date: "Sep 18", count: 19 },
      { date: "Sep 19", count: 28 }, { date: "Sep 20", count: 34 }, { date: "Sep 21", count: 39 },
      { date: "Sep 22", count: 43 }, { date: "Sep 23", count: 47 },
    ],
  },
  {
    clusterId: "CLU-1002",
    clusterName: "Payment Failures",
    category: "Billing",
    count: 31,
    growthPercent: 21,
    severity: "high",
    sentiment: "negative",
    regionsAffected: 4,
    potentialPattern: "Payment captured but order shows cancelled — likely a gateway callback timing issue.",
    firstDetected: "2026-09-19T00:00:00Z",
    status: "confirmed",
    history: [
      { date: "Sep 16", count: 9 }, { date: "Sep 17", count: 12 }, { date: "Sep 18", count: 16 },
      { date: "Sep 19", count: 21 }, { date: "Sep 20", count: 24 }, { date: "Sep 21", count: 27 },
      { date: "Sep 22", count: 29 }, { date: "Sep 23", count: 31 },
    ],
  },
  {
    clusterId: "CLU-1003",
    clusterName: "Delayed Refunds",
    category: "Billing",
    count: 24,
    growthPercent: 16,
    severity: "medium",
    sentiment: "negative",
    regionsAffected: 2,
    potentialPattern: "Refunds initiated but not settled within SLA, mostly tied to the Payment Failures cluster.",
    firstDetected: "2026-09-20T00:00:00Z",
    status: "monitoring",
    history: [
      { date: "Sep 16", count: 4 }, { date: "Sep 17", count: 6 }, { date: "Sep 18", count: 9 },
      { date: "Sep 19", count: 14 }, { date: "Sep 20", count: 18 }, { date: "Sep 21", count: 20 },
      { date: "Sep 22", count: 22 }, { date: "Sep 23", count: 24 },
    ],
  },
  {
    clusterId: "CLU-1004",
    clusterName: "Installation Delays",
    category: "Fulfillment",
    count: 15,
    growthPercent: -6,
    severity: "medium",
    sentiment: "neutral",
    regionsAffected: 2,
    potentialPattern: "Technician scheduling backlog in South region, trending down after added slots.",
    firstDetected: "2026-09-12T00:00:00Z",
    status: "monitoring",
    history: [
      { date: "Sep 16", count: 18 }, { date: "Sep 17", count: 17 }, { date: "Sep 18", count: 17 },
      { date: "Sep 19", count: 16 }, { date: "Sep 20", count: 16 }, { date: "Sep 21", count: 15 },
      { date: "Sep 22", count: 15 }, { date: "Sep 23", count: 15 },
    ],
  },
  {
    clusterId: "CLU-1005",
    clusterName: "App Login Errors",
    category: "Account",
    count: 9,
    growthPercent: 4,
    severity: "low",
    sentiment: "neutral",
    regionsAffected: 1,
    potentialPattern: "Small cluster of session-expiry complaints after the Sept 21 app update.",
    firstDetected: "2026-09-21T00:00:00Z",
    status: "monitoring",
    history: [
      { date: "Sep 16", count: 2 }, { date: "Sep 17", count: 3 }, { date: "Sep 18", count: 4 },
      { date: "Sep 19", count: 5 }, { date: "Sep 20", count: 6 }, { date: "Sep 21", count: 8 },
      { date: "Sep 22", count: 8 }, { date: "Sep 23", count: 9 },
    ],
  },
];

// ---------------------------------------------------------------------------
// Tickets
// ---------------------------------------------------------------------------

export const tickets: Ticket[] = [
  {
    id: "TK-1048",
    customerId: "CUST-4821",
    customerName: "Customer #4821",
    orderId: "ORD-90142",
    subject: "Payment deducted, order cancelled",
    message: "Payment was deducted but the order was cancelled. I have not received any refund confirmation and I need this resolved before my next billing cycle.",
    category: "Payment Failure",
    sentiment: "negative",
    severity: "high",
    status: "investigating",
    escalation: "recommended",
    createdAt: "2026-09-24T08:10:00Z",
    updatedAt: "2026-09-24T09:40:00Z",
    relatedClusterId: "CLU-1002",
    recommendation: {
      issueType: "Payment Failure",
      evidence: [
        "18 similar complaints detected in the last 8 days",
        "Order shows two conflicting states: payment_captured and cancelled",
        "3 related complaints in the Delayed Refunds cluster reference the same order window",
      ],
      confidence: 0.92,
      escalation: "recommended",
      recommendedActions: [
        "Verify payment transaction status with the gateway",
        "Check order cancellation state against payment capture timestamp",
        "Initiate refund workflow if capture is confirmed and order remains cancelled",
      ],
      recommendedResponse:
        "Thanks for flagging this — we can see the payment was captured on your order but the order status did not update correctly on our end. We've started a refund and it should reflect in your account within 3-5 business days. We're also correcting the underlying sync issue so this doesn't happen again.",
      relatedComplaintCount: 18,
      relatedClusterId: "CLU-1002",
      relatedClusterName: "Payment Failures",
    },
  },
  {
    id: "TK-1052",
    customerId: "CUST-6603",
    customerName: "Customer #6603",
    subject: "Internet keeps disconnecting",
    message: "My internet has been dropping every 20-30 minutes since Thursday. I've restarted the router twice and it hasn't helped.",
    category: "Connectivity",
    sentiment: "negative",
    severity: "high",
    status: "investigating",
    escalation: "recommended",
    createdAt: "2026-09-24T07:05:00Z",
    updatedAt: "2026-09-24T07:50:00Z",
    relatedClusterId: "CLU-1001",
    recommendation: {
      issueType: "Network Connectivity Issue",
      evidence: [
        "47 related complaints detected across North and West regions",
        "Pattern began within hours of the Sept 18 firmware rollout",
        "Router model matches 41 of the 47 related reports",
      ],
      confidence: 0.88,
      escalation: "recommended",
      recommendedActions: [
        "Confirm device firmware version against the Sept 18 release",
        "Offer firmware rollback or patch if available",
        "Flag account for field technician follow-up if disconnects persist after patch",
      ],
      recommendedResponse:
        "We've identified an issue affecting some routers after a recent firmware update, and your device matches that pattern. We're rolling out a fix — in the meantime, we can push a temporary rollback to your router remotely if you'd like.",
      relatedComplaintCount: 47,
      relatedClusterId: "CLU-1001",
      relatedClusterName: "Network Connectivity",
    },
  },
  {
    id: "TK-1055",
    customerId: "CUST-8890",
    customerName: "Customer #8890",
    orderId: "ORD-90201",
    subject: "Refund still not received",
    message: "It has been 9 days since the refund was approved and I still haven't received it in my account.",
    category: "Refund Delay",
    sentiment: "negative",
    severity: "medium",
    status: "open",
    escalation: "none",
    createdAt: "2026-09-23T18:22:00Z",
    updatedAt: "2026-09-23T18:22:00Z",
    relatedClusterId: "CLU-1003",
    recommendation: {
      issueType: "Delayed Refund",
      evidence: [
        "24 related complaints in the Delayed Refunds cluster",
        "Refund initiated 9 days ago, exceeding the 5-day SLA",
      ],
      confidence: 0.81,
      escalation: "none",
      recommendedActions: [
        "Check refund settlement status with the payment processor",
        "Escalate to finance ops if unsettled past 10 days",
      ],
      recommendedResponse:
        "We're sorry for the delay — your refund is confirmed on our side and we're following up with the payment processor directly since it's past our usual timeline. We'll update you within 48 hours.",
      relatedComplaintCount: 24,
      relatedClusterId: "CLU-1003",
      relatedClusterName: "Delayed Refunds",
    },
  },
  {
    id: "TK-1057",
    customerId: "CUST-2214",
    customerName: "Customer #2214",
    subject: "Wi-Fi drops during video calls",
    message: "Connection is unstable specifically during video calls, drops out every few minutes.",
    category: "Connectivity",
    sentiment: "negative",
    severity: "medium",
    status: "open",
    escalation: "none",
    createdAt: "2026-09-23T11:00:00Z",
    updatedAt: "2026-09-23T11:00:00Z",
    relatedClusterId: "CLU-1001",
  },
  {
    id: "TK-1060",
    customerId: "CUST-1085",
    customerName: "Customer #1085",
    orderId: "ORD-90233",
    subject: "Installation appointment delayed twice",
    message: "My installation has been rescheduled twice now without much notice.",
    category: "Fulfillment",
    sentiment: "negative",
    severity: "medium",
    status: "investigating",
    escalation: "none",
    createdAt: "2026-09-22T09:30:00Z",
    updatedAt: "2026-09-23T10:00:00Z",
    relatedClusterId: "CLU-1004",
  },
  {
    id: "TK-1063",
    customerId: "CUST-5567",
    customerName: "Customer #5567",
    subject: "Can't log into the mobile app",
    message: "App keeps logging me out every time I close it.",
    category: "Account",
    sentiment: "neutral",
    severity: "low",
    status: "open",
    escalation: "none",
    createdAt: "2026-09-22T14:12:00Z",
    updatedAt: "2026-09-22T14:12:00Z",
    relatedClusterId: "CLU-1005",
  },
  {
    id: "TK-1066",
    customerId: "CUST-3390",
    customerName: "Customer #3390",
    orderId: "ORD-90188",
    subject: "Duplicate charge on my card",
    message: "I was charged twice for the same broadband setup kit order.",
    category: "Payment Failure",
    sentiment: "negative",
    severity: "high",
    status: "escalated",
    escalation: "escalated",
    createdAt: "2026-09-21T13:00:00Z",
    updatedAt: "2026-09-22T09:10:00Z",
    relatedClusterId: "CLU-1002",
  },
  {
    id: "TK-1070",
    customerId: "CUST-7742",
    customerName: "Customer #7742",
    subject: "Account renewal question",
    message: "Just wanted to confirm my enterprise plan renewal date.",
    category: "General Inquiry",
    sentiment: "neutral",
    severity: "low",
    status: "resolved",
    escalation: "none",
    createdAt: "2026-09-20T10:00:00Z",
    updatedAt: "2026-09-20T10:40:00Z",
  },
];

// ---------------------------------------------------------------------------
// Case history
// ---------------------------------------------------------------------------

export const caseHistory: CaseHistoryEntry[] = [
  { id: "CASE-501", ticketId: "TK-1066", issue: "Duplicate charge", actionTaken: "Refund issued for duplicate transaction", recommendation: "Refund duplicate charge, flag for gateway review", escalation: "escalated", resolution: "resolved", timestamp: "2026-09-22T09:10:00Z" },
  { id: "CASE-500", ticketId: "TK-1070", issue: "Renewal question", actionTaken: "Provided renewal date and plan details", recommendation: "Answer directly, no escalation needed", escalation: "none", resolution: "resolved", timestamp: "2026-09-20T10:40:00Z" },
  { id: "CASE-499", ticketId: "TK-1060", issue: "Installation delay", actionTaken: "Rebooked with priority slot", recommendation: "Escalate to field ops if delayed a third time", escalation: "none", resolution: "pending", timestamp: "2026-09-23T10:00:00Z" },
  { id: "CASE-498", ticketId: "TK-1055", issue: "Delayed refund", actionTaken: "Followed up with payment processor", recommendation: "Escalate to finance ops if unsettled past 10 days", escalation: "none", resolution: "pending", timestamp: "2026-09-23T18:22:00Z" },
  { id: "CASE-497", ticketId: "TK-1052", issue: "Network disconnects", actionTaken: "Pushed firmware rollback remotely", recommendation: "Monitor for recurrence, offer technician visit if unresolved", escalation: "recommended", resolution: "pending", timestamp: "2026-09-24T07:50:00Z" },
  { id: "CASE-496", ticketId: "TK-1048", issue: "Payment/order mismatch", actionTaken: "Refund initiated pending gateway confirmation", recommendation: "Verify capture status, initiate refund", escalation: "recommended", resolution: "pending", timestamp: "2026-09-24T09:40:00Z" },
];

// ---------------------------------------------------------------------------
// Dashboard metrics
// ---------------------------------------------------------------------------

export const dashboardMetrics: DashboardMetrics = {
  totalConversations: 1284,
  totalConversationsDelta: 8,
  activeCases: 96,
  activeCasesDelta: 12,
  highSeverityCases: 21,
  highSeverityDelta: 34,
  escalations: 7,
  escalationsDelta: -3,
  resolutionRate: 0.87,
  slaCompliance: 0.91,
  volumeTrend: [
    { date: "Sep 16", count: 132 }, { date: "Sep 17", count: 141 }, { date: "Sep 18", count: 158 },
    { date: "Sep 19", count: 176 }, { date: "Sep 20", count: 169 }, { date: "Sep 21", count: 183 },
    { date: "Sep 22", count: 192 }, { date: "Sep 23", count: 201 },
  ],
  categoryDistribution: [
    { category: "Connectivity", count: 47 },
    { category: "Billing", count: 55 },
    { category: "Fulfillment", count: 15 },
    { category: "Account", count: 9 },
    { category: "General", count: 22 },
  ],
  sentimentDistribution: [
    { sentiment: "negative", count: 612 },
    { sentiment: "neutral", count: 498 },
    { sentiment: "positive", count: 174 },
  ],
  severityDistribution: [
    { severity: "critical", count: 4 },
    { severity: "high", count: 17 },
    { severity: "medium", count: 38 },
    { severity: "low", count: 37 },
  ],
  escalationTrend: [
    { date: "Sep 16", count: 3 }, { date: "Sep 17", count: 4 }, { date: "Sep 18", count: 6 },
    { date: "Sep 19", count: 9 }, { date: "Sep 20", count: 8 }, { date: "Sep 21", count: 10 },
    { date: "Sep 22", count: 9 }, { date: "Sep 23", count: 7 },
  ],
};

export function getCustomerById(id: string): Customer | undefined {
  return customers.find((c) => c.id === id);
}

export function getTicketById(id: string): Ticket | undefined {
  return tickets.find((t) => t.id === id);
}

export function getTrendById(id: string): Trend | undefined {
  return trends.find((t) => t.clusterId === id);
}

export function getTicketsByCluster(clusterId: string): Ticket[] {
  return tickets.filter((t) => t.relatedClusterId === clusterId);
}
