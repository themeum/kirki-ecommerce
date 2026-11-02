import { Outlet, ScrollRestoration } from 'react-router';

const RootLayout = () => {
  return (
    <>
      <ScrollRestoration getKey={(location) => location.pathname} />
      <Outlet />
    </>
  );
};

RootLayout.displayName = 'RootLayout';

export default RootLayout;
