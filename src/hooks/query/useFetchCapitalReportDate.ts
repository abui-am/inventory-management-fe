import { UseQueryOptions, UseQueryResult } from 'react-query';

import { CapitalReportDateReport, CapitalReportsInfoResponse } from '@/typings/capital-report';
import { BackendRes } from '@/typings/request';
import { apiInstanceWithoutBaseUrl, getApiBasedOnRoles } from '@/utils/api';

import { useFetchMyself } from './useFetchEmployee';
import useMyQuery from './useMyQuery';

const useFetchCapitalReportDates = <TQueryFnData = unknown, TError = unknown>(
  data: Partial<{
    forceUrl: string;
    paginated: boolean;
    per_page: number;
    search: string;
    trashed: string;
    order_by: Record<string, string>;
    where: Record<string, unknown>;
    where_greater_equal: Record<string, unknown>;
  }> = {},
  options?: UseQueryOptions<TQueryFnData, TError, BackendRes<CapitalReportDateReport>>
): UseQueryResult<BackendRes<CapitalReportDateReport>> => {
  const { data: dataSelf } = useFetchMyself();
  const roles = dataSelf?.data.user.roles.map(({ name }) => name);
  const fetcher = useMyQuery(
    ['capital-report-dates', data, roles],
    async () => {
      const res = data.forceUrl
        ? await apiInstanceWithoutBaseUrl().get(data.forceUrl)
        : await getApiBasedOnRoles(roles ?? [], ['superadmin', 'admin']).get('/capital-report/report-date');
      return res.data;
    },
    options
  );

  return fetcher;
};

const useFetchCapitalReportInfo = <TQueryFnData = unknown, TError = unknown>(
  data: Partial<{
    start_date: string;
    end_date: string;
  }> = {},
  options?: UseQueryOptions<TQueryFnData, TError, BackendRes<CapitalReportsInfoResponse>>
): UseQueryResult<BackendRes<CapitalReportsInfoResponse>> => {
  const { data: dataSelf } = useFetchMyself();
  const roles = dataSelf?.data.user.roles.map(({ name }) => name);
  const fetcher = useMyQuery(
    ['capital-report', data, roles],
    async () => {
      const res = await getApiBasedOnRoles(roles ?? [], ['superadmin', 'admin']).post('/capital-report', data);
      return res.data;
    },
    options
  );

  return fetcher;
};

export { useFetchCapitalReportDates, useFetchCapitalReportInfo };
