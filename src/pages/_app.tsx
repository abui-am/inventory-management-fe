import '../styles/globals.css';

import { AppProps } from 'next/app';
import { useRef } from 'react';
import { QueryClient, QueryClientProvider } from 'react-query';
import { ReactQueryDevtools } from 'react-query/devtools';
import { DehydratedState, Hydrate } from 'react-query/hydration';

type MyAppProps = AppProps & { dehydrateState: DehydratedState };

function MyApp({ Component, pageProps, dehydrateState }: MyAppProps): JSX.Element {
  const queryClientRef = useRef<null | QueryClient>(null);

  if (!queryClientRef.current) {
    queryClientRef.current = new QueryClient();
  }

  return (
    <QueryClientProvider client={queryClientRef.current}>
      <Hydrate state={dehydrateState}>
        <main className="font-sans text-blueGray-900 bg-blueGray-100 transition-all duration-75">
          <Component {...pageProps} />
        </main>
      </Hydrate>
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
}

export default MyApp;
