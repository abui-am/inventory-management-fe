import { AxiosError, AxiosResponse } from 'axios';
import toast from 'react-hot-toast';
import { useMutation, UseMutationResult, useQueryClient } from 'react-query';

import { CreateExpensePayload } from '@/typings/expense';
import { BackendRes, BackendResError } from '@/typings/request';
import { getApiBasedOnRoles } from '@/utils/api';

import { useFetchMyself } from '../query/useFetchEmployee';

export const useCreateExpense = (): UseMutationResult<BackendRes<any>, unknown, any> => {
  const { data: dataSelf } = useFetchMyself();
  const roles = dataSelf?.data.user.roles.map(({ name }) => name);
  const query = useQueryClient();
  const mutator = useMutation(
    ['expenses'],
    async (data: CreateExpensePayload) => {
      try {
        const res = await getApiBasedOnRoles(roles ?? [], ['superadmin']).put<
          CreateExpensePayload,
          AxiosResponse<BackendRes<any>>
        >('/expenses', data);
        return res.data;
      } catch (e) {
        console.error(e);
        throw e;
      }
    },
    {
      onSuccess: (data) => {
        toast.success(data.message);
        query.invalidateQueries('expenses');
        query.invalidateQueries('ledgers');
        query.invalidateQueries('income-report');
      },
      onError: (data: AxiosError<BackendResError<unknown>>) => {
        toast.error(data.response?.data.message ?? '');
      },
    }
  );
  return mutator;
};
