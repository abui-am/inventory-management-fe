import '../styles/globals.css';
import 'react-datepicker/dist/react-datepicker.css';
import 'tippy.js/dist/tippy.css'; // optional
import 'dayjs/locale/id';

import * as Sentry from '@sentry/nextjs';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import dayjs from 'dayjs';
import { AppProps } from 'next/app';
import { ThemeProvider } from 'next-themes';
import { useRef } from 'react';
import { Toaster } from 'react-hot-toast';
import ReactModal from 'react-modal';

import { AppProvider } from '@/context/app-context';
import { PermissionProvider } from '@/context/permission-context';
import Layout from '@/layouts/Layout';
dayjs.locale('id'); // optional

// react-modal perlu tahu elemen root supaya bisa memberi aria-hidden ke konten di belakang
// modal. Tanpa ini setiap modal melempar error a11y ke console dan screen reader tetap
// membacakan halaman di belakangnya. `#__next` hanya ada di browser.
if (typeof window !== 'undefined') {
  ReactModal.setAppElement('#__next');
}

// Tanpa error boundary, satu exception saat render memblank seluruh aplikasi tanpa jejak:
// _error.tsx hanya menangani error SSR/routing Next, bukan throw saat render di client.
function AppCrashFallback(): JSX.Element {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-6 text-center">
      <h1 className="text-2xl font-bold mb-2">Terjadi kesalahan</h1>
      <p className="mb-6 text-blueGray-600">Halaman ini gagal ditampilkan. Laporan sudah terkirim ke tim teknis.</p>
      <button
        type="button"
        className="rounded-md font-bold min-h-11 px-4 py-2 bg-blue-600 hover:bg-blue-700 shadow-md text-white"
        onClick={() => window.location.reload()}
      >
        Muat ulang halaman
      </button>
    </div>
  );
}

function MyApp({ Component, pageProps }: AppProps): JSX.Element {
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
    <Sentry.ErrorBoundary fallback={<AppCrashFallback />}>
      {/*
        attribute="class" memasang `.dark` di <html>, sesuai strategi darkMode di
        tailwind.config — jadi tidak ada kelas `dark:` di komponen mana pun.
        enableSystem menghormati prefers-color-scheme; pilihan manual disimpan di
        localStorage. next-themes menyisipkan skrip yang jalan sebelum paint,
        sehingga tidak ada kedip tema saat muat.
      */}
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
        <QueryClientProvider client={queryClientRef.current}>
          <PermissionProvider>
            <AppProvider>
              <main className="font-sans text-foreground bg-background">
                <Layout>
                  <Toaster position="bottom-right" toastOptions={{ success: { duration: 2000 } }} />
                  <Component {...pageProps} />
                </Layout>
              </main>
            </AppProvider>
          </PermissionProvider>
          <ReactQueryDevtools initialIsOpen={false} />
        </QueryClientProvider>
      </ThemeProvider>
    </Sentry.ErrorBoundary>
  );
}

export default MyApp;
