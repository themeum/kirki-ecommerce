import { type SerializedStyles } from '@emotion/react';
import {
  useEffect,
  useRef,
  type PointerEvent,
  type ReactNode,
  type RefObject,
} from 'react';
import { createPortal } from 'react-dom';

import { getPortalContainer } from '@/libs/portal-container';
import { theme } from '@/theme';
import { itemCenter, scoped } from '@/theme/mixins';

type SuggestionDropdownProps = {
  children?: ReactNode;
  isOpen?: boolean;
  triggerRef: RefObject<HTMLElement | null>;
  onClose?: () => void;
  setIsOpen?: (open: boolean) => void;
  css?: SerializedStyles;
};

const SuggestionDropdown = ({
  children,
  isOpen,
  triggerRef,
  onClose,
  css: cssProp,
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
        css={styles.backdrop}
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
        css={[styles.dropdown, cssProp]}
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

const styles = {
  backdrop: scoped({
    position: 'fixed',
    inset: 0,
    background: 'transparent',
    zIndex: 100,
  }),
  dropdown: scoped({
    padding: theme.spacing.xs,
    position: 'absolute',
    border: `1px solid ${theme.colors.border.default}`,
    borderRadius: theme.radius.md,
    boxShadow: '0px 4px 6px -1px #0000001a',
    backgroundColor: theme.colors.background.fill,
    zIndex: 101,
    boxSizing: 'border-box',
    maxHeight: '240px',
    overflowY: 'auto',
    scrollbarWidth: 'thin',
    scrollbarColor: `${theme.colors.background.fillBrand} ${theme.colors.background.surfaceTertiary}`,
    '&::-webkit-scrollbar': {
      height: '4px',
      width: '100%',
      WebkitAppearance: 'none',
    },
    '&::-webkit-scrollbar-track': {
      background: theme.colors.background.fill,
    },
    '&::-webkit-scrollbar-thumb': {
      backgroundColor: theme.colors.background.fillBrand,
      borderRadius: theme.radius.sm,
    },
  }),
  item: scoped({
    padding: `${theme.spacing.sm} ${theme.spacing.md}`,
    ...itemCenter(),
    justifyContent: 'flex-start',
    columnGap: theme.spacing.md,
    borderRadius: theme.radius.sm,
    cursor: 'pointer',
    '&:hover': {
      backgroundColor: theme.colors.background.surfaceSecondary,
    },
  }),
  icon: scoped({
    minWidth: '16px',
    ...itemCenter(),
  }),
  text: scoped({
    ...itemCenter(),
    columnGap: theme.spacing.md,
    maxWidth: '85%',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  }),
};

export const suggestionItemStyle = styles.item;
export const suggestionIconStyle = styles.icon;
export const suggestionTextStyle = styles.text;
