import clsx from 'clsx';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { useRouter } from 'next/router';
import React, { KeyboardEvent, LegacyRef, useEffect, useRef, useState } from 'react';
import { ArrowLeft, List } from 'react-bootstrap-icons';
import useCollapse from 'react-collapsed';
import { useQueryClient } from 'react-query';

import { Button } from '@/components/Button';
import Popup from '@/components/Dropdown';
import Avatar from '@/components/Image';
import MENU_LIST from '@/constants/menu';
import { useApp } from '@/context/app-context';
import { useFetchMyself } from '@/hooks/query/useFetchEmployee';
import { useKeyPressEnter } from '@/hooks/useKeyHandler';
import { removeCookie } from '@/utils/cookies';
const Menu = dynamic(() => import('@/components/menu/Menu'));

const DashboardLayout: React.FC<{ title: string; titleHref: string }> = ({ title, titleHref, children }) => {
  const [activePage, setActivePage] = useState(0);
  const { pathname } = useRouter();
  const [showMenu, setShowMenu] = useState(false);
  const [onHover, setOnHover] = useState(false);
  const [showNavbar, setShowNavbar] = useState(false);
  const query = useQueryClient();
  const refElement = useRef(null);
  const { push } = useRouter();
  const { getCollapseProps, getToggleProps } = useCollapse({ isExpanded: showNavbar });
  const { data } = useFetchMyself();
  const { state, dispatch: dispatchApp } = useApp();
  const { hideLabel } = state;
  const { data: dataUser } = data ?? {};
  const { first_name, last_name, id } = dataUser?.user?.employee ?? {};
  function logout() {
    setShowMenu(false);
    removeCookie('INVT-TOKEN');
    removeCookie('INVT-USERID');
    removeCookie('INVT-USERNAME');
    query.invalidateQueries();
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

  const keyHandlerAccount = useKeyPressEnter(() => {
    setShowMenu(false);
    push(`/employee/${id}`);
  });
  const handleKeyUp = useKeyPressEnter(() => setShowMenu((show) => !show));

  useEffect(() => {
    const index = MENU_LIST.findIndex(({ slug }) => `${pathname.split('/')[1]}` === slug.split('/')[1]);
    setActivePage(index);
  }, [pathname]);

  return (
    <>
      <div className="h-16 flex items-center bg-blueGray-900 justify-between px-6 py-4 sm:hidden">
        <Link href="/">
          <h3 className="font-bold text-white cursor-pointer">Dashboard</h3>
        </Link>

        <Button
          variant="secondary"
          {...getToggleProps({
            onClick: () => setShowNavbar((val) => !val),
          })}
        >
          <List width={24} height={24} className="text-white" />
        </Button>
      </div>

      <div className="min-h-screen max-w-screen overflow-hidden">
        <section id="MenuSmall" className="sm:hidden">
          <div {...getCollapseProps()}>
            <Menu onMenuClick={setShowNavbar} hideLabel={false} activePage={activePage} />
          </div>
        </section>

        <div className="flex min-h-screen max-w-screen">
          <div
            style={{
              width: hideLabel ? 120 : 240,
              position: 'fixed',
              top: 0,
              bottom: 0,
              left: 0,
              flexDirection: 'column',
            }}
            className="flex-grow-0  flex-shrink-0 bg-blueGray-900 hidden sm:flex "
          >
            <div className="p-8 pb-7 relative">
              <Link href="/">
                <div className="flex -ml-5 cursor-pointer">
                  <img src="/logo.png" className="w-9 h-9 mr-2" alt="logo" />
                  {!hideLabel && <h3 className="text-2xl font-bold text-white">Dashboard</h3>}
                </div>
              </Link>
              <div className="absolute right-0 h-full top-0">
                <div className="flex gap-2 flex-col justify-center items-center h-full">
                  <button
                    onClick={() => dispatchApp({ type: 'setHideLabel', payload: !hideLabel })}
                    type="button"
                    className="w-6 h-6 shadow-md -mr-3 rounded-full bg-white flex justify-center items-center"
                  >
                    <ArrowLeft
                      className="text-gray-900 transition-transform"
                      style={{
                        // rotate if hideLabel is true
                        transitionDuration: '0.3s',
                        transform: hideLabel ? 'rotate(180deg)' : 'rotate(0deg)',
                      }}
                    />
                  </button>
                </div>
              </div>
            </div>
            <section
              id="menu"
              style={{
                overflowX: 'scroll',
                height: '100%',
                paddingBottom: 40,
              }}
            >
              <Menu hideLabel={hideLabel} onMenuClick={setShowNavbar} activePage={activePage} />
            </section>
          </div>

          <div className={clsx('flex-1 p-0 sm:p-8', hideLabel ? 'sm:ml-[120px]' : 'sm:ml-[240px]')}>
            <div className="p-6 flex justify-between mb-0 sm:p-0 sm:mb-6 max-w-screen">
              <Link href={titleHref}>
                <a>
                  <h1 className="text-2xl font-bold hover:underline">{title}</h1>
                </a>
              </Link>

              <div className="flex items-center">
                <div>
                  <div
                    className={clsx('h-11 pl-0 flex items-center')}
                    ref={refElement as LegacyRef<HTMLDivElement> | undefined}
                    onClick={() => setShowMenu((show) => !show)}
                    tabIndex={0}
                    onMouseEnter={() => {
                      setOnHover(true);
                    }}
                    onMouseLeave={() => {
                      setOnHover(false);
                    }}
                    onKeyUp={handleKeyUp}
                    role="button"
                  >
                    <Avatar url="/images/employee.png" className="mr-2" />
                  </div>
                  <Popup
                    open={showMenu}
                    anchorRef={refElement.current}
                    onClickOutside={() => {
                      // Prevent it to trigger on closing menu by clicking
                      if (!onHover) {
                        setShowMenu(false);
                      }
                    }}
                    placement="bottom-end"
                  >
                    <div className="flex flex-col divide-y w-72 py-1">
                      <div className="py-6 px-6">
                        <div className="flex">
                          <Avatar url="/images/employee.png" className="object-cover" />
                          <div className="pl-3">
                            <span className="text-base block">{`${first_name} ${last_name}`}</span>
                            <span className="text-sm text-blueGray-600 block">{`${(
                              dataUser?.user?.roles.map(({ name }) => name) ?? []
                            ).toString()}`}</span>
                          </div>
                        </div>
                      </div>
                      <div
                        className="py-2 px-6 hover:bg-blue-600 hover:text-white"
                        onClick={() => push(`/employee/${id}`)}
                        onKeyUp={keyHandlerAccount}
                        tabIndex={0}
                        role="button"
                      >
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
      </div>
    </>
  );
};

export default DashboardLayout;
