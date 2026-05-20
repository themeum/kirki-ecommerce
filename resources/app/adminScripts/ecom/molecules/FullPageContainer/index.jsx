import React from "react";
import Container from "../Container";
import classNames from "classnames";
import { CLASS_PREFIX } from "conf";

const FullPageContainer = (props) => {
  const { scrollable = false, style = {}, className = "", children } = props;
  const allClassNames = classNames(
    `${CLASS_PREFIX}-full-page-container`,
    scrollable && `${CLASS_PREFIX}-scroll-container`,
    className
  );
  return (
    <Container style={style} className={allClassNames}>
      {children}
    </Container>
  );
};

export default FullPageContainer;
