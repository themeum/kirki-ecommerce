import { useCallback, useEffect, useState } from 'react';
import { Outlet, useBlocker, useLocation, useOutletContext } from 'react-router';

import ConfirmationDialog from '@/components/modal/confirmation-dialog';
import { Page, PAGE_HEADING_STICKY_TOP, PageContent } from '@/components/ui/page';
import type { RegisteredSettingsPageActions } from '@/features/settings/hooks/use-settings-page-actions';
import SettingsSidebar from '@/features/settings/pages/settings-sidebar';
import { theme } from '@/theme';
import { defineStyles, scoped } from '@/theme/mixins';

const SIDEBAR_WIDTH = '230px';
const CONTENT_PANE_WIDTH = '600px';

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

const SettingsLayout = () => {
  const { pathname } = useLocation();
  const { confirmAction } = useOutletContext<RootOutletContext>();
  const [actions, setActions] = useState<RegisteredSettingsPageActions | null>(null);

  const isDirty = actions?.isDirty ?? false;
  const isSaving = actions?.isSaving ?? false;

  const shouldBlock = useCallback(() => isDirty && !isSaving, [isDirty, isSaving]);
  const blocker = useBlocker(shouldBlock);
  const isBlocked = blocker.state === 'blocked';

  useEffect(() => {
    if (isBlocked && !isDirty && blocker.state === 'blocked') {
      blocker.reset();
    }
  }, [isBlocked, isDirty, blocker]);

  const registerActions = useCallback((next: RegisteredSettingsPageActions | null) => {
    setActions(next);
  }, []);

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
    <Page containerSize="none">
      {isBlocked && (
        <ConfirmationDialog onConfirm={handleConfirmLeave} onCancel={handleCancelLeave} />
      )}
      {/* <PageHeading
        text={__('Settings', 'kirki-ecommerce')}
        containerSize="lg"
        actions={
          isDirty && (
            <>
              <Button
                variant="ghost"
                onClick={() => actions?.onDiscard()}
                disabled={!isDirty || isSaving}
              >
                {__('Discard', 'kirki-ecommerce')}
              </Button>
              <Button
                variant="primary"
                onClick={() => actions?.onSave()}
                loading={isSaving}
                disabled={!isDirty || isSaving}
              >
                {__('Save', 'kirki-ecommerce')}
              </Button>
            </>
          )
        }
      /> */}
      <PageContent>
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
      </PageContent>
    </Page>
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
    width: SIDEBAR_WIDTH,
    flexShrink: 0,
    position: 'sticky',
    top: `calc(${PAGE_HEADING_STICKY_TOP} + ${theme.spacing[4]})`,
    alignSelf: 'flex-start',
  },
  contentPane: {
    minWidth: CONTENT_PANE_WIDTH,
    maxWidth: CONTENT_PANE_WIDTH,
    marginTop: theme.spacing[1],
  },
});
