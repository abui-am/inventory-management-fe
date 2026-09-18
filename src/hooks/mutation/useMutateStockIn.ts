import { useMutation, UseMutationResult, useQueryClient } from '@tanstack/react-query';
import { AxiosError, AxiosResponse } from 'axios';
import toast from 'react-hot-toast';

import { BackendRes, BackendResError } from '@/typings/request';
import { CreateStockInBody, ReturnStockInBody, TransactionData } from '@/typings/stock-in';
import { apiInstanceAdmin, getApiBasedOnRoles } from '@/utils/api';

import keys from '../keys';
import { useFetchMyself } from '../query/useFetchEmployee';

export const useCreateStockIn = (): UseMutationResult<
  Omit<BackendRes<unknown>, 'data'>,
  unknown,
  CreateStockInBody,
  unknown
> => {
  const { data: dataSelf } = useFetchMyself();
  const roles = dataSelf?.data.user.roles.map(({ name }) => name);
  const query = useQueryClient();
  const mutator = useMutation(
    [keys.transactions, 'stock-in'],
    async (data: CreateStockInBody) => {
      const res = await getApiBasedOnRoles(roles ?? [], ['superadmin', 'admin']).put<
        CreateStockInBody,
        AxiosResponse<BackendRes<unknown>>
      >('/transactions', data);
      return res.data;
    },
    {
      onSuccess: (data) => {
        query.invalidateQueries([keys.sales]);
        query.invalidateQueries([keys.transactions]);
        query.invalidateQueries([keys.ledgers]);
        query.invalidateQueries([keys.ledgerTopUp]);
        query.invalidateQueries([keys.incomeReport]);
        query.invalidateQueries([keys.capitalReport]);
        toast.success(data.message);
      },
      onError: (data: AxiosError<BackendResError<unknown>>) => {
        toast.error(data.response?.data.message ?? '');
      },
    }
  );
  return mutator;
};

export const useUpdateStockIn = (): UseMutationResult<
  Omit<BackendRes<unknown>, 'data'>,
  unknown,
  {
    transactionId: string;
    data: Partial<
      Pick<TransactionData, 'status'> & {
        items?: { id: string; sell_price: number }[];
      }
    >;
  },
  unknown
> => {
  const queryClient = useQueryClient();
  const { data: dataSelf } = useFetchMyself();
  const roles = dataSelf?.data.user.roles.map(({ name }) => name);
  const mutator = useMutation(
    ['createStockin'],
    async (data: {
      transactionId: string;
      data: Partial<
        Pick<TransactionData, 'status'> & {
          items?: { id: string; sell_price: number }[];
        }
      >;
    }) => {
      const res = await getApiBasedOnRoles(roles ?? [], ['superadmin', 'warehouse-admin']).patch<
        CreateStockInBody,
        AxiosResponse<BackendRes<unknown>>
      >(`/transactions/${data.transactionId}`, data.data);
      return res.data;
    },
    {
      onSuccess: (data) => {
        toast.success(data.message);
        queryClient.invalidateQueries(['transactions']);
        queryClient.invalidateQueries([keys.items]);
      },
      onError: (data: AxiosError<BackendResError<unknown>>) => {
        toast.error(data.response?.data.message ?? '');
      },
    }
  );
  return mutator;
};

/**
 * Retur barang masuk — sebagian atau seluruh barang dikembalikan ke supplier.
 *
 * Hanya lewat instance superadmin: seperti pembatalan penjualan, aksinya mengurangi stok
 * dan menulis jurnal, jadi rutenya memang hanya ada di prefix superadmin.
 */
export const useReturnStockIn = (): UseMutationResult<
  Omit<BackendRes<unknown>, 'data'>,
  unknown,
  { transactionId: string } & ReturnStockInBody,
  unknown
> => {
  const queryClient = useQueryClient();

  const mutator = useMutation(
    [keys.transactions, 'return'],
    async ({ transactionId, ...body }: { transactionId: string } & ReturnStockInBody) => {
      const res = await apiInstanceAdmin().patch<ReturnStockInBody, AxiosResponse<BackendRes<unknown>>>(
        `/transactions/${transactionId}/return`,
        body
      );
      return res.data;
    },
    {
      onSuccess: (data) => {
        toast.success(data.message);
        queryClient.invalidateQueries([keys.transactions]);
        queryClient.invalidateQueries([keys.items]);
        queryClient.invalidateQueries([keys.ledgers]);
        queryClient.invalidateQueries([keys.ledgerAccounts]);
        queryClient.invalidateQueries([keys.debts]);
        queryClient.invalidateQueries([keys.incomeReport]);
        queryClient.invalidateQueries([keys.capitalReport]);
      },
      onError: (data: AxiosError<BackendResError<unknown>>) => {
        toast.error(data.response?.data.message ?? '');
      },
    }
  );
  return mutator;
};
