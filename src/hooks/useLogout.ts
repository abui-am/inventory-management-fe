import { useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/router';

import { removeCookie } from '@/utils/cookies';

const useLogout = () => {
  const query = useQueryClient();
  const { push } = useRouter();
  function logout() {
    removeCookie('INVT-TOKEN');
    removeCookie('INVT-USERID');
    removeCookie('INVT-USERNAME');
    query.invalidateQueries();
    push('/login');
  }
  return logout;
};

export default useLogout;
