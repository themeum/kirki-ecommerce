import { type CSSObject, keyframes } from '@emotion/react';
import * as SheetPrimitive from '@radix-ui/react-dialog';
import { Move, PanelRight, X } from 'lucide-react';
import {
  type ComponentPropsWithoutRef,
  type ComponentRef,
  createContext,
  forwardRef,
  type HTMLAttributes,
  useCallback,
  useContext,
  useLayoutEffect,
} from 'react';

import Button from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { FLOAT_MARGIN, type SheetFloat, useSheetFloat } from '@/components/ui/use-sheet-float';
import { getPortalContainer } from '@/libs/portal-container';
import { theme } from '@/theme';
import { defineStyles, scoped, scopedMerge } from '@/theme/mixins';
import { __ } from '@/wpi18n';

type SheetSide = 'top' | 'right' | 'bottom' | 'left';

const SheetFloatContext = createContext<SheetFloat | null>(null);

type SheetProps = ComponentPropsWithoutRef<typeof SheetPrimitive.Root> &
  ({ floating: true; storageKey: string } | { floating?: false; storageKey?: never });

const Sheet = (props: SheetProps) => {
  const { floating, storageKey, modal, ...rest } = props;
  const float = useSheetFloat(floating ? storageKey : undefined);

  return (
    <SheetFloatContext.Provider value={floating ? float : null}>
      <SheetPrimitive.Root modal={float.floating ? false : modal} {...rest} />
    </SheetFloatContext.Provider>
  );
};

Sheet.displayName = 'Sheet';

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
    const { side = 'right', cssOverride, children, onInteractOutside, style, ...rest } = props;
    const float = useContext(SheetFloatContext);
    const floating = !!float?.floating && side === 'right';
    const contentRef = float?.contentRef;
    const clamp = float?.clamp;

    const setRefs = useCallback(
      (element: ComponentRef<typeof SheetPrimitive.Content> | null) => {
        if (contentRef) {
          contentRef.current = element;
        }

        if (typeof ref === 'function') {
          ref(element);
        } else if (ref) {
          ref.current = element;
        }
      },
      [contentRef, ref],
    );

    useLayoutEffect(() => {
      if (floating && clamp) {
        clamp();
      }
    }, [clamp, floating]);

    return (
      <SheetPortal>
        {!floating && <SheetOverlay />}
        <SheetPrimitive.Content
          ref={setRefs}
          data-side={side}
          data-floating={floating ? 'true' : undefined}
          css={scopedMerge(
            styles.content,
            floating ? styles.floating : sideStyles[side],
            cssOverride,
          )}
          style={floating ? { ...style, left: float.position.x, top: float.position.y } : style}
          onInteractOutside={(event) => {
            onInteractOutside?.(event);

            if (floating) {
              event.preventDefault();
            }
          }}
          {...rest}
        >
          <SheetFloatContext.Provider value={float ? { ...float, floating } : null}>
            {children}
          </SheetFloatContext.Provider>
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
  const { cssOverride, children, onPointerDown, ...rest } = props;
  const float = useContext(SheetFloatContext);
  const draggable = !!float?.enabled;

  return (
    <div
      data-draggable={draggable ? 'true' : undefined}
      css={scopedMerge(styles.header, draggable && styles.draggableHeader, cssOverride)}
      onPointerDown={(event) => {
        onPointerDown?.(event);
        float?.startDrag(event);
      }}
      {...rest}
    >
      <div css={scoped(styles.titleGroup)}>
        {draggable && <Move size={14} aria-hidden="true" css={scoped(styles.moveIcon)} />}
        <div css={scoped(styles.titleContent)}>{children}</div>
      </div>
      <div css={scoped(styles.actionGroup)}>
        {float?.floating && (
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label={__('Dock to the right', 'kirki-ecommerce')}
            onClick={float.dock}
          >
            <PanelRight aria-hidden="true" color={theme.colors.icon.primary} />
          </Button>
        )}
        <SheetPrimitive.Close asChild>
          <Button variant="ghost" size="icon-sm" aria-label={__('Close', 'kirki-ecommerce')}>
            <X aria-hidden="true" color={theme.colors.icon.primary} />
          </Button>
        </SheetPrimitive.Close>
      </div>
    </div>
  );
};

SheetHeader.displayName = 'SheetHeader';

const SheetFooter = (props: SheetSectionProps) => {
  const { cssOverride, ...rest } = props;

  return <div css={scopedMerge(styles.footer, cssOverride)} {...rest} />;
};

SheetFooter.displayName = 'SheetFooter';

type SheetSeparatorProps = Omit<ComponentPropsWithoutRef<typeof Separator>, 'negativeMargin'>;

const SheetSeparator = (props: SheetSeparatorProps) => {
  return <Separator negativeMargin={SHEET_PADDING} {...props} />;
};

SheetSeparator.displayName = 'SheetSeparator';

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
  SheetSeparator,
  SheetTitle,
  SheetTrigger,
};

export type { SheetSide };

const SHEET_PADDING = 16;
const FLOAT_MAX_HEIGHT = 720;

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

const SHEET_CONTENT_WIDTH = '360px';

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
    width: SHEET_CONTENT_WIDTH,
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
    width: SHEET_CONTENT_WIDTH,
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
    padding: theme.spacing[3],
    rowGap: theme.spacing[2],
    '&:focus, &:focus-visible': {
      outline: 'none',
    },
  },
  floating: {
    width: '360px',
    maxHeight: `min(${FLOAT_MAX_HEIGHT}px, calc(100vh - ${FLOAT_MARGIN * 2}px))`,
    border: `1px solid ${theme.colors.border.default}`,
    borderRadius: theme.radius.xl,
    overflow: 'hidden',
  },
  draggableHeader: {
    cursor: 'move',
    userSelect: 'none',
    touchAction: 'none',
  },
  moveIcon: {
    flexShrink: 0,
    color: theme.colors.text.secondary,
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexShrink: 0,
    columnGap: theme.spacing[2],
  },
  titleGroup: {
    display: 'flex',
    alignItems: 'center',
    flex: 1,
    columnGap: theme.spacing[2],
    minWidth: 0,
  },
  titleContent: {
    display: 'flex',
    flexDirection: 'column',
    rowGap: theme.spacing[1],
    minWidth: 0,
  },
  actionGroup: {
    display: 'flex',
    alignItems: 'center',
    flexShrink: 0,
  },
  footer: {
    display: 'flex',
    alignItems: 'center',
    flexShrink: 0,
    justifyContent: 'flex-end',
    columnGap: theme.spacing[2],
    marginTop: 'auto',
  },
  title: {
    margin: 0,
    ...theme.typography.paragraph('semibold'),
    color: theme.colors.text.primary,
  },
  description: {
    margin: 0,
    ...theme.typography.small(),
    color: theme.colors.text.secondary,
  },
});
