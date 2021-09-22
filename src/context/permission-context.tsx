import * as React from 'react';

import { useFetchMyself } from '@/hooks/query/useFetchEmployee';
import { RolesData } from '@/typings/role';
import { getCookie } from '@/utils/cookies';

type State = { permission: PermissionList[] };
export type PermissionList = 'control:profile' | 'control:transaction' | 'control:stock' | 'control:supplier';

const PermissionContext = React.createContext<{ state: State } | undefined>(undefined);

const getPermission = (roles: RolesData[]): PermissionList[] => {
  let permission: PermissionList[] = [];

  roles.forEach((role) => {
    // eslint-disable-next-line default-case
    switch (role.id) {
      // super_admin
      case 1:
        permission = [...permission, 'control:profile', 'control:transaction', 'control:stock', 'control:supplier'];
        break;
      case 4:
        permission = [...permission, 'control:stock'];
        break;
    }
  });

  return permission;
};

const PermissionProvider: React.FC = ({ children }) => {
  const { data } = useFetchMyself({ enabled: !!getCookie('INVT-TOKEN') });
  const permissionList = getPermission(data?.data.user.roles ?? []);
  const permission = permissionList;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const uniquePermission = [...(new Set(permission) as unknown as PermissionList[])];

  const value: State = { permission: uniquePermission };
  return <PermissionContext.Provider value={{ state: value }}>{children}</PermissionContext.Provider>;
};

function usePermission() {
  const context = React.useContext(PermissionContext);
  if (context === undefined) {
    throw new Error('usePermission must be used within a PermissionProvider');
  }
  return context;
}

export { PermissionProvider, usePermission };
