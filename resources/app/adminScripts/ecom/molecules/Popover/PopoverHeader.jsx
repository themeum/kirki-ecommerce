import React from "react";
import { CLASS_PREFIX } from "conf";
import { CloseIcon } from "icons";
import Button from "../Button";

const PopoverHeader = (props) => {
  const {
    children,
    onClose,
    leftIcon,
    rightIcon,
    className = "",
    style = {},
    borderBottom = false,
  } = props;
  return (
    <div
      className={`${CLASS_PREFIX}-popover-header`}
      style={{
        borderBottom: borderBottom
          ? "1px solid var(--decom-border-border)"
          : "",
        ...style,
      }}
    >
      <div className={`${CLASS_PREFIX}-popover-header-title ${className}`}>
        {leftIcon && (
          <span className={`${CLASS_PREFIX}-svg-class`}>{leftIcon}</span>
        )}
        {children}
        {rightIcon && (
          <span className={`${CLASS_PREFIX}-svg-class`}>{rightIcon}</span>
        )}
      </div>
      <div style={{ cursor: "pointer" }} onClick={onClose}>
        {onClose && <Button icon={<CloseIcon />} size="small" type="ghost" />}
      </div>
    </div>
  );
};

export default PopoverHeader;
