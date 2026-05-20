import React, { forwardRef } from "react";
import classNames from "classnames";
import { LoadingIcon } from "icons";
import { CLASS_PREFIX } from "conf";

const Button = forwardRef((props, ref) => {
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
    target = "blank",
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
    buttonVariants.type[type],
    buttonVariants.size[size],
    icon && buttonVariants.size.icon,
    buttonVariants.state[state],
    className,
  );

  const handleOnClick = (e) => {
    if (onClick) {
      e.stopPropagation();
      onClick();
    }
  };

  let content = icon ? (
    <span className={`${CLASS_PREFIX}-btn-content`}>
      {state === "loading" ? <LoadingIcon /> : icon}
    </span>
  ) : (
    <span className={`${CLASS_PREFIX}-btn-content`} style={contentStyle}>
      {state === "loading" ? <LoadingIcon /> : leftIcon}
      {text}
      {rightIcon}
    </span>
  );

  return href ? (
    <a
      className={allClassNames}
      ref={buttonRef}
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
      ref={buttonRef}
      role="button"
      style={style}
      onClick={handleOnClick}
    >
      {content}
    </span>
  );
});

export default Button;
