import cookie from 'js-cookie';
import { useRouter } from 'next/router';
import { useMutation } from 'react-query';

import apiInstance from '@/utils/api';

interface UseAuthMutationMutateProps {
  email: string;
  password: string;
}

const useAuthMutation = (type: 'login' | 'register') => {
  const mutationKey = type === 'login' ? 'loginUser' : 'registerUser';
  const router = useRouter();

  return useMutation(
    [mutationKey],
    async (formik: UseAuthMutationMutateProps) => {
      try {
        const { data } = await apiInstance().post(`auth/login`, formik);
        return data;
      } catch (e) {
        throw new Error(e.response.data.message);
      }
    },
    {
      onSuccess: async ({ data }) => {
        if (type === 'login') {
          cookie.set('INVT-TOKEN', data?.token, {
            expires: 2 / 48,
          });
          router.push('/');
        }
      },
    }
  );
};

export default useAuthMutation;
