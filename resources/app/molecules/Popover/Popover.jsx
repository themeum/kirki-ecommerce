import React, { useEffect, useRef } from "react";
import { CLASS_PREFIX } from "@/conf";
import { createPortal } from "react-dom";

const Popover = (props) => {
  const {
    children,
    isOpen,
    onClose = () => {},
    style = {},
    className = "",
    dark,
    darkBackdrop = true,
  } = props;
  const alertboxRef = useRef(null);

  useEffect(() => {
    if (!isOpen || !alertboxRef.current) return;

    const element = alertboxRef.current;

    const updatePosition = () => {
      const leftPanelWidth =
        document.getElementById("adminmenuwrap")?.offsetWidth;
      const topPanelHeight =
        document.getElementById("wpadminbar")?.offsetHeight;
      const alertboxRect = element.getBoundingClientRect();
      element.style.left = `${
        window.innerWidth / 2 - alertboxRect.width / 2 // - leftPanelWidth
      }px`;
      element.style.top = `${
        window.innerHeight / 2 - alertboxRect.height / 2 //  - topPanelHeight
      }px`;
    };
    // Run once on open
    updatePosition();

    // Recalculate on resize
    window.addEventListener("resize", updatePosition);

    const resizeObserver = new ResizeObserver(() => {
      updatePosition();
    });

    resizeObserver.observe(element);

    return () => {
      window.removeEventListener("resize", updatePosition);
      resizeObserver.disconnect();
    };
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    }

    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const popover = (
    <div
      className={`${CLASS_PREFIX}-popover-backdrop ${
        darkBackdrop ? `${CLASS_PREFIX}-dark-backdrop` : ""
      }`}
      onPointerDown={(e) => {
        // Only close if click is NOT inside dropdown
        if (alertboxRef.current && !alertboxRef.current.contains(e.target)) {
          onClose?.();
        }
      }}
    >
      <div
        ref={alertboxRef}
        className={`${CLASS_PREFIX}-popover ${
          dark ? `${CLASS_PREFIX}-popover-dark` : ""
        } ${className}`}
        style={style}
        onPointerDown={(e) => {
          // Prevent bubbling to backdrop
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
