import clsx from 'clsx';
import Link from 'next/link';

import MENU_LIST from '@/constants/menu';
import { PermissionList, usePermission } from '@/context/permission-context';
import useFetchTransactions from '@/hooks/query/useFetchStockIn';

const Menu: React.FC<{ activePage: number; onMenuClick: (menu: boolean) => void }> = ({ activePage, onMenuClick }) => {
  const { state } = usePermission();
  const getBubble = (id: string) => {
    switch (id) {
      case 'stock.confirmation':
        return (
          <div className="absolute top-3 right-4">
            <ConfirmationStockBubble />
          </div>
        );

      case 'sellprice.adjustment':
        return (
          <div className="absolute top-3 right-4">
            <OnReviewBubble />
          </div>
        );

      default:
        return <div />;
    }
  };
  return (
    <div className="bg-blueGray-900 pb-4">
      {MENU_LIST.map(({ displayName, icon, id, slug, permission }, index) => {
        if (permission && !state.permission.includes(permission as PermissionList)) {
          return <div />;
        }
        return (
          <div className="px-8 py-4 relative flex items-center" key={id}>
            <Link href={slug}>
              <a>
                <button onClick={() => onMenuClick(false)} type="button" className="group flex items-center text-left">
                  <div className="mr-4">
                    {icon({
                      className: clsx(
                        'group-hover:text-blue-600',
                        activePage === index ? 'text-blue-600' : 'text-blueGray-400'
                      ),
                    })}
                  </div>

                  <span
                    className={`group-hover:text-blue-600 font-bold relative ${
                      activePage === index ? 'text-white' : 'text-blueGray-400'
                    }`}
                  >
                    {displayName}
                  </span>
                  {getBubble(id)}
                </button>
              </a>
            </Link>

            {activePage === index && <div className="w-2 bg-blue-600 h-full absolute left-0" />}
          </div>
        );
      })}
    </div>
  );
};

const ConfirmationStockBubble: React.FC = () => {
  const { data: dataTrasaction } = useFetchTransactions(
    {
      order_by: { created_at: 'desc' },

      where: {
        status: 'pending',
      },
    },
    {
      refetchOnWindowFocus: true,
    }
  );
  return (
    <div className="bg-red-600 text-white rounded-full w-6 h-6 flex align-middle justify-center">
      {dataTrasaction?.data?.transactions?.total}
    </div>
  );
};

const OnReviewBubble: React.FC = () => {
  const { data: dataTrasaction } = useFetchTransactions(
    {
      order_by: { created_at: 'desc' },
      where: {
        status: 'on-review',
      },
    },
    {
      refetchOnWindowFocus: true,
    }
  );
  return (
    <div className="bg-red-600 text-white rounded-full w-6 h-6 flex align-middle justify-center">
      {dataTrasaction?.data?.transactions?.total}
    </div>
  );
};

export default Menu;
