import { Outlet, useLocation } from 'react-router';

import { CLASS_PREFIX } from '@/conf';

const AnimatedPage = ({ context }) => {
  const { pathname } = useLocation();

  return (
    <div
      key={pathname}
      className={`${CLASS_PREFIX}-page-enter`}
    >
      <Outlet context={context} />
    </div>
  );
};

AnimatedPage.displayName = 'AnimatedPage';

export default AnimatedPage;
