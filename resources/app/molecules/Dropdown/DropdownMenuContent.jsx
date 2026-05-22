import React, { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { CLASS_PREFIX } from "@/conf";
import classNames from "classnames";

const DropdownMenuContent = (props) => {
  const {
    children,
    className = "",
    style = {},
    isOpen,
    onClose,
    triggerRef,
    size = "default",
    position = {
      bottom: true,
    },
    onMouseLeave,
    onMouseEnter,
    hasLeftIcon,
    isFullWidth,
  } = props;
  const dropdownRef = useRef(null);

  const dropdownVariants = {
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
    if (!isOpen) return;
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
            // open upwards
            dropdown.style.top = `${
              window.scrollY + triggerRect.bottom - dropdownRect.height
            }px`;
          } else dropdown.style.top = `${window.scrollY + triggerRect.top}px`;
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
            // open upwards
            dropdown.style.top = `${
              window.scrollY + triggerRect.bottom - dropdownRect.height
            }px`;
          } else dropdown.style.top = `${window.scrollY + triggerRect.top}px`;
        } else {
          if (spaceBelow < dropdownRect.height) {
            // open upwards
            dropdown.style.top = `${
              window.scrollY + triggerRect.top - dropdownRect.height - 4
            }px`;
          } else {
            // open downwards
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

        // TODO: Refactor
        // triggerRef.current.classList.add(`${CLASS_PREFIX}-dropdown-item-active`);
        // triggerRef.current.tabIndex = 1;
        // triggerRef.current.focus();

        // Dynamic positioning (flip if near bottom)
        // if (spaceBelow < dropdownRect.height) {
        //   // open upwards
        //   dropdown.style.top = `${
        //     window.scrollY + triggerRect.top - dropdownRect.height - 4
        //   }px`;
        // } else {
        //   // open downwards
        //   dropdown.style.top = `${window.scrollY + triggerRect.bottom + 4}px`;
        // }
        // const centerShift =
        //   dropdownRect.width > triggerRect.width
        //     ? dropdownRect.width - triggerRect.width
        //     : 0;
        // dropdown.style.left = `${
        //   triggerRect.left + window.scrollX - centerShift / 2
        // }px`;
        // dropdown.style.minWidth = `${triggerRect.width}px`;
      }
    };
    updatePosition();

    // Recalculate on resize
    window.addEventListener("resize", updatePosition);

    return () => {
      window.removeEventListener("resize", updatePosition);
    };
  }, [isOpen]);

  const handleMouseLeave = () => {
    if (triggerRef.current) {
      triggerRef.current.classList.remove(
        `${CLASS_PREFIX}-dropdown-item-active`,
      );
    }
    if (onMouseLeave) onMouseLeave();
  };

  const handleMouseEnter = () => {
    if (triggerRef.current) {
      triggerRef.current.classList.add(`${CLASS_PREFIX}-dropdown-item-active`);
    }
    if (onMouseLeave) onMouseEnter();
  };

  if (!isOpen) return null;

  const dropdown = (
    <>
      <div
        className={`${CLASS_PREFIX}-backdrop-transparent`}
        onPointerDown={(e) => {
          // Only close if click is NOT inside dropdown
          if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
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
        onPointerDown={(e) => {
          // Prevent bubbling to backdrop
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
