import { Link } from './common';

export type ReportDateData = {
  report_date: string;
};

export interface ReportDates {
  current_page: number;
  data: ReportDateData[];
  first_page_url: string;
  from: number;
  last_page: number;
  last_page_url: string;
  links: Link[];
  next_page_url?: string;
  path: string;
  per_page: number;
  prev_page_url?: string;
  to: number;
  total: number;
}

export interface CapitalReportDateReport {
  report_dates: ReportDates;
}

export type CapitalReportData = {
  title: 'Laba Ditahan' | 'Modal Awal' | 'Laba Diambil Owner' | 'Prive' | 'Modal Awal' | 'Modal Disetor';
  amount: 0;
};

export interface CapitalReportsInfoResponse {
  capital_reports: CapitalReportData[];
}

export type CreateCapitalReportPayload = {
  taken_profit: number;
};
