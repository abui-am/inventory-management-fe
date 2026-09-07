import cookie, { parse } from 'cookie';
import { IncomingMessage, IncomingMessage as NextRequest } from 'http';
import jscookie from 'js-cookie';

type ParsedCookie = { [p: string]: string };

const parseCookies = (req?: IncomingMessage): ParsedCookie => {
  return cookie.parse(req ? req.headers.cookie || '' : document.cookie);
};

export const setCookie = (key: string, value: string | Record<string, unknown>): void => {
  if (process.browser) {
    jscookie.set(key, value, {
      expires: 7,
      path: '/',
    });
  }
};

export const removeCookie = (key: string): void => {
  if (process.browser) {
    jscookie.remove(key, {
      expires: 7,
    });
  }
};

export const getCookie = (key: string, req?: NextRequest): string | undefined => {
  return process.browser ? getCookieFromBrowser(key) : getCookieFromServer(key, req);
};

const getCookieFromBrowser = (key: string): string | undefined => {
  return jscookie.get(key);
};

// Cookie di aplikasi ini selalu berisi string mentah (token, user id, username),
// bukan JSON — lihat cookie.set() di hooks/mutation/useAuth.ts.
const getCookieFromServer = (key: string, req: NextRequest | undefined): string | undefined => {
  if (!req?.headers.cookie) {
    return undefined;
  }

  return parse(req.headers.cookie)[key];
};

export default parseCookies;
