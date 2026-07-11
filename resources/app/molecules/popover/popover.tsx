import {
  useEffect,
  useRef,
  type PointerEvent,
  type ReactNode,
} from 'react';
import { createPortal } from 'react-dom';

import { CLASS_PREFIX } from '@/conf';
import type { StyleProps } from '@/types';

type PopoverProps = StyleProps & {
  children?: ReactNode;
  isOpen?: boolean;
  onClose?: () => void;
  dark?: boolean;
  darkBackdrop?: boolean;
};

const Popover = (props: PopoverProps) => {
  const {
    children,
    isOpen,
    onClose = () => {},
    style = {},
    className = '',
    dark,
    darkBackdrop = true,
  } = props;
  const alertboxRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen || !alertboxRef.current) {
      return;
    }

    const element = alertboxRef.current;

    const updatePosition = () => {
      const alertboxRect = element.getBoundingClientRect();
      element.style.left = `${
        window.innerWidth / 2 - alertboxRect.width / 2
      }px`;
      element.style.top = `${
        window.innerHeight / 2 - alertboxRect.height / 2
      }px`;
    };
    updatePosition();

    window.addEventListener('resize', updatePosition);

    const resizeObserver = new ResizeObserver(() => {
      updatePosition();
    });

    resizeObserver.observe(element);

    return () => {
      window.removeEventListener('resize', updatePosition);
      resizeObserver.disconnect();
    };
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen) {
    return null;
  }

  const popover = (
    <div
      className={`${CLASS_PREFIX}-popover-backdrop ${
        darkBackdrop ? `${CLASS_PREFIX}-dark-backdrop` : ''
      }`}
      onPointerDown={(e: PointerEvent<HTMLDivElement>) => {
        if (alertboxRef.current && !alertboxRef.current.contains(e.target as Node)) {
          onClose?.();
        }
      }}
    >
      <div
        ref={alertboxRef}
        className={`${CLASS_PREFIX}-popover ${
          dark ? `${CLASS_PREFIX}-popover-dark` : ''
        } ${className}`}
        style={style}
        onPointerDown={(e: PointerEvent<HTMLDivElement>) => {
          e.stopPropagation();
        }}
      >
        {children}
      </div>
    </div>
  );
  return createPortal(popover, document.body);
};

export default Popover;
