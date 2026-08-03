import { AlertTriangle } from 'lucide-react';
import { createPortal } from 'react-dom';

import Button from '@/components/ui/button';
import Flex from '@/components/ui/flex';
import Text from '@/components/ui/text';
import { getPortalContainer } from '@/libs/portal-container';
import { theme } from '@/theme';
import { defineStyles, flexCenter, scoped } from '@/theme/mixins';
import { __ } from '@/wpi18n';

type UnsavedToastProps = {
  visible: boolean;
  onCancel: () => void;
  onSave: () => void;
  isSubmitting?: boolean;
};

const UnsavedToast = ({
  visible,
  onCancel,
  onSave,
  isSubmitting = false,
}: UnsavedToastProps) => {
  return createPortal(
    <div
      css={scoped(visible ? styles.wrapperVisible : styles.wrapperHidden)}
      role="status"
      aria-hidden={!visible}
    >
      <Flex align="center" gap={4} cssOverride={styles.content}>
        <Flex align="center" gap={1}>
          <span css={scoped(styles.icon)} aria-hidden="true">
            <AlertTriangle />
          </span>
          <Text weight="medium" cssOverride={{ color: '#C78C00' }}>
            {__('Unsaved product', 'kirki-ecommerce')}
          </Text>
        </Flex>
        <Flex align="center" gap={2}>
          <Button variant="ghost" onClick={onCancel} disabled={isSubmitting}>
            {__('Cancel', 'kirki-ecommerce')}
          </Button>
          <Button variant="primary" onClick={onSave} loading={isSubmitting}>
            {__('Save', 'kirki-ecommerce')}
          </Button>
        </Flex>
      </Flex>
    </div>,
    getPortalContainer(),
  );
};

UnsavedToast.displayName = 'UnsavedToast';

export default UnsavedToast;

const wrapperBase: Parameters<typeof defineStyles>[0] = {
  position: 'fixed',
  left: '50%',
  bottom: theme.spacing[12],
  zIndex: 9999,
  transition: 'transform 0.2s ease-out, opacity 0.2s ease-out',
  maxWidth: 762,
  width: '100%',
};

const styles = defineStyles({
  wrapperVisible: {
    ...wrapperBase,
    transform: 'translateX(-50%) translateY(0)',
    opacity: 1,
    pointerEvents: 'auto',
  },
  wrapperHidden: {
    ...wrapperBase,
    transform: 'translateX(-50%) translateY(100%)',
    opacity: 0,
    pointerEvents: 'none',
  },
  content: {
    minWidth: 330,
    padding: `${theme.spacing[3]} ${theme.spacing[4]}`,
    borderRadius: theme.radius.xl,
    background: theme.colors.background.fill,
    boxShadow: `${theme.shadow.lg}, ${theme.shadow.lg}`,
    justifyContent: 'space-between',
    border: `1px solid ${theme.colors.border.default}`,
    color: '#C78C00' // Intentionally used the hex code instead of the theme color
  },
  icon: {
    ...flexCenter(),
    height: 32,
    width: 32,
    borderRadius: theme.radius.lg,
    background: theme.colors.background.fill,
    '& svg': {
      width: 16,
      height: 16,
      color: '#C78C00', // Intentionally used the hex code instead of the theme color
    },
  },
});
