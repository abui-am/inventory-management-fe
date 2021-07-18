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

export const getCookie = (key: string, req?: NextRequest): string | { [k: string]: string } => {
  return process.browser ? getCookieFromBrowser(key) : getCookieFromServer(key, req);
};

const getCookieFromBrowser = (key: string) => {
  return jscookie.get(key);
};

const getCookieFromServer = (key: string, req: NextRequest | undefined) => {
  if (!req?.headers.cookie) {
    return undefined;
  }

  const rawCookie = parse(req?.headers.cookie ?? '');
  const value = rawCookie[key];

  if (!value) return null;

  return JSON.parse(value);
};

export default parseCookies;
