import { useQueryClient } from '@tanstack/react-query';
import clsx from 'clsx';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { useRouter } from 'next/router';
import React, { KeyboardEvent, LegacyRef, PropsWithChildren, useRef, useState } from 'react';
import { ArrowLeft, List } from 'react-bootstrap-icons';
import { useCollapse } from 'react-collapsed';

import { Button } from '@/components/Button';
import Popup from '@/components/Dropdown';
import Avatar from '@/components/Image';
import CommandPalette from '@/components/ui/command-palette';
import ThemeToggle from '@/components/ui/theme-toggle';
import MENU_LIST, { MENU_GROUPS } from '@/constants/menu';
import { useApp } from '@/context/app-context';
import { useFetchMyself } from '@/hooks/query/useFetchEmployee';
import { useKeyPressEnter } from '@/hooks/useKeyHandler';
import { removeCookie } from '@/utils/cookies';
// ssr: false. Dengan SSR menyala, server merender isi menu sementara render pertama di
// client masih memuat chunk-nya dan merender kosong — teksnya tidak cocok, dan sejak
// React 18 itu membuat seluruh pohon SSR dibuang lalu di-render ulang.
// Ini juga penyebab sidebar "muncul terlambat" yang tercatat di audit Fase 1.
const Menu = dynamic(() => import('@/components/menu/Menu'), { ssr: false });

const DashboardLayout: React.FC<PropsWithChildren<{ title: string; titleHref: string }>> = ({
  title,
  titleHref,
  children,
}) => {
  const [showMenu, setShowMenu] = useState(false);
  const [onHover, setOnHover] = useState(false);
  const [showNavbar, setShowNavbar] = useState(false);
  const query = useQueryClient();
  const refElement = useRef(null);
  const { push } = useRouter();
  const { getCollapseProps, getToggleProps } = useCollapse({ isExpanded: showNavbar });
  const { data } = useFetchMyself();
  // Grup diambil dari rute, bukan dikirim pemanggil: Layout sudah mencari item menunya
  // untuk judul, dan menambah satu prop lagi berarti dua tempat yang bisa berselisih.
  const segment = useRouter().pathname.split('/')[1];
  const activeItem = MENU_LIST.find((item) => item.slug.split('/')[1] === segment);
  const groupLabel = MENU_GROUPS.find((g) => g.id === activeItem?.group)?.label;
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

  return (
    <>
      <div className="flex h-14 items-center justify-between border-b border-border bg-surface px-4 sm:hidden">
        <Link href="/">
          <h3 className="cursor-pointer font-semibold">Putra Pribumi</h3>
        </Link>

        <Button
          variant="secondary"
          {...getToggleProps({
            onClick: () => setShowNavbar((val) => !val),
          })}
        >
          <List width={20} height={20} />
        </Button>
      </div>

      <div className="min-h-screen max-w-screen overflow-hidden">
        <section id="MenuSmall" className="sm:hidden">
          <div {...getCollapseProps()}>
            <Menu onMenuClick={setShowNavbar} hideLabel={false} />
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
            className="hidden flex-shrink-0 flex-grow-0 border-r border-border bg-surface-raised sm:flex"
          >
            <div className="relative px-3 py-3">
              <Link href="/">
                <div className="flex cursor-pointer items-center gap-2 px-2">
                  <img src="/logo.png" width={24} height={24} className="h-6 w-6" alt="" />
                  {!hideLabel && <h3 className="truncate text-base font-semibold tracking-tight">Putra Pribumi</h3>}
                </div>
              </Link>
              <div className="absolute right-0 h-full top-0">
                <div className="flex gap-2 flex-col justify-center items-center h-full">
                  <button
                    onClick={() => dispatchApp({ type: 'setHideLabel', payload: !hideLabel })}
                    type="button"
                    aria-label={hideLabel ? 'Lebarkan menu' : 'Ciutkan menu'}
                    className="-mr-3 flex h-5 w-5 items-center justify-center rounded-full border border-border bg-surface text-foreground-muted shadow-sm transition-colors duration-fast hover:text-foreground"
                  >
                    <ArrowLeft
                      size={12}
                      className="transition-transform"
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
              // overflowX: 'scroll' adalah sumbu yang salah — sidebar tidak pernah meluap
              // ke samping, dan di macOS itu memunculkan batang gulir horizontal permanen
              // di kaki menu. Yang meluap adalah sumbu tegak.
              className="h-full overflow-y-auto overflow-x-hidden"
            >
              <Menu hideLabel={hideLabel} onMenuClick={setShowNavbar} />
            </section>
          </div>

          <div className={clsx('flex-1 w-0 p-0 sm:p-8', hideLabel ? 'sm:ml-[120px]' : 'sm:ml-[240px]')}>
            <div className="max-w-screen mb-0 flex items-center justify-between gap-3 p-4 sm:mb-5 sm:p-0">
              {/* Breadcrumb, bukan judul telanjang: dengan menu dikelompokkan, nama halaman
                  saja tidak memberi tahu di cabang mana pengguna berada. */}
              <nav aria-label="Remah roti" className="flex min-w-0 items-baseline gap-1.5">
                {groupLabel && (
                  <>
                    <span className="truncate text-base text-foreground-muted">{groupLabel}</span>
                    <span className="text-foreground-subtle" aria-hidden>
                      /
                    </span>
                  </>
                )}
                <Link href={titleHref}>
                  <a className="truncate text-xl font-semibold tracking-tight hover:underline">{title}</a>
                </Link>
              </nav>

              <div className="flex items-center gap-2">
                {/* Sampai Fase 4 selesai, pengalih tema hanya berpengaruh di halaman yang
                    sudah dipindahkan ke token; sisanya masih dipaksa terang di _app. */}
                <CommandPalette />
                <ThemeToggle />
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
                    <div className="flex w-64 flex-col divide-y divide-border py-1">
                      <div className="px-4 py-4">
                        <div className="flex">
                          <Avatar url="/images/employee.png" className="object-cover" />
                          <div className="pl-3">
                            <span className="block text-base font-medium">{`${first_name} ${last_name}`}</span>
                            <span className="block text-sm text-foreground-muted">{`${(
                              dataUser?.user?.roles.map(({ name }) => name) ?? []
                            ).toString()}`}</span>
                          </div>
                        </div>
                      </div>
                      <div
                        className="cursor-pointer px-4 py-2 text-base transition-colors duration-fast hover:bg-surface-raised"
                        onClick={() => push(`/employee/${id}`)}
                        onKeyUp={keyHandlerAccount}
                        tabIndex={0}
                        role="button"
                      >
                        Akun
                      </div>
                      <div
                        className="cursor-pointer px-4 py-2 text-base transition-colors duration-fast hover:bg-surface-raised"
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
