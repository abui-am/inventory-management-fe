import { AxiosError } from 'axios';
import cookie from 'js-cookie';
import { useRouter } from 'next/router';
import toast from 'react-hot-toast';
import { useMutation, useQueryClient } from 'react-query';

import { BackendResError } from '@/typings/request';
import apiInstance, { apiInstanceAdmin } from '@/utils/api';

interface UseAuthMutationMutateProps {
  email: string;
  password: string;
  rememberMe: boolean;
}

export type CreateAccountReqBody = {
  employee_id: string;
  username: string;
  password: string;
  password_confirmation: string;
  roles: (string | undefined)[];
};

export type ForgotPasswordReqBody = {
  email: string;
};

export type ResetPasswordReqBody = {
  token: string;
  password: string;
  password_confirmation: string;
};

const useAuthMutation = (type: 'login' | 'register') => {
  const mutationKey = type === 'login' ? 'loginUser' : 'registerUser';
  const router = useRouter();
  const queryClient = useQueryClient();

  return useMutation(
    [mutationKey],
    async (formik: UseAuthMutationMutateProps) => {
      const { rememberMe, ...jsonBody } = formik;
      const { data } = await apiInstance().post(`auth/login`, jsonBody);
      return { ...data, rememberMe };
    },
    {
      onSuccess: async ({ data, status_code, message }) => {
        if (type === 'login' && status_code === 200 && data.access_token) {
          cookie.set('INVT-TOKEN', data.access_token, {
            expires: data?.rememberMe ? 30 : 1,
          });
          cookie.set('INVT-USERID', data.user.id, {
            expires: data?.rememberMe ? 30 : 1,
          });
          cookie.set('INVT-USERNAME', data.user.username, {
            expires: data?.rememberMe ? 30 : 1,
          });
          queryClient.invalidateQueries();
          toast.success(message);
          router.push('/');
        }
      },
      onError: (e: AxiosError<BackendResError<unknown>>) => {
        console.error(e, 'ERROR');
        toast.error(e.response?.data.message ?? '');
      },
    }
  );
};

const useCreateAccount = () => {
  return useMutation(
    ['createUser'],
    async (formik: CreateAccountReqBody) => {
      try {
        const { data } = await apiInstanceAdmin().put(`users`, formik);
        return data;
      } catch (e) {
        console.error(e);
        throw e;
      }
    },
    {
      onSuccess: async ({ message }) => {
        toast.success(message);
      },
      onError: (e: AxiosError<BackendResError<unknown>>) => {
        toast.error(e.response?.data.message ?? '');
      },
    }
  );
};

const useForgotPassword = () => {
  return useMutation(
    ['forgotPassword'],
    async (formik: ForgotPasswordReqBody) => {
      try {
        const { data } = await apiInstance().post(`/auth/forgot`, formik);
        return data;
      } catch (e) {
        console.error(e);
        throw e;
      }
    },
    {
      onSuccess: async ({ msg }) => {
        toast.success(msg);
      },
      onError: (e: AxiosError<{ msg: string } & BackendResError<unknown>>) => {
        toast.error(e.response?.data.msg ?? e.response?.data.message ?? '');
      },
    }
  );
};

const useResetPassword = () => {
  const router = useRouter();
  return useMutation(
    ['resetPassword'],
    async (formik: ResetPasswordReqBody) => {
      try {
        const { data } = await apiInstance().post(`/auth/reset`, formik);
        return data;
      } catch (e) {
        console.error(e);
        throw e;
      }
    },
    {
      onSuccess: async ({ msg }) => {
        toast.success(msg);
        router.push('/login');
      },
      onError: (e: AxiosError<{ msg: string } & BackendResError<unknown>>) => {
        toast.error(e.response?.data.msg ?? e.response?.data.message ?? '');
      },
    }
  );
};

export { useCreateAccount, useForgotPassword, useResetPassword };
export default useAuthMutation;
