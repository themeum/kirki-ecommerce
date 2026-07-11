import {
  useEffect,
  useRef,
  type PointerEvent,
  type ReactNode,
  type RefObject,
} from 'react';
import { createPortal } from 'react-dom';
import classNames from 'classnames';

import { CLASS_PREFIX } from '@/conf';
import type { DropdownPosition, DropdownSize, StyleProps } from '@/types';

type DropdownMenuContentSize = DropdownSize | 'large';

type DropdownMenuContentProps = StyleProps & {
  children?: ReactNode;
  isOpen?: boolean;
  onClose?: () => void;
  triggerRef: RefObject<HTMLElement | null>;
  size?: DropdownMenuContentSize;
  position?: DropdownPosition;
  onMouseLeave?: () => void;
  onMouseEnter?: () => void;
  hasLeftIcon?: boolean;
  isFullWidth?: boolean;
};

const DropdownMenuContent = (props: DropdownMenuContentProps) => {
  const {
    children,
    className = '',
    style = {},
    isOpen,
    onClose,
    triggerRef,
    size = 'default',
    position = {
      bottom: true,
    },
    onMouseLeave,
    onMouseEnter,
    hasLeftIcon,
    isFullWidth,
  } = props;
  const dropdownRef = useRef<HTMLDivElement>(null);

  const dropdownVariants: {
    size: Record<DropdownMenuContentSize, string>;
    default: string;
    hasLeftIcon: string;
  } = {
    size: {
      small: `${CLASS_PREFIX}-dropdown-content-small`,
      large: `${CLASS_PREFIX}-dropdown-content-large`,
      default: `${CLASS_PREFIX}-dropdown-content-default`,
    },
    default: `${CLASS_PREFIX}-dropdown-menu-content`,
    hasLeftIcon: `${CLASS_PREFIX}-dropdown-left-icon`,
  };

  const allClassNames = classNames(
    dropdownVariants.default,
    dropdownVariants.size[size],
    hasLeftIcon && dropdownVariants.hasLeftIcon,
    className,
  );

  useEffect(() => {
    if (!isOpen) {
      return;
    }
    const updatePosition = () => {
      if (isOpen && triggerRef.current && dropdownRef.current) {
        const triggerRect = triggerRef.current.getBoundingClientRect();
        const dropdown = dropdownRef.current;
        const dropdownRect = dropdownRef.current.getBoundingClientRect();
        const spaceBelow = window.innerHeight - triggerRect.bottom;
        const spaceRight = window.innerWidth - triggerRect.right;
        const spaceLeft = triggerRect.left - dropdownRect.width;

        if (position?.right) {
          if (spaceRight < dropdownRect.width) {
            dropdown.style.left = `${
              window.scrollX + triggerRect.left - dropdownRect.width
            }px`;
          } else {
            const leftPosition = window.scrollX + triggerRect.right;
            dropdown.style.left = `${leftPosition}px`;
          }
          if (spaceBelow < dropdownRect.height) {
            dropdown.style.top = `${
              window.scrollY + triggerRect.bottom - dropdownRect.height
            }px`;
          } else {
            dropdown.style.top = `${window.scrollY + triggerRect.top}px`;
          }
        } else if (position?.left) {
          if (spaceLeft < dropdownRect.width) {
            const leftPosition = window.scrollX + triggerRect.right - 4;
            dropdown.style.left = `${leftPosition}px`;
          } else {
            const leftPosition =
              window.scrollX + triggerRect.left - dropdownRect.width + 4;
            dropdown.style.left = `${leftPosition}px`;
          }
          if (spaceBelow < dropdownRect.height) {
            dropdown.style.top = `${
              window.scrollY + triggerRect.bottom - dropdownRect.height
            }px`;
          } else {
            dropdown.style.top = `${window.scrollY + triggerRect.top}px`;
          }
        } else {
          if (spaceBelow < dropdownRect.height) {
            dropdown.style.top = `${
              window.scrollY + triggerRect.top - dropdownRect.height - 4
            }px`;
          } else {
            dropdown.style.top = `${window.scrollY + triggerRect.bottom + 4}px`;
          }
          if (!size || isFullWidth) {
            dropdown.style.width = `${
              isFullWidth ? triggerRect.width : dropdown.scrollWidth
            }px`;
          }
          const centerShift =
            dropdownRect.width > triggerRect.width
              ? dropdown.scrollWidth - triggerRect.width
              : 0;
          dropdown.style.left = `${
            triggerRect.left + window.scrollX - centerShift / 2 - 2
          }px`;
        }
      }
    };
    updatePosition();

    window.addEventListener('resize', updatePosition);

    return () => {
      window.removeEventListener('resize', updatePosition);
    };
  }, [isOpen]);

  const handleMouseLeave = () => {
    if (triggerRef.current) {
      triggerRef.current.classList.remove(
        `${CLASS_PREFIX}-dropdown-item-active`,
      );
    }
    if (onMouseLeave) {
      onMouseLeave();
    }
  };

  const handleMouseEnter = () => {
    if (triggerRef.current) {
      triggerRef.current.classList.add(`${CLASS_PREFIX}-dropdown-item-active`);
    }
    if (onMouseLeave) {
      onMouseEnter?.();
    }
  };

  if (!isOpen) {
    return null;
  }

  const dropdown = (
    <>
      <div
        className={`${CLASS_PREFIX}-backdrop-transparent`}
        onPointerDown={(e: PointerEvent<HTMLDivElement>) => {
          if (
            dropdownRef.current &&
            !dropdownRef.current.contains(e.target as Node)
          ) {
            onClose?.();
          }
        }}
      />
      <div
        onMouseLeave={handleMouseLeave}
        onMouseEnter={handleMouseEnter}
        ref={dropdownRef}
        className={allClassNames}
        style={style}
        onPointerDown={(e: PointerEvent<HTMLDivElement>) => {
          e.stopPropagation();
        }}
      >
        {children}
      </div>
    </>
  );

  return createPortal(dropdown, document.body);
};

export default DropdownMenuContent;
