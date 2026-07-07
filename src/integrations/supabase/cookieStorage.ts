// Cookie-backed storage adapter so the Supabase session cookie is shared
// across all *.kommenszlapf.website subdomains.
const ROOT_DOMAIN = "kommenszlapf.website";

function useCookies(): boolean {
  if (typeof window === "undefined") return false;
  return window.location.hostname.endsWith(ROOT_DOMAIN);
}

function readCookie(name: string): string | null {
  const match = document.cookie.match(
    new RegExp("(?:^|; )" + name.replace(/[.$?*|{}()\[\]\\/+^]/g, "\\$&") + "=([^;]*)")
  );
  return match ? decodeURIComponent(match[1]) : null;
}

function writeCookie(name: string, value: string) {
  document.cookie =
    `${name}=${encodeURIComponent(value)}; Domain=.${ROOT_DOMAIN};` +
    ` Path=/; Max-Age=31536000; Secure; SameSite=Lax`;
}

function deleteCookie(name: string) {
  document.cookie =
    `${name}=; Domain=.${ROOT_DOMAIN}; Path=/; Max-Age=0; Secure; SameSite=Lax`;
}

export const cookieStorage = {
  getItem: (key: string): string | null =>
    useCookies() ? readCookie(key) : window.localStorage.getItem(key),
  setItem: (key: string, value: string): void =>
    useCookies() ? writeCookie(key, value) : window.localStorage.setItem(key, value),
  removeItem: (key: string): void =>
    useCookies() ? deleteCookie(key) : window.localStorage.removeItem(key),
};