import { useMutation, UseMutationResult, useQueryClient } from '@tanstack/react-query';
import { AxiosError, AxiosResponse } from 'axios';
import toast from 'react-hot-toast';

import { CreateAdvancePayrollsPayload } from '@/typings/advance-payrolls';
import { BackendRes, BackendResError } from '@/typings/request';
import { CreateSaleBody } from '@/typings/sale';
import { apiInstanceAdmin } from '@/utils/api';

import keys from '../keys';

export const useCreateAdvancePayrolls = (): UseMutationResult<
  BackendRes<any>,
  unknown,
  CreateAdvancePayrollsPayload,
  unknown
> => {
  const query = useQueryClient();
  const mutator = useMutation(
    [keys.advancePayrolls, 'create'],
    async (data: CreateAdvancePayrollsPayload) => {
      const res = await apiInstanceAdmin().put<CreateSaleBody, AxiosResponse<BackendRes<any>>>(
        '/advance-payrolls',
        data
      );
      return res.data;
    },
    {
      onSuccess: (data) => {
        toast.success(data.message);
        query.invalidateQueries([keys.salary]);
        query.invalidateQueries([keys.ledgers]);
        query.invalidateQueries([keys.ledgerAccounts]);
        query.invalidateQueries([keys.incomeReport]);
        query.invalidateQueries([keys.advancePayrolls]);
        query.invalidateQueries([keys.capitalReport]);
      },
      onError: (data: AxiosError<BackendResError<unknown>>) => {
        toast.error(data.response?.data.message ?? '');
      },
    }
  );
  return mutator;
};
