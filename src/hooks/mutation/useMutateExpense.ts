import { useMutation, UseMutationResult, useQueryClient } from '@tanstack/react-query';
import { AxiosError, AxiosResponse } from 'axios';
import toast from 'react-hot-toast';

import { CreateExpensePayload } from '@/typings/expense';
import { BackendRes, BackendResError } from '@/typings/request';
import { getApiBasedOnRoles } from '@/utils/api';

import keys from '../keys';
import { useFetchMyself } from '../query/useFetchEmployee';

export const useCreateExpense = (): UseMutationResult<BackendRes<any>, unknown, any> => {
  const { data: dataSelf } = useFetchMyself();
  const roles = dataSelf?.data.user.roles.map(({ name }) => name);
  const query = useQueryClient();
  const mutator = useMutation(
    [keys.expenses],
    async (data: CreateExpensePayload) => {
      const res = await getApiBasedOnRoles(roles ?? [], ['superadmin']).put<
        CreateExpensePayload,
        AxiosResponse<BackendRes<any>>
      >('/expenses', data);
      return res.data;
    },
    {
      onSuccess: (data) => {
        toast.success(data.message);
        query.invalidateQueries([keys.expenses]);
        query.invalidateQueries([keys.ledgers]);
        query.invalidateQueries([keys.incomeReport]);
        query.invalidateQueries([keys.capitalReport]);
      },
      onError: (data: AxiosError<BackendResError<unknown>>) => {
        toast.error(data.response?.data.message ?? '');
      },
    }
  );
  return mutator;
};
