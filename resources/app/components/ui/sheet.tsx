import { type CSSObject, keyframes } from '@emotion/react';
import * as SheetPrimitive from '@radix-ui/react-dialog';
import { X } from 'lucide-react';
import {
  type ComponentPropsWithoutRef,
  type ComponentRef,
  forwardRef,
  type HTMLAttributes,
} from 'react';

import Button from '@/components/ui/button';
import { getPortalContainer } from '@/libs/portal-container';
import { theme } from '@/theme';
import { defineStyles, scopedMerge } from '@/theme/mixins';
import { __ } from '@/wpi18n';

type SheetSide = 'top' | 'right' | 'bottom' | 'left';

const Sheet = SheetPrimitive.Root;

const SheetTrigger = SheetPrimitive.Trigger;

const SheetClose = SheetPrimitive.Close;

const SheetPortal = ({ ...props }: ComponentPropsWithoutRef<typeof SheetPrimitive.Portal>) => {
  return <SheetPrimitive.Portal container={getPortalContainer()} {...props} />;
};

SheetPortal.displayName = 'SheetPortal';

type SheetOverlayProps = Omit<
  ComponentPropsWithoutRef<typeof SheetPrimitive.Overlay>,
  'className'
> & {
  cssOverride?: CSSObject;
};

const SheetOverlay = forwardRef<ComponentRef<typeof SheetPrimitive.Overlay>, SheetOverlayProps>(
  (props, ref) => {
    const { cssOverride, ...rest } = props;

    return (
      <SheetPrimitive.Overlay ref={ref} css={scopedMerge(styles.overlay, cssOverride)} {...rest} />
    );
  },
);

SheetOverlay.displayName = 'SheetOverlay';

type SheetContentProps = Omit<
  ComponentPropsWithoutRef<typeof SheetPrimitive.Content>,
  'className'
> & {
  side?: SheetSide;
  cssOverride?: CSSObject;
};

const SheetContent = forwardRef<ComponentRef<typeof SheetPrimitive.Content>, SheetContentProps>(
  (props, ref) => {
    const { side = 'right', cssOverride, children, ...rest } = props;

    return (
      <SheetPortal>
        <SheetOverlay />
        <SheetPrimitive.Content
          ref={ref}
          data-side={side}
          css={scopedMerge(styles.content, sideStyles[side], cssOverride)}
          {...rest}
        >
          {children}
          <SheetPrimitive.Close asChild>
            <Button
              variant="ghost"
              size="icon"
              aria-label={__('Close', 'kirki-ecommerce')}
              cssOverride={styles.closeButton}
            >
              <X size={16} aria-hidden="true" />
            </Button>
          </SheetPrimitive.Close>
        </SheetPrimitive.Content>
      </SheetPortal>
    );
  },
);

SheetContent.displayName = 'SheetContent';

type SheetSectionProps = Omit<HTMLAttributes<HTMLDivElement>, 'className'> & {
  cssOverride?: CSSObject;
};

const SheetHeader = (props: SheetSectionProps) => {
  const { cssOverride, ...rest } = props;

  return <div css={scopedMerge(styles.header, cssOverride)} {...rest} />;
};

SheetHeader.displayName = 'SheetHeader';

const SheetFooter = (props: SheetSectionProps) => {
  const { cssOverride, ...rest } = props;

  return <div css={scopedMerge(styles.footer, cssOverride)} {...rest} />;
};

SheetFooter.displayName = 'SheetFooter';

type SheetTitleProps = Omit<ComponentPropsWithoutRef<typeof SheetPrimitive.Title>, 'className'> & {
  cssOverride?: CSSObject;
};

const SheetTitle = forwardRef<ComponentRef<typeof SheetPrimitive.Title>, SheetTitleProps>(
  (props, ref) => {
    const { cssOverride, ...rest } = props;

    return (
      <SheetPrimitive.Title ref={ref} css={scopedMerge(styles.title, cssOverride)} {...rest} />
    );
  },
);

SheetTitle.displayName = 'SheetTitle';

type SheetDescriptionProps = Omit<
  ComponentPropsWithoutRef<typeof SheetPrimitive.Description>,
  'className'
> & {
  cssOverride?: CSSObject;
};

const SheetDescription = forwardRef<
  ComponentRef<typeof SheetPrimitive.Description>,
  SheetDescriptionProps
