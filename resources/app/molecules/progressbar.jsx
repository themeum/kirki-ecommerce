import React, { useRef, useState, useEffect } from "react";
import { CLASS_PREFIX } from "@/conf";
import Label from '@/molecules/label';
import Flex from '@/molecules/flex';

const ProgressBar = (props) => {
  const {
    value = 50,
    onChange,
    label = "",
    rightText,
    style = {},
    labelStyle = {},
    progressBarColor = "",
    showProgressIndicator = true,
  } = props;
  const [progress, setProgress] = useState(value);

  const barRef = useRef(null);
  const isDragging = useRef(false);

  useEffect(() => {
    setProgress(value);
  }, [value]);

  const updateValueFromEvent = (e) => {
    if (!barRef.current || !onChange) return;

    const rect = barRef.current.getBoundingClientRect();
    const clientX = e.clientX ?? e.pageX;
    const percent = ((clientX - rect.left) / rect.width) * 100;
    const normalized = Math.min(100, Math.max(0, percent));
    setProgress(Math.round(normalized));
    onChange(Math.round(normalized));
  };

  const handleMouseDown = (e) => {
    e.preventDefault();
    isDragging.current = true;
    updateValueFromEvent(e);
  };

  const handleThumbMouseDown = (e) => {
    e.stopPropagation();
    e.preventDefault();
    isDragging.current = true;
  };

  useEffect(() => {
    const handleMove = (e) => {
      if (isDragging.current) updateValueFromEvent(e);
    };

    const stopDragging = () => {
      isDragging.current = false;
    };

    window.addEventListener("mousemove", handleMove);
    window.addEventListener("mouseup", stopDragging);

    return () => {
      window.removeEventListener("mousemove", handleMove);
      window.removeEventListener("mouseup", stopDragging);
    };
  }, []);

  return (
    <Flex direction={"column"} gap={16} style={style}>
      <Flex style={{ justifyContent: "space-between", alignItems: "center" }}>
        {label && <Label text={label} style={labelStyle} />}
        {rightText && <span style={{ color: "#71717A" }}>{rightText}</span>}
      </Flex>
      <div
        ref={barRef}
        className={`${CLASS_PREFIX}-progressbar`}
        onMouseDown={handleMouseDown}
      >
        <div
          className={`${CLASS_PREFIX}-progressbar-fill`}
          style={{ width: `${progress}%`, backgroundColor: progressBarColor }}
        />
        {showProgressIndicator && (
          <div
            className={`${CLASS_PREFIX}-progressbar-thumb`}
            style={{ left: `${progress}%` }}
            onMouseDown={handleThumbMouseDown}
          />
        )}
      </div>
    </Flex>
  );
};

export default ProgressBar;
