import classNames from "classnames";
import { CLASS_PREFIX } from "@/conf";
import Flex from "../Flex";
import { HelpTextIcon, InfoIcon } from "@/Icons";
import Tooltip from "../Tooltip";

const Label = (props) => {
  const {
    text,
    type,
    helpText,
    infoText,
    leftIcon,
    rightIcon,
    className = "",
    style = {},
  } = props;

  const labelVariants = {
    type: {
      disabled: `${CLASS_PREFIX}-disabled`,
      error: `${CLASS_PREFIX}-error`,
    },
  };

  const allClassNames = classNames(
    `${CLASS_PREFIX}-label`,
    labelVariants.type[type],
    className,
  );
  return (
    <Flex className={allClassNames} style={style} gap={4}>
      {leftIcon && (
        <span className={`${CLASS_PREFIX}-svg-class`}>{leftIcon}</span>
      )}
      {text}
      {helpText && (
        <Tooltip type="dark" tip={helpText}>
          <span className={`${CLASS_PREFIX}-svg-class`}>
            <HelpTextIcon
              color={type === "error" ? "#d40000" : "currentColor"}
            />
          </span>
        </Tooltip>
      )}
      {infoText && (
        <Tooltip type="dark" tip={infoText}>
          <span className={`${CLASS_PREFIX}-svg-class`}>
            <InfoIcon color={type === "error" ? "#d40000" : "currentColor"} />
          </span>
        </Tooltip>
      )}
      {rightIcon && (
        <span className={`${CLASS_PREFIX}-svg-class`}>{rightIcon}</span>
      )}
    </Flex>
  );
};

export default Label;
