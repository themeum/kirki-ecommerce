import {
  useEffect,
  useRef,
  type PointerEvent,
  type ReactNode,
  type RefObject,
} from 'react';
import { createPortal } from 'react-dom';

import { CLASS_PREFIX } from '@/conf';

type SelectDropdownProps = {
  children?: ReactNode;
  isOpen?: boolean;
  triggerRef: RefObject<HTMLElement | null>;
  onClose?: () => void;
  small?: boolean;
  setIsOpen?: (open: boolean) => void;
};

const SelectDropdown = (props: SelectDropdownProps) => {
  const { children, isOpen, triggerRef, onClose, small } = props;

  const dropdownRef = useRef<HTMLDivElement>(null);

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

        if (spaceBelow < dropdownRect.height) {
          dropdown.style.top = `${
            window.scrollY + triggerRect.top - dropdownRect.height - 4
          }px`;
        } else {
          dropdown.style.top = `${window.scrollY + triggerRect.bottom + 4}px`;
        }
        dropdown.style.width = `${
          small ? dropdown.scrollWidth : triggerRect.width
        }px`;
        if ((dropdown as HTMLDivElement & { width?: number }).width! > triggerRect.width) {
          dropdown.style.left = `${triggerRect.left - (dropdownRect.width - triggerRect.width) / 2 + window.scrollX}px`;
        } else {
          dropdown.style.left = `${triggerRect.left + window.scrollX}px`;
        }
      }
    };
    updatePosition();

    window.addEventListener('resize', updatePosition);

    return () => {
      window.removeEventListener('resize', updatePosition);
    };
  }, [isOpen]);

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
        ref={dropdownRef}
        className={`${CLASS_PREFIX}-select-content`}
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

export default SelectDropdown;
