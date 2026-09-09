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
  | 'control:income-user-report'
  | 'control:capital-change-report';

const PermissionContext = React.createContext<{ state: State } | undefined>(undefined);

const getPermission = (roles: RolesData[]): PermissionList[] => {
  let permission: PermissionList[] = [];

  roles.forEach((role) => {
    // eslint-disable-next-line default-case
    switch (role.name) {
      // super_admin
      case 'superadmin':
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
          'control:income-user-report',
          'control:capital-change-report',
        ];
        break;

      // admin
      case 'admin':
        permission = [...permission, 'control:transaction', 'control:stock', 'control:supplier'];
        break;
      default:
        permission = [...permission, 'control:stock.confirmation', 'control:audit'];
        break;
    }
  });

  return permission;
};

const PermissionProvider: React.FC = ({ children }) => {
  const { data } = useFetchMyself({ enabled: !!getCookie('INVT-TOKEN') });

  const roles = data?.data.user.roles;

  // Provider ini membungkus seluruh app. Tanpa memo, getPermission() + Set + objek value
  // dihitung ulang tiap render dan memaksa semua consumer usePermission() ikut re-render.
  const value = React.useMemo<{ state: State }>(() => {
    const rolesList = roles ?? [];
    return {
      state: {
        permission: Array.from(new Set(getPermission(rolesList))),
        roles: rolesList,
      },
    };
  }, [roles]);

  return <PermissionContext.Provider value={value}>{children}</PermissionContext.Provider>;
};

function usePermission() {
  const context = React.useContext(PermissionContext);
  if (context === undefined) {
    throw new Error('usePermission must be used within a PermissionProvider');
  }
  return context;
}

export { PermissionProvider, usePermission };
