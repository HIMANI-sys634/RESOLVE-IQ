import { DashboardMetrics, TrendCluster } from '../types';
import { api } from './api';
import { complaintService } from './complaints';
import { caseService } from './cases';

interface IntelligenceResponse {
  analyzed_complaints: any[];
  trends: any[];
  emerging_issues: any[];
  clusters: any[];
  metadata: any;
  diagnostics: { warnings: string[]; errors: string[] };
}

function mapTrendCluster(t: any): TrendCluster {
  return {
    cluster_name: t.cluster_name || t.issue_type || 'Unknown',
    count: t.count || 0,
    growth_percent: t.growth_percent || 0,
    severity: t.severity || 'Low',
    category: t.category || t.cluster_name || 'General',
    representative_complaints: t.representative_complaints || [],
    hypotheses: t.hypotheses || [],
    history_7d: t.history_7d || [],
    history_30d: t.history_30d || [],
    history_90d: t.history_90d || [],
  };
}

export const analyticsService = {
  async getDashboardMetrics(): Promise<DashboardMetrics> {
    try {
      const complaints = await complaintService.getComplaints();
      const cases = await caseService.getCases();

      const total_tickets = complaints.length;
      const open_tickets = complaints.filter(c => c.status !== 'Resolved' && c.status !== 'Escalated').length;
      const high_severity_count = complaints.filter(c => c.severity === 'High' || c.severity === 'Critical').length;
      const escalation_count = cases.filter(c => c.complaint.status === 'Escalated').length;
      const resolved_today_count = cases.filter(c => {
        const updated = new Date(c.updated_at);
        const today = new Date();
        return updated.toDateString() === today.toDateString() && c.complaint.status === 'Resolved';
      }).length;

      const resolvedCases = cases.filter(c => c.complaint.status === 'Resolved');
      const avg_resolution_time_hours = resolvedCases.length > 0
        ? resolvedCases.reduce((sum, c) => {
            const created = new Date(c.created_at).getTime();
            const updated = new Date(c.updated_at).getTime();
            return sum + (updated - created) / (1000 * 60 * 60);
          }, 0) / resolvedCases.length
        : 0;

      const last7Days = Array.from({ length: 7 }, (_, i) => {
        const date = new Date();
        date.setDate(date.getDate() - i);
        return date.toISOString().split('T')[0];
      }).reverse();

      const weekly_trend = last7Days.map(date => ({
        date,
        count: complaints.filter(c => c.timestamp.startsWith(date)).length,
        previous_count: 0,
      }));

      return {
        total_tickets,
        open_tickets,
        high_severity_count,
        escalation_count,
        resolved_today_count,
        avg_resolution_time_hours: Math.round(avg_resolution_time_hours * 10) / 10,
        ticket_volume_growth_pct: 0,
        weekly_trend,
      };
    } catch {
      return {
        total_tickets: 0,
        open_tickets: 0,
        high_severity_count: 0,
        escalation_count: 0,
        resolved_today_count: 0,
        avg_resolution_time_hours: 0,
        ticket_volume_growth_pct: 0,
        weekly_trend: [],
      };
    }
  },

  async getTrends(): Promise<TrendCluster[]> {
    try {
      const complaints = await complaintService.getComplaints();
      if (complaints.length === 0) return [];

      const intelligenceResponse = await api.post<IntelligenceResponse>('/intelligence/analyze', complaints);
      if (intelligenceResponse.error) throw new Error(intelligenceResponse.error);
      const intelligence = intelligenceResponse.data;

      if (!intelligence?.trends) return [];

      return intelligence.trends.map(mapTrendCluster);
    } catch {
      return [];
    }
  },

  async getTrendByName(name: string): Promise<TrendCluster | null> {
    const trends = await this.getTrends();
    const found = trends.find((t) => t.cluster_name.toLowerCase() === name.toLowerCase());
    return found || null;
  },
};