import { CLASS_PREFIX } from "@/conf";
import React from "react";
import Flex from "../Flex";

const Alert = (props) => {
  const {
    type,
    icon,
    text,
    className = "",
    style = {},
    hasHighlight = false,
  } = props;

  const alertVariants = {
    type: {
      success: `${CLASS_PREFIX}-alert-success`,
      fail: `${CLASS_PREFIX}-alert-fail`,
      pending: `${CLASS_PREFIX}-alert-pending`,
    },
  };
  return (
    <div
      className={`${CLASS_PREFIX}-alert ${alertVariants.type[type]} ${className}`}
      style={style}
    >
      {hasHighlight && (
        <div className={`${CLASS_PREFIX}-highlighted-line`}></div>
      )}
      <Flex gap={8} style={{ alignItems: "flex-start" }}>
        <span className={`${CLASS_PREFIX}-alert-icon`}>{icon}</span>
        <span className={`${CLASS_PREFIX}-alert-text`}>{text}</span>
      </Flex>
    </div>
  );
};

export default Alert;
