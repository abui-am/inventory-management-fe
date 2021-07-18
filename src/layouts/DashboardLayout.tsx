import clsx from 'clsx';
import { useRouter } from 'next/dist/client/router';
import React, { useEffect, useState } from 'react';
import { ChevronDown, Link } from 'react-bootstrap-icons';

import { RoundedButton } from '@/components/Button';
import Avatar from '@/components/Image';
import MENU_LIST from '@/constants/menu';

const DashboardLayout: React.FC<{ title: string }> = ({ title, children }) => {
  const [activePage, setActivePage] = useState(0);
  const { pathname } = useRouter();
  useEffect(() => {
    const index = MENU_LIST.findIndex(({ slug }) => pathname === slug);
    setActivePage(index);
  }, [pathname]);

  return (
    <div className="flex min-h-screen max-h-screen">
      <div style={{ flexBasis: 216 }} className="flex-grow-0 flex-shrink-0 bg-blueGray-900">
        <div className="p-8 pb-7">
          <h3 className="text-2xl font-bold text-white">Dashboard</h3>
        </div>
        <section id="menu">
          {MENU_LIST.map(({ displayName, icon, id, slug }, index) => {
            return (
              <div className="px-8 py-4 relative flex items-center" key={id}>
                <Link href={slug}>
                  <a>
                    <button type="button" className="group flex items-center">
                      <div className="mr-4">
                        {icon({
                          className: clsx(
                            'group-hover:text-blue-600',
                            activePage === index ? 'text-blue-600' : 'text-blueGray-400'
                          ),
                        })}
                      </div>
                      <div className="flex-1">
                        <span
                          className={`group-hover:text-blue-600 font-bold ${
                            activePage === index ? 'text-white' : 'text-blueGray-400'
                          }`}
                        >
                          {displayName}
                        </span>
                      </div>
                    </button>
                  </a>
                </Link>

                {activePage === index && <div className="w-2 bg-blue-600 h-full absolute right-0" />}
              </div>
            );
          })}
        </section>
      </div>
      <div className="flex-1 p-8 overflow-scroll">
        <div className="flex justify-between">
          <h1 className="text-2xl font-bold">{title}</h1>
          <div className="flex items-center mb-8">
            <Avatar url="https://randomuser.me/api/portraits/women/44.jpg" className="mr-2" onClick={(e) => e} />
            <RoundedButton>
              <ChevronDown />
            </RoundedButton>
          </div>
        </div>
        {children}
      </div>
    </div>
  );
};

export default DashboardLayout;
