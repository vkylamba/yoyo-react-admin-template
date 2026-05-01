// ==============================|| THEME CONFIG  ||============================== //

const config = {
  defaultPath: '/dashboard/default',
  fontFamily: `'Public Sans', sans-serif`,
  i18n: 'en',
  miniDrawer: false,
  container: true,
  mode: 'light',
  presetColor: 'default',
  themeDirection: 'ltr',
  projectTitle: 'Yoyo project!'
};

export default config;
export const drawerWidth = 260;

export const twitterColor = '#1DA1F2';
export const facebookColor = '#3b5998';
export const linkedInColor = '#0e76a8';

export const API_BASE_URL = window.location.port === '3000' ? 'http://localhost:8081' : ''; // dev proxy vs production
export const API_TIMEOUT = 5000; // Timeout for API requests in milliseconds