>((props, ref) => {
  const { cssOverride, ...rest } = props;

  return (
    <SheetPrimitive.Description
      ref={ref}
      css={scopedMerge(styles.description, cssOverride)}
      {...rest}
    />
  );
});

SheetDescription.displayName = 'SheetDescription';

export {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetOverlay,
  SheetPortal,
  type SheetSide,
  SheetTitle,
  SheetTrigger,
};

const overlayIn = keyframes({
  from: { opacity: 0 },
  to: { opacity: 1 },
});

const overlayOut = keyframes({
  from: { opacity: 1 },
  to: { opacity: 0 },
});

const OFFSCREEN: Record<SheetSide, string> = {
  top: 'translateY(-100%)',
  right: 'translateX(100%)',
  bottom: 'translateY(100%)',
  left: 'translateX(-100%)',
};

const slide = (side: SheetSide): CSSObject => {
  const slideIn = keyframes({
    from: { transform: OFFSCREEN[side] },
    to: { transform: 'translate(0, 0)' },
  });
  const slideOut = keyframes({
    from: { transform: 'translate(0, 0)' },
    to: { transform: OFFSCREEN[side] },
  });

  return {
    '@media (prefers-reduced-motion: no-preference)': {
      '&[data-state="open"]': {
        animation: `${slideIn} 250ms ease-out`,
      },
      '&[data-state="closed"]': {
        animation: `${slideOut} 200ms ease-in`,
      },
    },
  };
};

const sideStyles = defineStyles({
  top: {
    top: 0,
    left: 0,
    right: 0,
    maxHeight: '85vh',
    borderBottom: `1px solid ${theme.colors.border.default}`,
    ...slide('top'),
  },
  right: {
    top: 0,
    right: 0,
    bottom: 0,
    width: '400px',
    maxWidth: '100vw',
    borderLeft: `1px solid ${theme.colors.border.default}`,
    ...slide('right'),
  },
  bottom: {
    bottom: 0,
    left: 0,
    right: 0,
    maxHeight: '85vh',
    borderTop: `1px solid ${theme.colors.border.default}`,
    ...slide('bottom'),
  },
  left: {
    top: 0,
    left: 0,
    bottom: 0,
    width: '400px',
    maxWidth: '100vw',
    borderRight: `1px solid ${theme.colors.border.default}`,
    ...slide('left'),
  },
});

const styles = defineStyles({
  overlay: {
    position: 'fixed',
    inset: 0,
    zIndex: theme.zIndex.sheet,
    background: 'rgba(0, 0, 0, 0.6)',
    backdropFilter: 'blur(4px)',
    WebkitBackdropFilter: 'blur(4px)',
    '@media (prefers-reduced-motion: no-preference)': {
      '&[data-state="open"]': {
        animation: `${overlayIn} 150ms ease`,
      },
      '&[data-state="closed"]': {
        animation: `${overlayOut} 150ms ease`,
      },
    },
  },
  content: {
    position: 'fixed',
    zIndex: theme.zIndex.sheet,
    display: 'flex',
    flexDirection: 'column',
    boxSizing: 'border-box',
    backgroundColor: theme.colors.background.fill,
    boxShadow: theme.shadow.lg,
    color: theme.colors.text.primary,
    '&:focus, &:focus-visible': {
      outline: 'none',
    },
  },
  closeButton: {
    position: 'absolute',
    top: theme.spacing[3],
    right: theme.spacing[3],
  },
  header: {
    display: 'flex',
    flexDirection: 'column',
    flexShrink: 0,
    rowGap: theme.spacing[1],
    padding: `${theme.spacing[4]} ${theme.spacing[6]}`,
    paddingRight: theme.spacing[12],
    borderBottom: `1px solid ${theme.colors.border.default}`,
  },
  footer: {
    display: 'flex',
    alignItems: 'center',
    flexShrink: 0,
    justifyContent: 'flex-end',
    columnGap: theme.spacing[2],
    marginTop: 'auto',
    padding: `${theme.spacing[4]} ${theme.spacing[6]}`,
    borderTop: `1px solid ${theme.colors.border.default}`,
  },
  title: {
    margin: 0,
    ...theme.typography.large('semibold'),
    color: theme.colors.text.primary,
  },
  description: {
    margin: 0,
    ...theme.typography.small(),
    color: theme.colors.text.secondary,
  },
});
