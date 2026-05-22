import { CLASS_PREFIX } from "@/conf";
import React from "react";
import Flex from "../Flex";

const Tag = (props) => {
  const {
    text,
    subText,
    img, // pass the Thumbnail/Icon component
    color,
    gap = 8,
    closeIcon,
    className = "",
    style = {},
    onTagRemove = () => {},
  } = props;
  return (
    <div className={`${CLASS_PREFIX}-tag ${className}`} style={style}>
      <Flex gap={gap} style={{ alignItems: "center" }}>
        {img}
        {color && (
          <div
            className={`${CLASS_PREFIX}-color-swatch`}
            style={{ backgroundColor: color }}
          />
        )}
        {text}
        {subText && (
          <span className={`${CLASS_PREFIX}-tag-subtext`}>{subText}</span>
        )}
        {closeIcon && (
          <span className={`${CLASS_PREFIX}-close-icon`} onClick={onTagRemove}>
            {closeIcon}
          </span>
        )}
      </Flex>
    </div>
  );
};

export default Tag;
