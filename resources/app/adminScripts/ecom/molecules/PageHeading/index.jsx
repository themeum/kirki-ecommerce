import Heading from "../Heading";
import { CLASS_PREFIX } from "conf";
import Button from "../Button";
import { ArrowLeftIcon } from "icons";
import classNames from "classnames";
import Flex from "../Flex";
import Container from "../Container";
import { __ } from "wpi18n";

const PageHeading = (props) => {
  const {
    type = "",
    text = __("Button", "kirki-ecommerce"),
    hasBack = false,
    size,
    sticky,
    children,
    className = "",
    style = {},
    actions,
    leftIcon,
    noMargin,
    buttonProps = {},
  } = props;

  const allClassNames = classNames(
    `${CLASS_PREFIX}-page-heading`,
    hasBack && `${CLASS_PREFIX}-has-back`,
    className,
  );

  return (
    <div
      className={`${CLASS_PREFIX}-heading-wrapper ${
        sticky ? `${CLASS_PREFIX}-sticky-heading` : ""
      } ${noMargin ? `${CLASS_PREFIX}-no-margin` : ""}`}
    >
      <Container size={size} style={{ width: "100%" }}>
        <span className={`${allClassNames}`} style={style}>
          {hasBack && (
            <Button
              text={__("Cancel", "kirki-ecommerce")}
              type="link"
              size="small"
              {...buttonProps}
              icon={<ArrowLeftIcon />}
              onClick={() => window.history.back()}
              style={{ marginRight: "4px" }}
            />
          )}
          {leftIcon && (
            <span className={`${CLASS_PREFIX}-svg-class`}>{leftIcon}</span>
          )}
          <Heading type={type} text={text} />
          {children}
          <Flex
            className={`${CLASS_PREFIX}-page-heading-action-buttons`}
            gap={8}
          >
            {actions}
          </Flex>
        </span>
      </Container>
    </div>
  );
};

export default PageHeading;
