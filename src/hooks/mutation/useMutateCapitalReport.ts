import { useMutation, UseMutationResult, useQueryClient } from '@tanstack/react-query';
import { AxiosError, AxiosResponse } from 'axios';
import toast from 'react-hot-toast';

import { CreateCapitalReportPayload } from '@/typings/capital-report';
import { BackendRes, BackendResError } from '@/typings/request';
import { getApiBasedOnRoles } from '@/utils/api';

import keys from '../keys';
import { useFetchMyself } from '../query/useFetchEmployee';

export const useCreateCapitalReport = (): UseMutationResult<BackendRes<any>, any, CreateCapitalReportPayload> => {
  const { data: dataSelf } = useFetchMyself();
  const roles = dataSelf?.data.user.roles.map(({ name }) => name);
  const query = useQueryClient();
  const mutator = useMutation(
    [keys.capitalReport, 'save'],
    async (data: CreateCapitalReportPayload) => {
      const res = await getApiBasedOnRoles(roles ?? [], ['superadmin', 'admin']).patch<
        CreateCapitalReportPayload,
        AxiosResponse<BackendRes<CreateCapitalReportPayload>>
      >('/capital-report/save-report', data);
      return res.data;
    },
    {
      onSuccess: (data) => {
        toast.success(data.message);
        query.invalidateQueries([keys.ledgers]);
        query.invalidateQueries([keys.capitalReport]);
        query.invalidateQueries([keys.capitalReport]);
      },
      onError: (data: AxiosError<BackendResError<unknown>>) => {
        toast.error(data.response?.data.message ?? '');
      },
    }
  );
  return mutator;
};
