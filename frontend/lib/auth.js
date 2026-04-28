import Cookies from 'js-cookie';

const ACCESS_KEY = 'sk_access';
const REFRESH_KEY = 'sk_refresh';

export const setTokens = (accessToken, refreshToken) => {
  Cookies.set(ACCESS_KEY, accessToken, { expires: 1 / 96, sameSite: 'strict' });
  Cookies.set(REFRESH_KEY, refreshToken, { expires: 7, sameSite: 'strict' });
};

export const getAccessToken = () => Cookies.get(ACCESS_KEY);
export const getRefreshToken = () => Cookies.get(REFRESH_KEY);

export const clearTokens = () => {
  Cookies.remove(ACCESS_KEY);
  Cookies.remove(REFRESH_KEY);
};

export const isLoggedIn = () => !!getAccessToken() || !!getRefreshToken();

export const getUser = () => {
  const token = getAccessToken() || getRefreshToken();
  if (!token) return null;
  try {
    return JSON.parse(atob(token.split('.')[1]));
  } catch {
    return null;
  }
};

export const getRoleRedirect = (role) => ({
  super_admin: '/super-admin',
  admin: '/admin',
  teacher: '/teacher',
  student: '/student',
}[role] || '/login');