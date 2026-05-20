import classNames from "classnames";
import React from "react";
import { CLASS_PREFIX } from "conf";
import Flex from "../Flex";

const Text = (props) => {
  const {
    type,
    header,
    subHeader,
    style = {},
    className = "",
    padding,
    emphasis,
    leftIcon,
    gap = 8,
    badge,
  } = props;

  const headingVariations = {
    type: {
      primary: `${CLASS_PREFIX}-text-primary`,
      secondary: `${CLASS_PREFIX}-text-secondary`,
      disabled: `${CLASS_PREFIX}-text-disabled`,
      xsm: `${CLASS_PREFIX}-text-xsm`,
    },
    padding: {
      large: `${CLASS_PREFIX}-text-padding-large`,
      small: `${CLASS_PREFIX}-text-padding-small`,
    },
    emphasis: `${CLASS_PREFIX}-text-emphasis`,
  };

  const allClassNames = classNames(
    `${CLASS_PREFIX}-text`,
    headingVariations.type[type],
    headingVariations.padding[padding],
    emphasis && headingVariations.emphasis,
    className
  );
  return (
    <Flex gap={gap} style={{ alignItems: "center" }}>
      {leftIcon && (
        <span className={`${CLASS_PREFIX}-svg-class`}>{leftIcon}</span>
      )}
      <div className={allClassNames} style={style}>
        {header && (
          <Flex gap={8}>
            {header && (
              <span className={`${CLASS_PREFIX}-text-heading`}>{header}</span>
            )}
            {badge && <span>{badge}</span>}
          </Flex>
        )}
        {subHeader && (
          <span className={`${CLASS_PREFIX}-subheading`}>{subHeader}</span>
        )}
      </div>
    </Flex>
  );
};

export default Text;
