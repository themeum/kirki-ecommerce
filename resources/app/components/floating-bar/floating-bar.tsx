import type { CSSObject } from '@emotion/react';
import { keyframes } from '@emotion/react';
import { Info } from 'lucide-react';
import type { ReactNode } from 'react';
import { useLayoutEffect, useState } from 'react';
import { createPortal } from 'react-dom';

import Flex from '@/components/ui/flex';
import Text from '@/components/ui/text';
import { getPortalContainer } from '@/libs/portal-container';
import { theme } from '@/theme';
import { defineStyles, flexCenter, mergeCss, scoped } from '@/theme/mixins';
import { __ } from '@/wpi18n';

// The bar is `position: fixed`, so its `left` is measured against the viewport
// — which includes the WordPress admin menu. Measuring the content column
// instead of subtracting a hardcoded menu width keeps the bar centred over the
// application whether the menu is expanded, folded, auto-folded on a narrow
// screen, or flipped to the right in RTL.
const useContentCenter = (): number | null => {
  const [center, setCenter] = useState<number | null>(null);

  useLayoutEffect(() => {
    const content = document.querySelector(CONTENT_COLUMN_SELECTOR);

    if (!content) {
      return;
    }

    const measure = () => {
      const { left, width } = content.getBoundingClientRect();
      setCenter(left + width / 2);
    };

    measure();

    // Folding the admin menu changes the content column's width, so observing
    // it covers both the collapse toggle and plain viewport resizes.
    const observer = new ResizeObserver(measure);
    observer.observe(content);

    return () => observer.disconnect();
  }, []);

  return center;
};

type FloatingBarProps = {
  visible: boolean;
  label?: ReactNode;
  shakeSignal?: number;
  children?: ReactNode;
  cssOverride?: CSSObject;
};

const FloatingBar = ({
  visible,
  label = __('Unsaved changes', 'kirki-ecommerce'),
  shakeSignal = 0,
  children,
  cssOverride,
}: FloatingBarProps) => {
  const center = useContentCenter();

  return createPortal(
    <div
      css={scoped(visible ? styles.wrapperVisible : styles.wrapperHidden)}
      style={center === null ? undefined : { left: center }}
      data-slot="floating-bar"
      role="status"
      aria-hidden={!visible}
    >
      {/* Remounting on every `shakeSignal` bump is what replays the one-shot
          shake keyframes; the animation itself is only attached once the
          signal has been bumped, so the bar rises in without shaking. */}
      <Flex
        key={shakeSignal}
        align="center"
        gap={4}
        cssOverride={mergeCss(styles.content, shakeSignal > 0 && styles.shaking, cssOverride)}
      >
        <Flex align="center" gap={1}>
          <span css={scoped(styles.icon)} aria-hidden="true">
            <Info />
          </span>
          {typeof label === 'string' ? (
            <Text variant="small" weight="medium" cssOverride={{ color: 'rgba(171, 111, 0, 1)' }}>
              {label}
            </Text>
          ) : (
            label
          )}
        </Flex>
        <Flex align="center" gap={2}>
          {children}
        </Flex>
      </Flex>
    </div>,
    getPortalContainer(),
  );
};

FloatingBar.displayName = 'FloatingBar';

export default FloatingBar;
export type { FloatingBarProps };

const CONTENT_COLUMN_SELECTOR = '#wpbody-content';

const shake = keyframes({
  '0%, 100%': { transform: 'translateX(0)' },
  '20%': { transform: 'translateX(-10px)' },
  '40%': { transform: 'translateX(10px)' },
  '60%': { transform: 'translateX(-6px)' },
  '80%': { transform: 'translateX(6px)' },
});

const wrapperBase: Parameters<typeof defineStyles>[0] = {
  position: 'fixed',
  left: '50%',
  bottom: theme.spacing[6],
  zIndex: theme.zIndex.toast,
  transition: 'transform 0.2s ease-out, opacity 0.2s ease-out',
  maxWidth: 624,
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
    padding: `${theme.spacing[3]} ${theme.spacing[2]}`,
    borderRadius: theme.radius.xxl,
    background: theme.colors.background.fill,
    boxShadow: `${theme.shadow.lg}, ${theme.shadow.lg}`,
    justifyContent: 'space-between',
    border: `1px solid ${theme.colors.border.default}`,
    color: 'rgba(171, 111, 0, 1)',
    maxHeight: '48px',
  },
  shaking: {
    animation: `${shake} 0.3s ease-in-out 0.2s 1`,
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
