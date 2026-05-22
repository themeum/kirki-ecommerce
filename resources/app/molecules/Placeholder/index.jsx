import classNames from "classnames";
import { CLASS_PREFIX } from "@/conf";
import React from "react";
import Flex from "../Flex";
import Label from "../Label";
import { ThumbnailPlaceholder } from "@/Icons";

const Placeholder = (props) => {
  const {
    children,
    style = {},
    className = "",
    size,
    type,
    label,
    helpText,
    onClick = () => {},
    error,
  } = props;
  const placehodlerVariants = {
    size: {
      small: `${CLASS_PREFIX}-placeholder-small`,
      large: `${CLASS_PREFIX}-placeholder-large`,
    },
    type: {
      primary: `${CLASS_PREFIX}-placeholder-primary`,
      secondary: `${CLASS_PREFIX}-placeholder-secondary`,
    },
    default: `${CLASS_PREFIX}-placeholder`,
  };
  const allClassNames = classNames(
    placehodlerVariants.default,
    placehodlerVariants.type[type],
    placehodlerVariants.size[size],
    className,
  );
  return (
    <Flex direction="column" gap={8}>
      {label && (
        <Label
          text={label}
          type={error ? "error" : ""}
          helpText={error ? error : helpText}
        />
      )}
      <div className={allClassNames} style={style} onClick={onClick}>
        {size === "small" ? <ThumbnailPlaceholder /> : children}
      </div>
    </Flex>
  );
};

export default Placeholder;
