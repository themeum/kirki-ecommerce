import React from "react";
import classNames from "classnames";
import { CLASS_PREFIX } from "@/conf";
import Flex from "../Flex";

const Badge = (props) => {
  const { type = "default", state, className, text, style, leftIcon } = props;
  const badgeVariants = {
    type: {
      published: `${CLASS_PREFIX}-badge-published`,
      secondary: `${CLASS_PREFIX}-badge-secondary`,
      trashed: `${CLASS_PREFIX}-badge-trashed`,
      draft: `${CLASS_PREFIX}-badge-draft`,
      pending: `${CLASS_PREFIX}-badge-pending`,
      processing: `${CLASS_PREFIX}-badge-processing`,
      onHold: `${CLASS_PREFIX}-badge-on-hold`,
      refunded: `${CLASS_PREFIX}-badge-refunded`,
      requested: `${CLASS_PREFIX}-badge-requested`,
      default: `${CLASS_PREFIX}-badge-default`,
    },
    state: {
      disabled: `${CLASS_PREFIX}-disabled`,
    },
    default: `${CLASS_PREFIX}-badge`,
  };

  const allClassNames = classNames(
    badgeVariants.default,
    badgeVariants.type[type],
    badgeVariants.state[state],
    className
  );
  return (
    <Flex className={allClassNames} style={style} gap={8}>
      {leftIcon && leftIcon}
      {text}
    </Flex>
  );
};

export default Badge;
