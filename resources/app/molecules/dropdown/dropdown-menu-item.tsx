import { forwardRef, type ReactNode, type MouseEventHandler } from 'react';
import classNames from 'classnames';

import { CLASS_PREFIX } from '@/conf';
import { CheckedIcon, DropdownSubmenuIcon } from '@/icons';
import type { DropdownItemState, StyleProps } from '@/types';

type MenuItemState = DropdownItemState | 'hasChild';

type DropdownMenuItemProps = StyleProps & {
  children?: ReactNode;
  onItemClick?: (value?: string | number) => void;
  state?: MenuItemState;
  leftIcon?: ReactNode;
  rightContent?: ReactNode;
  value?: string | number;
  onMouseEnter?: MouseEventHandler<HTMLDivElement>;
  onMouseLeave?: MouseEventHandler<HTMLDivElement>;
  checkboxField?: boolean;
};

const DropdownMenuItem = forwardRef<HTMLDivElement, DropdownMenuItemProps>(
  (props, ref) => {
    const {
      children,
      style = {},
      className = '',
      onItemClick,
      state,
      leftIcon,
      rightContent,
      value,
      onMouseEnter,
      onMouseLeave,
      checkboxField,
    } = props;
    const dropdownItemVariants: {
      state: Record<string, string>;
      default: string;
    } = {
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
      state ? dropdownItemVariants.state[state] : undefined,
      className,
    );

    const handleItemClick = () => {
      if (onItemClick) {
        onItemClick(value);
      }
    };
    return (
      <div
        ref={ref}
        className={`${allClassNames} ${state === 'defaultSelected' ? `${CLASS_PREFIX}-disabled` : ''}`}
        style={style}
        onClick={handleItemClick}
        onMouseEnter={onMouseEnter}
        onMouseLeave={onMouseLeave}
      >
        {state === 'defaultSelected' && !checkboxField && (
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
        {state === 'hasChild' && (
          <span className={`${CLASS_PREFIX}-dropdown-right-icon`}>
            {<DropdownSubmenuIcon />}
          </span>
        )}
      </div>
    );
  },
);

export default DropdownMenuItem;
