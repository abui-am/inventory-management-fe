import { useRouter } from 'next/dist/client/router';
import { NextSeo } from 'next-seo';
import React, { useEffect, useState } from 'react';
import Loader from 'react-loader-spinner';

import MENU_LIST from '@/constants/menu';

import DashboardLayout from './DashboardLayout';

const Layout: React.FC = ({ children }) => {
  const { pathname, events } = useRouter();
  const excludedUrl = ['/login', '/login/recover', '/forget-password'];
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
      <div
        className="backdrop"
        style={{
          opacity: loading ? 1 : 0,
          visibility: loading ? 'visible' : 'hidden',
          transition: 'all 0.4s',
        }}
      >
        <Loader type="TailSpin" color="#00BFFF" height={80} width={80} />
      </div>
      <div
        style={{
          display: !loading ? 'inherit' : 'none',
          opacity: !loading ? 1 : 0,
          visibility: !loading ? 'visible' : 'hidden',
          transition: 'all 0.4s',
        }}
      >
        <DashboardLayout titleHref={title?.slug} title={title?.title ?? title?.displayName}>
          {children}
        </DashboardLayout>
      </div>
    </div>
  );
};

export default Layout;
