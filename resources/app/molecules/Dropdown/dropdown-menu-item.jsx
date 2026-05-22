import React, { forwardRef } from "react";
import { CLASS_PREFIX } from "@/conf";
import classNames from "classnames";
import { CheckedIcon, DropdownSubmenuIcon } from "@/icons";

const DropdownMenuItem = forwardRef((props, ref) => {
  const {
    children,
    style = {},
    className = "",
    onItemClick,
    state,
    leftIcon,
    // rightItem,
    rightContent,
    value,
    onMouseEnter,
    onMouseLeave,
    checkboxField,
  } = props;
  const dropdownItemVariants = {
    state: {
      disabled: `${CLASS_PREFIX}-disabled`,
      titleOnly: `${CLASS_PREFIX}-dropdown-title`,
      defaultSelected: `${CLASS_PREFIX}-dropdown-item-selected`,
      hasChild: `${CLASS_PREFIX}-dropdown-has-child`,
    },
    default: `${CLASS_PREFIX}-dropdown-item`,
  };

  const allClassNames = classNames(
    dropdownItemVariants.default,
    dropdownItemVariants.state[state],
    className,
  );

  const handleItemClick = () => {
    if (onItemClick) onItemClick(value);
  };
  return (
    <div
      ref={ref}
      className={`${allClassNames} ${state === "defaultSelected" ? `${CLASS_PREFIX}-disabled` : ""}`}
      style={style}
      onClick={handleItemClick}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      {state === "defaultSelected" && !checkboxField && (
        <span className={`${CLASS_PREFIX}-dropdown-icon`}>
          <CheckedIcon />
        </span>
      )}
      {leftIcon && (
        <span className={`${CLASS_PREFIX}-dropdown-icon`}>{leftIcon}</span>
      )}
      <div className={`${CLASS_PREFIX}-dropdown-text-wrapper`}>{children}</div>
      {rightContent && (
        <span className={`${CLASS_PREFIX}-dropdown-right-icon`}>
          {rightContent}
        </span>
      )}
      {state === "hasChild" && (
        <span className={`${CLASS_PREFIX}-dropdown-right-icon`}>
          {<DropdownSubmenuIcon />}
        </span>
      )}
    </div>
  );
});

export default DropdownMenuItem;
