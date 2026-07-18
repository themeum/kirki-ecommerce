import {
  forwardRef,
  type ComponentPropsWithoutRef,
  type ElementRef,
  type HTMLAttributes,
} from 'react';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import { X } from 'lucide-react';
import classNames from 'classnames';

import Button from '@/components/ui/button';
import { CLASS_PREFIX } from '@/conf';
import { getPortalContainer } from '@/libs/portal-container';

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

const DialogOverlay = forwardRef<
  ElementRef<typeof DialogPrimitive.Overlay>,
  ComponentPropsWithoutRef<typeof DialogPrimitive.Overlay>
>((props, ref) => {
  const { className, ...rest } = props;

  return (
    <DialogPrimitive.Overlay
      ref={ref}
      className={classNames(`${CLASS_PREFIX}-ui-dialog-overlay`, className)}
      {...rest}
    />
  );
});

DialogOverlay.displayName = 'DialogOverlay';

const DialogContent = forwardRef<
  ElementRef<typeof DialogPrimitive.Content>,
  ComponentPropsWithoutRef<typeof DialogPrimitive.Content>
>((props, ref) => {
  const { className, children, ...rest } = props;

  return (
    <DialogPortal>
      <DialogOverlay />
      <DialogPrimitive.Content
        ref={ref}
        className={classNames(`${CLASS_PREFIX}-ui-dialog-content`, className)}
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
  const { className, ...rest } = props;

  return (
    <DialogPrimitive.Close asChild>
      <Button
        ref={ref}
        variant="ghost"
        size="icon"
        aria-label="Close"
        className={classNames(
          `${CLASS_PREFIX}-ui-dialog-close-button`,
          className,
        )}
        {...rest}
      >
        <X size={16} aria-hidden="true" />
      </Button>
    </DialogPrimitive.Close>
  );
});

DialogCloseButton.displayName = 'DialogCloseButton';

const DialogHeader = (props: HTMLAttributes<HTMLDivElement>) => {
  const { className, ...rest } = props;

  return (
    <div
      className={classNames(`${CLASS_PREFIX}-ui-dialog-header`, className)}
      {...rest}
    />
  );
};

DialogHeader.displayName = 'DialogHeader';

const DialogFooter = (props: HTMLAttributes<HTMLDivElement>) => {
  const { className, ...rest } = props;

  return (
    <div
      className={classNames(`${CLASS_PREFIX}-ui-dialog-footer`, className)}
      {...rest}
    />
  );
};

DialogFooter.displayName = 'DialogFooter';

const DialogTitle = forwardRef<
  ElementRef<typeof DialogPrimitive.Title>,
  ComponentPropsWithoutRef<typeof DialogPrimitive.Title>
>((props, ref) => {
  const { className, ...rest } = props;

  return (
    <DialogPrimitive.Title
      ref={ref}
      className={classNames(`${CLASS_PREFIX}-ui-dialog-title`, className)}
      {...rest}
    />
  );
});

DialogTitle.displayName = 'DialogTitle';

const DialogDescription = forwardRef<
  ElementRef<typeof DialogPrimitive.Description>,
  ComponentPropsWithoutRef<typeof DialogPrimitive.Description>
>((props, ref) => {
  const { className, ...rest } = props;

  return (
    <DialogPrimitive.Description
      ref={ref}
      className={classNames(`${CLASS_PREFIX}-ui-dialog-description`, className)}
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
  DialogTitle,
  DialogDescription,
};
