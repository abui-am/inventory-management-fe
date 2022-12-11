import * as React from 'react';

import { useFetchMyself } from '@/hooks/query/useFetchEmployee';
import { RolesData } from '@/typings/role';
import { getCookie } from '@/utils/cookies';

type State = { permission: PermissionList[]; roles: RolesData[] };
export type PermissionList =
  | 'view:home'
  | 'control:profile'
  | 'control:transaction'
  | 'control:stock'
  | 'control:supplier'
  | 'control:stock.confirmation'
  | 'control:stock.adjust-sell-price'
  | 'control:item'
  | 'control:audit'
  | 'view:audit'
  | 'view:monthly-salary'
  | 'control:advance-payrolls'
  | 'control:prive'
  | 'control:debt'
  | 'control:debt-giro'
  | 'control:account-receivable'
  | 'control:general-ledger'
  | 'control:ledger'
  | 'control:customer'
  | 'control:convert-balance'
  | 'control:expense'
  | 'control:income-report'
  | 'control:capital-change-report';

const PermissionContext = React.createContext<{ state: State } | undefined>(undefined);

const getPermission = (roles: RolesData[]): PermissionList[] => {
  let permission: PermissionList[] = [];

  roles.forEach((role) => {
    // eslint-disable-next-line default-case
    switch (role.id) {
      // super_admin
      case 1:
        permission = [
          ...permission,
          'control:profile',
          'control:transaction',
          'control:stock',
          'control:supplier',
          'control:stock.confirmation',
          'control:stock.adjust-sell-price',
          'control:item',
          'control:audit',
          'view:audit',
          'view:home',
          'view:monthly-salary',
          'control:advance-payrolls',
          'control:prive',
          'control:debt-giro',
          'control:debt',
          'control:account-receivable',
          'control:general-ledger',
          'control:ledger',
          'control:customer',
          'control:convert-balance',
          'control:expense',
          'control:income-report',
          'control:capital-change-report',
        ];
        break;

      // admin
      case 2:
        permission = [...permission, 'control:transaction', 'control:stock', 'control:supplier'];
        break;
      case 4:
        permission = [...permission, 'control:stock.confirmation', 'control:audit'];
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

  const value: State = { permission: uniquePermission, roles: data?.data.user.roles ?? [] };
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
