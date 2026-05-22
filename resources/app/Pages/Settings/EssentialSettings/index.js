import React from "react";
import { __ } from "@/wpi18n";
import { SnowflakeIcon } from "@/Icons";
import { Flex, PageHeading, Container } from "@/molecules";
import PageNavbar from "../../../components/PageNavbar";

import SchemaProfile from "./SchemaProfile/SchemaProfile";
import VariationList from "./VariationLibrary";

const EssentialsSettings = () => {
  return (
    <div>
      <PageHeading
        text={__("Settings", "kirki-ecommerce")}
        size="sm"
        sticky
        type="primary"
        style={{ height: "32px" }}
      />
      <Container size="sm">
        <Flex direction="column" gap={16}>
          <PageNavbar
            textIcon={<SnowflakeIcon />}
            text={__("Essentials", "kirki-ecommerce")}
          />
          <VariationList />
          <SchemaProfile />
        </Flex>
      </Container>
    </div>
  );
};

export default EssentialsSettings;
