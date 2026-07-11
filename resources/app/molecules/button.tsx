import type { ReactNode, CSSProperties, MouseEvent, Ref } from 'react';
import { forwardRef } from 'react';
import classNames from 'classnames';

import { LoadingIcon } from '@/icons';
import { CLASS_PREFIX } from '@/conf';
import type { ButtonSize, ButtonType, ButtonState } from '@/types';

type ButtonProps = {
  text?: ReactNode;
  type?: ButtonType;
  size?: ButtonSize;
  state?: ButtonState;
  onClick?: () => void;
  className?: string;
  style?: CSSProperties;
  icon?: ReactNode;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  href?: string;
  target?: string;
  contentStyle?: CSSProperties;
};

const Button = forwardRef<HTMLSpanElement | HTMLAnchorElement, ButtonProps>(
  (props, ref) => {
    const {
      text,
      type,
      size,
      state,
      onClick,
      className,
      style = {},
      icon,
      leftIcon,
      rightIcon,
      href,
      target = 'blank',
      contentStyle = {},
    } = props;

    const buttonRef = ref;

    const buttonVariants = {
      type: {
        primary: `${CLASS_PREFIX}-btn-primary`,
        secondary: `${CLASS_PREFIX}-btn-secondary`,
        destructive: `${CLASS_PREFIX}-btn-destructive`,
        outlined: `${CLASS_PREFIX}-btn-outlined`,
        ghost: `${CLASS_PREFIX}-btn-ghost`,
        primarySoft: `${CLASS_PREFIX}-btn-primary-soft`,
        destructiveSoft: `${CLASS_PREFIX}-btn-destructive-soft`,
        link: `${CLASS_PREFIX}-btn-link`,
        inverse: `${CLASS_PREFIX}-btn-inverse`,
        blank: `${CLASS_PREFIX}-btn-blank`,
        tartiary: `${CLASS_PREFIX}-btn-tartiary`,
        invisible: `${CLASS_PREFIX}-btn-invisible`,
      },
      size: {
        small: `${CLASS_PREFIX}-btn-small`,
        large: `${CLASS_PREFIX}-btn-large`,
        icon: `${CLASS_PREFIX}-btn-icon`,
        fullWidth: `${CLASS_PREFIX}-btn-fullwidth`,
        xsm: `${CLASS_PREFIX}-btn-xsm`,
      },
      state: {
        loading: `${CLASS_PREFIX}-btn-loading ${CLASS_PREFIX}-btn-disabled`,
        disabled: `${CLASS_PREFIX}-btn-disabled`,
        active: `${CLASS_PREFIX}-btn-active`,
        hover: `${CLASS_PREFIX}-btn-hover`,
      },
      default: `${CLASS_PREFIX}-btn`,
    };

    const allClassNames = classNames(
      buttonVariants.default,
      type ? buttonVariants.type[type] : undefined,
      size ? buttonVariants.size[size] : undefined,
      icon ? buttonVariants.size.icon : undefined,
      state ? buttonVariants.state[state] : undefined,
      className,
    );

    const handleOnClick = (e: MouseEvent) => {
      if (onClick) {
        e.stopPropagation();
        onClick();
      }
    };

    let content = icon ? (
      <span className={`${CLASS_PREFIX}-btn-content`}>
        {state === 'loading' ? <LoadingIcon /> : icon}
      </span>
    ) : (
      <span className={`${CLASS_PREFIX}-btn-content`} style={contentStyle}>
        {state === 'loading' ? <LoadingIcon /> : leftIcon}
        {text}
        {rightIcon}
      </span>
    );

    return href ? (
      <a
        className={allClassNames}
        ref={buttonRef as Ref<HTMLAnchorElement>}
        role="button"
        href={href}
        target={target}
        rel="noreferrer"
        style={style}
        onClick={handleOnClick}
      >
        {content}
      </a>
    ) : (
      <span
        className={allClassNames}
        ref={buttonRef as Ref<HTMLSpanElement>}
        role="button"
        style={style}
        onClick={handleOnClick}
      >
        {content}
      </span>
    );
  },
);

export default Button;
