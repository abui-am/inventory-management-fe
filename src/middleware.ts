import { NextRequest, NextResponse } from 'next/server';

// Guard ini sebelumnya hidup di `MyApp.getInitialProps` (src/pages/_app.tsx). Selama ada
// getInitialProps di _app, Next mematikan Automatic Static Optimization untuk SELURUH
// aplikasi — semua 40 route ditandai `λ (Server)` di output build, termasuk halaman yang
// isinya cuma tiga input. Middleware melakukan pengecekan yang sama sebelum request sampai
// ke halaman, tanpa memaksa render di server.
//
// Logikanya sengaja dipertahankan persis seperti sebelumnya, termasuk daftar whitelist-nya.

const AUTH_COOKIES = ['INVT-TOKEN', 'INVT-USERNAME', 'INVT-USERID'];

// Sama seperti `whitelistedPage` yang lama. Catatan: `/login/recover` memang TIDAK ada di
// sini — jadi pengunjung yang belum login dilempar ke /login saat membuka halaman itu.
// Perilaku lama dipertahankan apa adanya; lihat BUG-7 di REFACTOR-FE.md.
const PUBLIC_PATHS = ['/login', '/forget-password', '/_error', '/styleguide'];

export function middleware(request: NextRequest): NextResponse {
  const { pathname } = request.nextUrl;
  const isSignedIn = AUTH_COOKIES.every((name) => !!request.cookies.get(name));

  if (!isSignedIn && !PUBLIC_PATHS.includes(pathname)) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  if (isSignedIn && pathname === '/login') {
    return NextResponse.redirect(new URL('/', request.url));
  }

  return NextResponse.next();
}

export const config = {
  // Jangan jalankan untuk aset: middleware yang menyentuh /_next/* dan /favicon.ico
  // hanya menambah latensi tanpa guna, dan bisa membuat redirect loop pada aset.
  matcher: ['/((?!_next/static|_next/image|images/|favicon.ico|logo.png).*)'],
};
