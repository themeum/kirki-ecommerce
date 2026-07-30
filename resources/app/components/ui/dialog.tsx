import { keyframes, type CSSObject } from '@emotion/react';
import { forwardRef, type ComponentPropsWithoutRef, type ElementRef, type HTMLAttributes } from 'react';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import { X } from 'lucide-react';

import Button from '@/components/ui/button';
import { getPortalContainer } from '@/libs/portal-container';
import { theme } from '@/theme';
import { mergeCss, scopedMerge } from '@/theme/mixins';

const Dialog = DialogPrimitive.Root;

const DialogTrigger = DialogPrimitive.Trigger;

const DialogPortal = ({
  ...props
}: ComponentPropsWithoutRef<typeof DialogPrimitive.Portal>) => {
  return (
    <DialogPrimitive.Portal container={getPortalContainer()} {...props} />
  );
};

DialogPortal.displayName = 'DialogPortal';

const DialogClose = DialogPrimitive.Close;

type DialogOverlayProps = Omit<
  ComponentPropsWithoutRef<typeof DialogPrimitive.Overlay>,
  'className'
> & {
  cssOverride?: CSSObject;
};

const DialogOverlay = forwardRef<
  ElementRef<typeof DialogPrimitive.Overlay>,
  DialogOverlayProps
>((props, ref) => {
  const { cssOverride, ...rest } = props;

  return (
    <DialogPrimitive.Overlay ref={ref} css={scopedMerge(styles.overlay, cssOverride)} {...rest} />
  );
});

DialogOverlay.displayName = 'DialogOverlay';

type DialogContentProps = Omit<
  ComponentPropsWithoutRef<typeof DialogPrimitive.Content>,
  'className'
> & {
  cssOverride?: CSSObject;
};

const DialogContent = forwardRef<
  ElementRef<typeof DialogPrimitive.Content>,
  DialogContentProps
>((props, ref) => {
  const { cssOverride, children, ...rest } = props;

  return (
    <DialogPortal>
      <DialogOverlay />
      <DialogPrimitive.Content
        ref={ref}
        css={scopedMerge(styles.content, cssOverride)}
        {...rest}
      >
        {children}
      </DialogPrimitive.Content>
    </DialogPortal>
  );
});

DialogContent.displayName = 'DialogContent';

const DialogCloseButton = forwardRef<
  HTMLButtonElement,
  ComponentPropsWithoutRef<typeof Button>
>((props, ref) => {
  const { cssOverride, ...rest } = props;

  return (
    <DialogPrimitive.Close asChild>
      <Button
        ref={ref}
        variant="ghost"
        size="icon"
        aria-label="Close"
        cssOverride={mergeCss(styles.closeButton, cssOverride)}
        {...rest}
      >
        <X size={16} aria-hidden="true" />
      </Button>
    </DialogPrimitive.Close>
  );
});

DialogCloseButton.displayName = 'DialogCloseButton';

type DialogSectionProps = Omit<HTMLAttributes<HTMLDivElement>, 'className'> & {
  cssOverride?: CSSObject;
};

const DialogHeader = (props: DialogSectionProps) => {
  const { cssOverride, ...rest } = props;

  return <div css={scopedMerge(styles.header, cssOverride)} {...rest} />;
};

DialogHeader.displayName = 'DialogHeader';

const DialogFooter = (props: DialogSectionProps) => {
  const { cssOverride, ...rest } = props;

  return <div css={scopedMerge(styles.footer, cssOverride)} {...rest} />;
};

DialogFooter.displayName = 'DialogFooter';

const DialogBody = (props: DialogSectionProps) => {
  const { cssOverride, ...rest } = props;

  return <div css={scopedMerge(styles.body, cssOverride)} {...rest} />;
};

DialogBody.displayName = 'DialogBody';

type DialogTitleProps = Omit<
  ComponentPropsWithoutRef<typeof DialogPrimitive.Title>,
  'className'
> & {
  cssOverride?: CSSObject;
};

const DialogTitle = forwardRef<
  ElementRef<typeof DialogPrimitive.Title>,
  DialogTitleProps
>((props, ref) => {
  const { cssOverride, ...rest } = props;

  return (
    <DialogPrimitive.Title ref={ref} css={scopedMerge(styles.title, cssOverride)} {...rest} />
  );
});

