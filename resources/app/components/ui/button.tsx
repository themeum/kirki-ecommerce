import {
  forwardRef,
  type ComponentPropsWithoutRef,
} from 'react';
import { Slot } from '@radix-ui/react-slot';
import { Loader2 } from 'lucide-react';
import classNames from 'classnames';

import { CLASS_PREFIX } from '@/conf';

type ButtonVariant =
  | 'primary'
  | 'destructive'
  | 'outline'
  | 'secondary'
  | 'ghost'
  | 'link';

type ButtonSize = 'default' | 'sm' | 'lg' | 'icon';

type ButtonProps = ComponentPropsWithoutRef<'button'> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
  asChild?: boolean;
  loading?: boolean;
};

const Button = forwardRef<HTMLButtonElement, ButtonProps>((props, ref) => {
  const {
    className,
    variant = 'primary',
    size = 'default',
    asChild = false,
    loading = false,
    disabled,
    type = 'button',
    children,
    ...rest
  } = props;

  const isDisabled = Boolean(disabled || loading);
  const buttonClassName = classNames(
    `${CLASS_PREFIX}-ui-button`,
    `${CLASS_PREFIX}-ui-button--${variant}`,
    `${CLASS_PREFIX}-ui-button--${size}`,
    isDisabled && `${CLASS_PREFIX}-ui-button--disabled`,
    loading && `${CLASS_PREFIX}-ui-button--loading`,
    className,
  );

  if (asChild && !loading) {
    return (
      <Slot
        ref={ref}
        className={buttonClassName}
        {...rest}
      >
        {children}
      </Slot>
    );
  }

  return (
    <button
      ref={ref}
      type={type}
      disabled={isDisabled}
      aria-busy={loading || undefined}
      data-loading={loading ? 'true' : undefined}
      className={buttonClassName}
      {...rest}
    >
      {loading ? (
        <>
          <span
            className={`${CLASS_PREFIX}-ui-button-content ${CLASS_PREFIX}-ui-button-content--hidden`}
            aria-hidden="true"
          >
            {children}
          </span>
          <span className={`${CLASS_PREFIX}-ui-button-loader`}>
            <Loader2 size={16} aria-hidden="true" />
          </span>
        </>
      ) : (
        children
      )}
    </button>
  );
});

Button.displayName = 'Button';

export default Button;
