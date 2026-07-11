import { Outlet, useLocation } from 'react-router';

import { CLASS_PREFIX } from '@/conf';
import type { ConfirmationVariant } from '@/types';

type ConfirmActionOtherProps = {
  variant?: ConfirmationVariant;
  force?: boolean;
  title?: string;
  subtitle?: string;
};

type ConfirmActionParams = {
  action?: () => void;
  otherProps?: ConfirmActionOtherProps;
};

type AnimatedPageContext = {
  confirmAction: (params: ConfirmActionParams) => void;
};

type AnimatedPageProps = {
  context: AnimatedPageContext;
};

const AnimatedPage = ({ context }: AnimatedPageProps) => {
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
