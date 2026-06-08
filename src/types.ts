export interface TMetricAccount {
  id: number;
  name: string;
}

export interface TMetricUser {
  id: number;
  name: string;
  email: string;
  activeAccountId?: number;
  accounts?: TMetricAccount[];
}

export interface TMetricProject {
  id: number;
  name: string;
  accountId?: number;
  clientId?: number;
  clientName?: string;
  status?: string;
  isBillable?: boolean;
}

export interface TMetricTask {
  id: number;
  name: string;
  description?: string;
  projectId?: number;
  projectName?: string;
  externalIssueId?: string;
  externalIssueUrl?: string;
  isCompleted?: boolean;
  relativeName?: string;
}

export interface TMetricTag {
  id: number;
  name: string;
  accountId?: number;
}

export interface TMetricTimeEntry {
  id: number;
  accountId?: number;
  userId?: number;
  /** ISO datetime without offset: YYYY-MM-DDTHH:mm:ss. null = now (running). */
  startTime: string | null;
  /** ISO datetime without offset: YYYY-MM-DDTHH:mm:ss. null = running timer. */
  endTime: string | null;
  note?: string;
  isBillable?: boolean;
  isInvoiced?: boolean;
  project?: { id: number; name?: string };
  task?: { id: number; name?: string };
  tags?: Array<{ id: number; name?: string }>;
}

export interface TMetricTeam {
  id: number;
  name: string;
  accountId?: number;
}

export interface TMetricProjectsReport {
  projectId?: number;
  projectName?: string;
  clientId?: number;
  clientName?: string;
  totalTime?: number;
  billableTime?: number;
  [key: string]: unknown;
}

export interface TMetricProfitabilityReport {
  [key: string]: unknown;
}
