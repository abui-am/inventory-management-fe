import { useRouter } from 'next/dist/client/router';
import React, { useEffect, useState } from 'react';
import Loader from 'react-loader-spinner';

import MENU_LIST from '@/constants/menu';

import DashboardLayout from './DashboardLayout';

const Layout: React.FC = ({ children }) => {
  const { pathname, events } = useRouter();
  const excludedUrl = ['/login'];
  const [loading, setLoading] = useState(false);
  const [title, setTitle] = useState('');

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
    const firstPath = pathname.split('/')[0];

    const index = MENU_LIST.findIndex(({ slug }) => firstPath === slug.split('/')[0]);
    setTitle(MENU_LIST[index]?.displayName);
  }, [pathname]);

  if (excludedUrl.includes(pathname)) return <div>{children}</div>;

  return (
    <div>
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
        <DashboardLayout title={title}>{children}</DashboardLayout>
      </div>
    </div>
  );
};

export default Layout;
