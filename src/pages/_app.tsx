import '../styles/globals.css';
import 'react-datepicker/dist/react-datepicker.css';
import 'tippy.js/dist/tippy.css'; // optional

import dayjs from 'dayjs';
import { AppProps } from 'next/app';
import { AppContextType } from 'next/dist/shared/lib/utils';
import { useRef } from 'react';
import { Toaster } from 'react-hot-toast';
import { QueryClient, QueryClientProvider } from 'react-query';
import { ReactQueryDevtools } from 'react-query/devtools';
import { dehydrate, DehydratedState, Hydrate } from 'react-query/hydration';

import { AppProvider } from '@/context/app-context';
import { PermissionProvider } from '@/context/permission-context';
import Layout from '@/layouts/Layout';
import parseCookies from '@/utils/cookies';
require('dayjs/locale/id');
dayjs.locale('id'); // optional

type MyAppProps = AppProps & { dehydrateState: DehydratedState };

function MyApp({ Component, pageProps, dehydrateState }: MyAppProps): JSX.Element {
  const queryClientRef = useRef<null | QueryClient>(null);

  if (!queryClientRef.current) {
    queryClientRef.current = new QueryClient({
      defaultOptions: {
        queries: {
          staleTime: 1000 * 60 * 5,
          cacheTime: 1000 * 60 * 5,
          refetchOnWindowFocus: false,
        },
      },
    });
  }

  return (
    <QueryClientProvider client={queryClientRef.current}>
      <Hydrate state={dehydrateState}>
        <PermissionProvider>
          <AppProvider>
            <main className="font-sans text-blueGray-900 bg-blueGray-100 transition-all duration-75">
              <Layout>
                <Toaster position="bottom-right" toastOptions={{ success: { duration: 2000 } }} />
                <Component {...pageProps} />
              </Layout>
            </main>
          </AppProvider>
        </PermissionProvider>
      </Hydrate>
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
}

MyApp.getInitialProps = async ({ ctx }: AppContextType) => {
  const cookie = parseCookies(ctx.req);
  const queryClient = new QueryClient();

  const whitelistedPage = ['/login', '/forget-password', '/_error'];

  if (
    (!cookie['INVT-TOKEN'] || !cookie['INVT-USERNAME'] || !cookie['INVT-USERID']) &&
    !whitelistedPage.includes(ctx.pathname)
  ) {
    ctx.res?.writeHead(302, { Location: '/login' });
    ctx.res?.end();
    return {};
  }

  if (cookie['INVT-TOKEN'] && cookie['INVT-USERNAME'] && cookie['INVT-USERID'] && ctx.pathname === '/login') {
    ctx.res?.writeHead(302, { Location: '/' });
    ctx.res?.end();
    return {};
  }

  if (!cookie['INVT-TOKEN'] || !cookie['INVT-USERNAME'] || !cookie['INVT-USERID']) return {};

  try {
    // const idToken = cookie['INVT-TOKEN'];

    // await queryClient.prefetchQuery('auth', async () => {
    //   const { data } = await apiInstance.get('/auth/login', {
    //     headers: {
    //       authorization: `Bearer ${idToken}`,
    //     },
    //   });

    //   const data = {};

    //   return data;
    // });

    return {
      dehydrateState: dehydrate(queryClient),
    };
  } catch (e) {
    return {};
  }
};

export default MyApp;
