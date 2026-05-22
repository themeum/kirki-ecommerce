import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { CLASS_PREFIX } from "@/conf";

const SelectDropdown = (props) => {
  const { children, isOpen, triggerRef, onClose, small } = props;

  const dropdownRef = useRef(null);

  useEffect(() => {
    if (!isOpen) return;
    const updatePosition = () => {
      if (isOpen && triggerRef.current && dropdownRef.current) {
        const triggerRect = triggerRef?.current?.getBoundingClientRect();
        const dropdown = dropdownRef?.current;
        const dropdownRect = dropdownRef?.current?.getBoundingClientRect();
        const spaceBelow = window?.innerHeight - triggerRect?.bottom;

        // Dynamic positioning (flip if near bottom)
        if (spaceBelow < dropdownRect.height) {
          // open upwards
          dropdown.style.top = `${
            window.scrollY + triggerRect.top - dropdownRect.height - 4
          }px`;
        } else {
          // open downwards
          dropdown.style.top = `${window.scrollY + triggerRect.bottom + 4}px`;
        }
        // dropdown.style.left = `${triggerRect.left + window.scrollX - 4}px`;
        // dropdown.style.width = `${triggerRect.width}px`;
        dropdown.style.width = `${
          small ? dropdown.scrollWidth : triggerRect.width
        }px`;
        if (dropdown.width > triggerRect.width) {
          dropdown.style.left = `${triggerRect.left - (dropdownRect.width - triggerRect.width) / 2 + window.scrollX}px`;
        } else {
          dropdown.style.left = `${triggerRect.left + window.scrollX}px`;
        }
      }
    };
    updatePosition();

    // Recalculate on resize
    window.addEventListener("resize", updatePosition);

    return () => {
      window.removeEventListener("resize", updatePosition);
    };
  }, [isOpen]);

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
        ref={dropdownRef}
        className={`${CLASS_PREFIX}-select-content`}
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

export default SelectDropdown;
