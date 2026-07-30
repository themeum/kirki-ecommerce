import { Outlet, useLocation } from 'react-router';

import { pageEnterKeyframes } from '@/theme/shell-styles';
import { scoped, defineStyles } from '@/theme/mixins';
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
    <div key={pathname} css={scoped(styles.pageEnter)}>
      <Outlet context={context} />
    </div>
  );
};

AnimatedPage.displayName = 'AnimatedPage';

export default AnimatedPage;

const styles = defineStyles({
  pageEnter: {
    animation: `${pageEnterKeyframes} 0.45s ease-out both`,
  },
});
