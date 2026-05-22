import React from "react";
import Flex from '@/molecules/flex';
import Button from '@/molecules/button';
import Card from '@/molecules/card';
import Text from '@/molecules/text';
import { ArrowLeftIcon } from "@/icons";
import { CLASS_PREFIX } from "@/conf";

const PageNavbar = (props) => {
  const {
    buttonIcon = <ArrowLeftIcon />,
    handleBack,
    textIcon,
    text,
    style = {},
    rightAction,
  } = props;

  return (
    <div style={style}>
      <Flex style={{ alignItems: "center", justifyContent: "center" }}>
        <Button
          icon={buttonIcon}
          size="small"
          type="ghost"
          onClick={handleBack ?? (() => window.history.back())}
          className={`${CLASS_PREFIX}-page-navbar-back-button`}
        />
        <div
          style={{
            height: "19px",
            width: "8.5px",
            background: "white",
            clipPath: "path('M0,0 Q4.25,6 8.5,0 L8.5,19 Q4.25,13 0,19 Z')",
          }}
        ></div>
        <Card type="navbar">
          <Text type="primary" header={text} leftIcon={textIcon} />
          {rightAction}
        </Card>
      </Flex>
    </div>
  );
};

export default PageNavbar;
