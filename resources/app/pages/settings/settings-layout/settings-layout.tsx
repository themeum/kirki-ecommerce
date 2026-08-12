import { useCallback, useEffect, useState } from 'react';
import { Outlet, useBlocker, useLocation, useOutletContext } from 'react-router';

import ConfirmationDialog from '@/components/modal/confirmation-dialog';
import Button from '@/components/ui/button';
import PageHeading from '@/components/ui/page-heading';
import SettingsSidebar from '@/pages/settings/settings-layout/settings-sidebar';
import type { RegisteredSettingsPageActions } from '@/pages/settings/settings-layout/use-settings-page-actions';
import { theme } from '@/theme';
import { defineStyles, scoped } from '@/theme/mixins';
import { pageEnterKeyframes } from '@/theme/shell-styles';
import { __ } from '@/wpi18n';

type ConfirmActionParams = {
  action?: () => void;
  otherProps?: Record<string, unknown>;
};

type RootOutletContext = {
  confirmAction: (params: ConfirmActionParams) => void;
};

type SettingsLayoutOutletContext = RootOutletContext & {
  registerActions: (actions: RegisteredSettingsPageActions | null) => void;
};

const SETTINGS_HEADER_STICKY_TOP = '64px';
// Header border-box height: 16px top padding + 32px forced heading height +
// 16px bottom padding + 1px border (see PageHeading's wrapperSticky/heading styles).
const SETTINGS_HEADER_HEIGHT = '65px';

const SettingsLayout = () => {
  const { pathname } = useLocation();
  const { confirmAction } = useOutletContext<RootOutletContext>();
  const [actions, setActions] = useState<RegisteredSettingsPageActions | null>(null);

  const isDirty = actions?.isDirty ?? false;
  const isSaving = actions?.isSaving ?? false;

  const shouldBlock = useCallback(
    () => isDirty && !isSaving,
    [isDirty, isSaving],
  );
  const blocker = useBlocker(shouldBlock);
  const isBlocked = blocker.state === 'blocked';

  useEffect(() => {
    if (isBlocked && !isDirty && blocker.state === 'blocked') {
      blocker.reset();
    }
  }, [isBlocked, isDirty, blocker]);

  const registerActions = useCallback(
    (next: RegisteredSettingsPageActions | null) => {
      setActions(next);
    },
    [],
  );

  const handleConfirmLeave = () => {
    if (blocker.state === 'blocked') {
      blocker.proceed();
    }
  };

  const handleCancelLeave = () => {
    if (blocker.state === 'blocked') {
      blocker.reset();
    }
  };

  const outletContext: SettingsLayoutOutletContext = {
    confirmAction,
    registerActions,
  };

  return (
    <>
      {isBlocked && (
        <ConfirmationDialog
          onConfirm={handleConfirmLeave}
          onCancel={handleCancelLeave}
        />
      )}
      <PageHeading
        text={__('Settings', 'kirki-ecommerce')}
        size="lg"
        sticky
        style={{ height: '32px' }}
        actions={
          <Button
            variant="primary"
            onClick={() => actions?.onSave()}
            loading={isSaving}
            disabled={!isDirty || isSaving}
          >
            {__('Save', 'kirki-ecommerce')}
          </Button>
        }
      />
      <div css={scoped(styles.centerRow)}>
        <div css={scoped(styles.row)}>
          <aside css={scoped(styles.sidebar)}>
            <SettingsSidebar />
          </aside>
          <div key={pathname} css={scoped(styles.contentPane)}>
            <Outlet context={outletContext} />
          </div>
        </div>
      </div>
    </>
  );
};

SettingsLayout.displayName = 'SettingsLayout';

export default SettingsLayout;

const styles = defineStyles({
  centerRow: {
    width: '100%',
    display: 'flex',
    justifyContent: 'center',
  },
  row: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: theme.spacing[6],
  },
  sidebar: {
    width: '276px',
    flexShrink: 0,
    position: 'sticky',
    top: `calc(${SETTINGS_HEADER_STICKY_TOP} + ${SETTINGS_HEADER_HEIGHT})`,
    alignSelf: 'flex-start',
  },
  contentPane: {
    // Floor, not a cap: a page's own Container can still grow past this
    // (email-settings/edit-template.tsx does), but sparse content — most
    // visibly the "Loading ..." placeholder shown before a page's data
    // query resolves — must not be allowed to shrink the column narrower
    // than the standard settings content width.
    minWidth: '600px',
    animation: `${pageEnterKeyframes} 0.45s ease-out both`,
  },
});
