import clsx from 'clsx';
import { useRouter } from 'next/dist/client/router';
import Link from 'next/link';
import React, { KeyboardEvent, LegacyRef, useEffect, useRef, useState } from 'react';
import { List } from 'react-bootstrap-icons';

import { Button } from '@/components/Button';
import Popup from '@/components/Dropdown';
import Avatar from '@/components/Image';
import MENU_LIST from '@/constants/menu';
import { useFetchMyself } from '@/hooks/query/useFetchEmployee';
import { removeCookie } from '@/utils/cookies';

const DashboardLayout: React.FC<{ title: string; titleHref: string }> = ({ title, titleHref, children }) => {
  const [activePage, setActivePage] = useState(0);
  const { pathname } = useRouter();
  const [showMenu, setShowMenu] = useState(false);
  const [showNavbar, setShowNavbar] = useState(false);
  const refElement = useRef(null);
  const { push } = useRouter();

  const { data } = useFetchMyself();
  const { data: dataUser } = data ?? {};
  function logout() {
    removeCookie('INVT_TOKEN');
    removeCookie('INVT_USERID');
    removeCookie('INVT_USERNAME');

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
    const index = MENU_LIST.findIndex(({ slug }) => `${pathname.split('/')[1]}` === slug.split('/')[1]);
    setActivePage(index);
  }, [pathname]);

  return (
    <>
      <div className="h-16 flex items-center bg-blueGray-900 justify-between px-6 py-4 sm:hidden">
        <h3 className="font-bold text-white">Dashboard</h3>

        <Button variant="secondary" onClick={() => setShowNavbar((val) => !val)}>
          <List width={24} height={24} className="text-white" />
        </Button>
      </div>
      {showNavbar && (
        <section id="MenuSmall" className="sm:hidden">
          <Menu activePage={activePage} />
        </section>
      )}
      <div className="flex min-h-screen max-h-screen">
        <div style={{ flexBasis: 216 }} className="flex-grow-0 flex-shrink-0 bg-blueGray-900 hidden sm:block">
          <div className="p-8 pb-7">
            <h3 className="text-2xl font-bold text-white">Dashboard</h3>
          </div>
          <section id="menu">
            <Menu activePage={activePage} />
          </section>
        </div>

        <div className="flex-1 p-8 overflow-scroll">
          <div className="flex justify-between mb-6">
            <Link href={titleHref}>
              <a>
                <h1 className="text-2xl font-bold hover:underline">{title}</h1>
              </a>
            </Link>

            <div className="flex items-center">
              <div onMouseEnter={() => setShowMenu(true)} onMouseLeave={() => setShowMenu(false)}>
                <div
                  className={clsx('h-11 pl-0 flex items-center')}
                  ref={refElement as LegacyRef<HTMLDivElement> | undefined}
                >
                  <Avatar url="https://randomuser.me/api/portraits/women/44.jpg" className="mr-2" />
                </div>
                <Popup
                  open={showMenu}
                  anchorRef={refElement.current}
                  onClickOutside={() => setShowMenu(false)}
                  placement="bottom-end"
                >
                  <div className="flex flex-col divide-y w-72 py-1">
                    <div className="py-6 px-6">
                      <span className="font-bold pb-3 block">Signed as</span>
                      <div className="flex">
                        <Avatar url="https://randomuser.me/api/portraits/women/44.jpg" />
                        <div className="pl-3">
                          <span className="text-base block">Hi, {dataUser?.user.username}</span>
                          <span className="text-sm text-blueGray-600 block">Admin</span>
                        </div>
                      </div>
                    </div>
                    <div className="py-2 px-6 hover:bg-blue-600 hover:text-white" tabIndex={0} role="button">
                      Akun
                    </div>
                    <div
                      className="py-2 px-6 hover:bg-blue-600 hover:text-white"
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
          </div>
          {children}
        </div>
      </div>
    </>
  );
};

const Menu: React.FC<{ activePage: number }> = ({ activePage }) => {
  return (
    <div className="bg-blueGray-900 pb-4">
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
    </div>
  );
};

export default DashboardLayout;
