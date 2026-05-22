import React from "react";
import Flex from '@/molecules/flex'
import PageNavbar from '@/components/page-navbar';
import { HomeIcon } from "@/icons";

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
