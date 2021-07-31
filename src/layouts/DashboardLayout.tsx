import clsx from 'clsx';
import { useRouter } from 'next/dist/client/router';
import Link from 'next/link';
import React, { KeyboardEvent, LegacyRef, useEffect, useRef, useState } from 'react';
import { ChevronDown } from 'react-bootstrap-icons';

import { RoundedButton } from '@/components/Button';
import Popup from '@/components/Dropdown';
import Avatar from '@/components/Image';
import MENU_LIST from '@/constants/menu';
import { removeCookie } from '@/utils/cookies';

const DashboardLayout: React.FC<{ title: string }> = ({ title, children }) => {
  const [activePage, setActivePage] = useState(0);
  const { pathname } = useRouter();
  const [showMenu, setShowMenu] = useState(false);
  const refElement = useRef(null);
  const { push } = useRouter();

  function logout() {
    removeCookie('INVT_TOKEN');
    push('/login');
  }

  function keyHandler(event: KeyboardEvent<HTMLDivElement>): void {
    switch (event.key) {
      case 'Enter':
        logout();
        break;
      default:
    }
  }

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
            <div ref={refElement as LegacyRef<HTMLDivElement> | undefined}>
              <RoundedButton
                className={clsx('h-11 pl-0', showMenu ? 'bg-blueGray-400' : '')}
                type="button"
                onClick={() => setShowMenu(true)}
              >
                <Avatar url="https://randomuser.me/api/portraits/women/44.jpg" className="mr-2" />
                <ChevronDown />
              </RoundedButton>
            </div>
            <Popup
              open={showMenu}
              anchorRef={refElement.current}
              onClickOutside={() => setShowMenu(false)}
              placement="bottom-end"
            >
              <div className="flex flex-col divide-y w-40 py-1">
                <div className="py-2 px-4">Akun</div>
                <div
                  className="py-2 px-4 hover:bg-blue-600 hover:text-white"
                  tabIndex={0}
                  role="button"
                  onKeyUp={keyHandler}
                  onClick={logout}
                >
                  Log out
                </div>
              </div>
            </Popup>
          </div>
        </div>
        {children}
      </div>
    </div>
  );
};

export default DashboardLayout;
