import { useCallback, useState } from 'react';
import { Outlet, useLocation, useOutletContext } from 'react-router';

import FloatingBar from '@/components/floating-bar/floating-bar';
import Button from '@/components/ui/button';
import { Page, PAGE_HEADING_STICKY_TOP, PageContent } from '@/components/ui/page';
import type { RegisteredSettingsPageActions } from '@/features/settings/hooks/use-settings-page-actions';
import SettingsSidebar from '@/features/settings/pages/settings-sidebar';
import { SettingsSearchProvider } from '@/features/settings/search/settings-search-context';
import SettingsSearchHighlighter from '@/features/settings/search/settings-search-highlighter';
import { useUnsavedNavigationGuard } from '@/hooks/use-unsaved-navigation-guard';
import { theme } from '@/theme';
import { defineStyles, scoped } from '@/theme/mixins';
import { __ } from '@/wpi18n';

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

const SettingsLayoutShell = () => {
  const { pathname } = useLocation();
  const { confirmAction } = useOutletContext<RootOutletContext>();
  const [actions, setActions] = useState<RegisteredSettingsPageActions | null>(null);

  const isDirty = actions?.isDirty ?? false;
  const isSaving = actions?.isSaving ?? false;

  const { cancelNavigation, markSaving, shakeSignal } = useUnsavedNavigationGuard(isDirty);

  const registerActions = useCallback((next: RegisteredSettingsPageActions | null) => {
    setActions(next);
  }, []);

  // Discarding reverts the page and stays put; any navigation that was blocked
  // is abandoned rather than completed, so the merchant keeps the settings page
  // they are looking at.
  const handleDiscard = () => {
    actions?.onDiscard();
    cancelNavigation();
  };

  const handleSave = async () => {
    markSaving(true);
    try {
      await actions?.onSave();
    } finally {
      markSaving(false);
    }
  };

  const outletContext: SettingsLayoutOutletContext = {
    confirmAction,
    registerActions,
  };

  return (
    <Page containerSize="none">
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
      <FloatingBar visible={isDirty} shakeSignal={shakeSignal}>
        <Button variant="tertiary" onClick={handleDiscard} disabled={isSaving}>
          {__('Discard', 'kirki-ecommerce')}
        </Button>
        <Button variant="primary" onClick={() => void handleSave()} loading={isSaving}>
          {__('Save', 'kirki-ecommerce')}
        </Button>
      </FloatingBar>
    </Page>
  );
};

SettingsLayoutShell.displayName = 'SettingsLayoutShell';

const SettingsLayout = () => {
  return (
    <SettingsSearchProvider>
      <SettingsSearchHighlighter />
      <SettingsLayoutShell />
    </SettingsSearchProvider>
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
