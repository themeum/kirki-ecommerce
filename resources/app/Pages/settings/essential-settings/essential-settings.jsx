import React from "react";
import { __ } from "@/wpi18n";
import { SnowflakeIcon } from "@/icons";
import Flex from '@/molecules/flex';
import PageHeading from '@/molecules/page-heading';
import Container from '@/molecules/container';
import PageNavbar from '@/components/page-navbar';

import SchemaProfile from "./schema-profile/schema-profile";
import VariationList from './variation-library/variation-library';

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
