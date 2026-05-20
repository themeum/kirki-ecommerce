import { CLASS_PREFIX } from "conf";
import React from "react";
import { useEffect } from "react";
import { useRef } from "react";
import { useState } from "react";
import { createPortal } from "react-dom";

const Tooltip = (props) => {
  const {
    tip,
    children,
    type,
    position = "bottom",
    offset = 2,
    style = {},
    className = "",
  } = props;
  const tooltipRef = useRef(null);
  const triggerRef = useRef(null);

  const [openTooltip, setOpenTooltip] = useState(false);

  useEffect(() => {
    if (openTooltip && triggerRef.current && tooltipRef.current) {
      getPositionValue(position);
    }
  }, [openTooltip]);

  const getPositionValue = (position) => {
    const triggerRect = triggerRef?.current?.getBoundingClientRect();
    const tooltipRect = tooltipRef?.current?.getBoundingClientRect();
    const tooltip = tooltipRef?.current;

    const leftPanelWidth =
      document.getElementById("adminmenuwrap")?.offsetWidth;
    const topPanelHeight = document.getElementById("wpadminbar")?.offsetHeight;
    const leftBoundary = window.scrollX + leftPanelWidth;
    const rightBoundary =
      window.scrollX + window.innerWidth - tooltipRect.width;

    let updatedPosition = position;
    if (position === "bottom") {
      const spaceBelow = window?.innerHeight - triggerRect?.bottom - offset;
      if (spaceBelow < tooltipRect.height) updatedPosition = "top";
    }
    if (position === "top") {
      const spaceAbove = triggerRect?.top - offset - topPanelHeight;
      if (spaceAbove < tooltipRect.height) updatedPosition = "bottom";
    }
    if (position === "left") {
      const spaceLeft = triggerRect?.left - offset - leftPanelWidth;
      if (spaceLeft < tooltipRect.width) updatedPosition = "right";
    }
    if (position === "right") {
      const spaceRight = window?.innerWidth - triggerRect?.right - offset;
      if (spaceRight < tooltipRect.width) updatedPosition = "left";
    }

    if (updatedPosition === "bottom") {
      const leftPosition =
        window.scrollX +
        triggerRect.left +
        (triggerRect.width / 2 - tooltipRect.width / 2);

      tooltip.style.top = `${window.scrollY + triggerRect.bottom + offset}px`;
      tooltip.style.left = `${Math.max(
        Math.min(leftPosition, rightBoundary),
        leftBoundary
      )}px`;
    } else if (updatedPosition === "top") {
      const leftPosition =
        window.scrollX +
        triggerRect.left +
        (triggerRect.width / 2 - tooltipRect.width / 2);

      tooltip.style.top = `${
        window.scrollY + triggerRect.top - tooltipRect.height - offset
      }px`;
      tooltip.style.left = `${Math.max(
        Math.min(leftPosition, rightBoundary),
        leftBoundary
      )}px`;
    } else if (updatedPosition === "left") {
      tooltip.style.top = `${
        window.scrollY +
        triggerRect.top +
        (triggerRect.height / 2 - tooltipRect.height / 2)
      }px`;
      tooltip.style.left = `${
        window.scrollX + triggerRect.left - tooltipRect.width - offset
      }px`;
    } else {
      tooltip.style.top = `${
        window.scrollY +
        triggerRect.top +
        (triggerRect.height / 2 - tooltipRect.height / 2)
      }px`;
      tooltip.style.left = `${window.scrollX + triggerRect.right + offset}px`;
    }
  };

  return (
    <>
      <div
        ref={triggerRef}
        onMouseEnter={() => setOpenTooltip(true)}
        onMouseLeave={() => setOpenTooltip(false)}
      >
        {children}
      </div>
      {openTooltip &&
        createPortal(
          <div
            className={`${CLASS_PREFIX}-tooltip ${
              type === "dark" ? `${CLASS_PREFIX}-tooltip-dark` : ""
            } ${className}`}
            style={style}
            ref={tooltipRef}
          >
            {tip}
          </div>,
          document.body
        )}
    </>
  );
};

export default Tooltip;
