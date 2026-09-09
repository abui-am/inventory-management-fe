import { useRouter } from 'next/dist/client/router';
import { NextSeo } from 'next-seo';
import React, { PropsWithChildren, useEffect, useState } from 'react';

import ProgressBar from '@/components/ui/progress-bar';
import MENU_LIST from '@/constants/menu';

import DashboardLayout from './DashboardLayout';

const Layout: React.FC<PropsWithChildren<unknown>> = ({ children }) => {
  const { pathname, events } = useRouter();
  const excludedUrl = ['/login', '/login/recover', '/forget-password', '/styleguide'];
  const [loading, setLoading] = useState(false);
  const [title, setTitle] = useState<{ displayName: string; title?: string; slug: string }>({
    displayName: '',
    title: '',
    slug: '',
  });

  const handleChangeStart = () => {
    setLoading(true);
  };
  const handleChangeDone = () => {
    setLoading(false);
  };

  useEffect(() => {
    events.on('routeChangeStart', handleChangeStart);
    events.on('routeChangeComplete', handleChangeDone);
    events.on('routeChangeError', handleChangeDone);
    return function cleanup() {
      events.off('routeChangeStart', handleChangeStart);
      events.off('routeChangeComplete', handleChangeDone);
      events.off('routeChangeError', handleChangeDone);
    };
  });

  useEffect(() => {
    const firstPath = pathname.split('/')[1];
    const index = MENU_LIST.findIndex(({ slug }) => firstPath === slug.split('/')[1]);
    if (MENU_LIST[index]) setTitle(MENU_LIST[index]);
  }, [pathname]);

  if (excludedUrl.includes(pathname))
    return (
      <div>
        <NextSeo title="Dashboard" description="Dashboard" />
        {children}
      </div>
    );

  return (
    <div>
      <NextSeo title={`Dashboard | ${title.displayName}`} description="Dashboard" />
      {/* Konten tetap terlihat selama pindah halaman; dulu seluruh layar ditutup bidang
          putih dengan spinner 80px, yang membuang konteks dan menyilaukan di mode gelap. */}
      <ProgressBar active={loading} />
      <div aria-busy={loading || undefined}>
        <DashboardLayout titleHref={title?.slug} title={title?.title ?? title?.displayName}>
          {children}
        </DashboardLayout>
      </div>
    </div>
  );
};

export default Layout;
