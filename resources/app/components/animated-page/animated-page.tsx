import { Outlet, useLocation } from 'react-router';

import { RouteConfig } from '@/config/route-config';
import { defineStyles, scoped } from '@/theme/mixins';
import { pageEnterKeyframes } from '@/theme/shell-styles';
import type { ConfirmationVariant } from '@/types/components/common';

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

const SETTINGS_PATH_PREFIX = RouteConfig.Settings.template;

// Settings is a nested layout route: SettingsLayout owns a persistent
// sidebar + header and renders its own child Outlet. Keying this wrapper on
// the full pathname would remount that whole shell (sidebar included) on
// every settings navigation. Pin the key while inside settings so the shell
// mounts once; SettingsLayout animates its own content pane per navigation.
const getAnimationKey = (pathname: string): string =>
  pathname.startsWith(SETTINGS_PATH_PREFIX) ? SETTINGS_PATH_PREFIX : pathname;

const AnimatedPage = ({ context }: AnimatedPageProps) => {
  const { pathname } = useLocation();

  return (
    <div key={getAnimationKey(pathname)} css={scoped(styles.pageEnter)}>
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
