import { AxiosError, AxiosResponse } from 'axios';
import toast from 'react-hot-toast';
import { useMutation, UseMutationResult, useQueryClient } from 'react-query';

import { BackendRes, BackendResError } from '@/typings/request';
import { CreateSaleBody, CreateSaleResponse } from '@/typings/sale';
import { CreateStockInBody } from '@/typings/stock-in';
import { apiInstanceAdmin, getApiBasedOnRoles } from '@/utils/api';

import keys from '../keys';
import { useFetchMyself } from '../query/useFetchEmployee';

export const useCreateSale = (): UseMutationResult<
  BackendRes<CreateSaleResponse>,
  unknown,
  CreateSaleBody,
  unknown
> => {
  const query = useQueryClient();
  const { data: dataSelf } = useFetchMyself();
  const roles = dataSelf?.data.user.roles.map(({ name }) => name);
  const mutator = useMutation(
    [keys.sales, 'create'],
    async (data: CreateSaleBody) => {
      try {
        const res = await getApiBasedOnRoles(roles ?? [], ['superadmin', 'admin']).put<
          CreateSaleBody,
          AxiosResponse<BackendRes<CreateSaleResponse>>
        >('/transactions', data);
        return res.data;
      } catch (e) {
        console.error(e);
        throw e;
      }
    },
    {
      onSuccess: (data) => {
        toast.success(data.message);
        query.invalidateQueries(keys.sales);
        query.invalidateQueries(keys.transactions);
        query.invalidateQueries(keys.ledgers);
        query.invalidateQueries(keys.ledgerTopUp);
        query.invalidateQueries(keys.incomeReport);
      },
      onError: (data: AxiosError<BackendResError<unknown>>) => {
        toast.error(data.response?.data.message ?? '');
      },
    }
  );
  return mutator;
};

export const useUpdateSale = (): UseMutationResult<
  Omit<BackendRes<CreateSaleResponse>, 'data'>,
  unknown,
  {
    transactionId: string;
    data: unknown;
  },
  unknown
> => {
  const queryClient = useQueryClient();

  const mutator = useMutation(
    [keys.sales, 'edit'],
    async (data: { transactionId: string; data: unknown }) => {
      try {
        const res = await apiInstanceAdmin().patch<CreateStockInBody, AxiosResponse<BackendRes<unknown>>>(
          `/transactions/${data.transactionId}`,
          data.data
        );
        return res.data;
      } catch (e) {
        console.error(e);
        throw e;
      }
    },
    {
      onSuccess: (data) => {
        toast.success(data.message);
        queryClient.invalidateQueries(keys.sales);
        queryClient.invalidateQueries(keys.transactions);
        queryClient.invalidateQueries(keys.ledgers);
        queryClient.invalidateQueries(keys.ledgerTopUp);
        queryClient.invalidateQueries(keys.incomeReport);
        queryClient.invalidateQueries(keys.capitalReport);
      },
      onError: (data: AxiosError<BackendResError<unknown>>) => {
        toast.error(data.response?.data.message ?? '');
      },
    }
  );
  return mutator;
};
