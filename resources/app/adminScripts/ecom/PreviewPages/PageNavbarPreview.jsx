import React from "react";
import Flex from "../molecules/Flex";
import PageNavbar from "../components/PageNavbar";
import { HomeIcon } from "icons";

const PageNavbarPreview = () => {
  return (
    <Flex style={{ width: "100%" }}>
      <PageNavbar
        style={{ width: "100%" }}
        textIcon={<HomeIcon />}
        text={"Home"}
      />
    </Flex>
  );
};

export default PageNavbarPreview;
