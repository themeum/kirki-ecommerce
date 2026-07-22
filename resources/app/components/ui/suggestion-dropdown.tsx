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
import { getPortalContainer } from '@/libs/portal-container';

type SuggestionDropdownProps = {
  children?: ReactNode;
  isOpen?: boolean;
  triggerRef: RefObject<HTMLElement | null>;
  onClose?: () => void;
  setIsOpen?: (open: boolean) => void;
  className?: string;
};

const SuggestionDropdown = ({
  children,
  isOpen,
  triggerRef,
  onClose,
  className,
}: SuggestionDropdownProps) => {
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const updatePosition = () => {
      if (!triggerRef.current || !dropdownRef.current) {
        return;
      }

      const triggerRect = triggerRef.current.getBoundingClientRect();
      const dropdown = dropdownRef.current;
      const dropdownRect = dropdown.getBoundingClientRect();
      const spaceBelow = window.innerHeight - triggerRect.bottom;

      if (spaceBelow < dropdownRect.height) {
        dropdown.style.top = `${
          window.scrollY + triggerRect.top - dropdownRect.height - 4
        }px`;
      } else {
        dropdown.style.top = `${window.scrollY + triggerRect.bottom + 4}px`;
      }
      dropdown.style.left = `${triggerRect.left + window.scrollX}px`;
      dropdown.style.width = `${triggerRect.width}px`;
    };

    updatePosition();
    window.addEventListener('resize', updatePosition);

    return () => {
      window.removeEventListener('resize', updatePosition);
    };
  }, [isOpen, triggerRef]);

  if (!isOpen) {
    return null;
  }

  return createPortal(
    <>
      <div
        className={`${CLASS_PREFIX}-ui-suggestion-backdrop`}
        onPointerDown={(e: PointerEvent) => {
          if (
            dropdownRef.current &&
            !dropdownRef.current.contains(e.target as Node)
          ) {
            onClose?.();
          }
        }}
      />
      <div
        ref={dropdownRef}
        role="listbox"
        className={classNames(
          `${CLASS_PREFIX}-ui-suggestion-dropdown`,
          className,
        )}
        onPointerDown={(e: PointerEvent) => {
          e.stopPropagation();
        }}
      >
        {children}
      </div>
    </>,
    getPortalContainer(),
  );
};

SuggestionDropdown.displayName = 'SuggestionDropdown';

export default SuggestionDropdown;