DialogTitle.displayName = 'DialogTitle';

type DialogDescriptionProps = Omit<
  ComponentPropsWithoutRef<typeof DialogPrimitive.Description>,
  'className'
> & {
  cssOverride?: CSSObject;
};

const DialogDescription = forwardRef<
  ElementRef<typeof DialogPrimitive.Description>,
  DialogDescriptionProps
>((props, ref) => {
  const { cssOverride, ...rest } = props;

  return (
    <DialogPrimitive.Description
      ref={ref}
      css={scopedMerge(styles.description, cssOverride)}
      {...rest}
    />
  );
});

DialogDescription.displayName = 'DialogDescription';

export {
  Dialog,
  DialogPortal,
  DialogOverlay,
  DialogTrigger,
  DialogClose,
  DialogCloseButton,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogBody,
  DialogTitle,
  DialogDescription,
};

const dialogOverlayIn = keyframes({
  from: { opacity: 0 },
  to: { opacity: 1 },
});

const dialogOverlayOut = keyframes({
  from: { opacity: 1 },
  to: { opacity: 0 },
});

const dialogContentIn = keyframes({
  from: {
    opacity: 0,
    transform: 'translate(-50%, -50%) scale(0.95)',
  },
  to: {
    opacity: 1,
    transform: 'translate(-50%, -50%) scale(1)',
  },
});

const dialogContentOut = keyframes({
  from: {
    opacity: 1,
    transform: 'translate(-50%, -50%) scale(1)',
  },
  to: {
    opacity: 0,
    transform: 'translate(-50%, -50%) scale(0.95)',
  },
});

const styles = {
  overlay: ({
    position: 'fixed',
    inset: 0,
    zIndex: 1000,
    background: 'color-mix(in oklab, #000 10%, transparent)',
    backdropFilter: 'blur(4px)',
    WebkitBackdropFilter: 'blur(4px)',
    '&[data-state="open"]': {
      animation: `${dialogOverlayIn} 150ms ease`,
    },
    '&[data-state="closed"]': {
      animation: `${dialogOverlayOut} 150ms ease`,
    },
  } satisfies CSSObject),
  content: ({
    position: 'fixed',
    left: '50%',
    top: '50%',
    zIndex: 1001,
    display: 'flex',
    flexDirection: 'column',
    width: '512px',
    maxWidth: `calc(100vw - ${theme.spacing[8]})`,
    maxHeight: '85%',
    transform: 'translate(-50%, -50%)',
    border: `1px solid ${theme.colors.border.default}`,
    borderRadius: theme.radius.lg,
    backgroundColor: theme.colors.background.fill,
    boxShadow: theme.shadow.lg,
    boxSizing: 'border-box',
    overflow: 'hidden',
    color: theme.colors.text.primary,
    '&:focus, &:focus-visible': {
      outline: 'none',
    },
    '&[data-state="open"]': {
      animation: `${dialogContentIn} 200ms ease`,
    },
    '&[data-state="closed"]': {
      animation: `${dialogContentOut} 200ms ease`,
    },
  } satisfies CSSObject),
  closeButton: ({
    position: 'absolute',
    top: theme.spacing[3],
    right: theme.spacing[3],
  } satisfies CSSObject),
  header: ({
    display: 'flex',
    flexDirection: 'column',
    rowGap: theme.spacing[2],
    padding: `${theme.spacing[4]} ${theme.spacing[6]}`,
    paddingRight: theme.spacing[12],
  } satisfies CSSObject),
  footer: ({
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'flex-end',
    columnGap: theme.spacing[2],
    padding: `${theme.spacing[4]} ${theme.spacing[6]}`,
  } satisfies CSSObject),
  title: ({
    margin: 0,
    ...theme.typography.large('semibold'),
    color: theme.colors.text.primary,
  } satisfies CSSObject),
  description: ({
    margin: 0,
    ...theme.typography.small(),
    color: theme.colors.text.secondary,
  } satisfies CSSObject),
  body: ({
    display: 'flex',
    flexDirection: 'column',
    rowGap: theme.spacing[2],
    padding: `${theme.spacing[4]} ${theme.spacing[6]}`,
    overflowY: 'auto',
  } satisfies CSSObject),
};
