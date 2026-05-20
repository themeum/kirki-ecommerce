import { CLASS_PREFIX } from "conf";
import { Card, Container, Flex, PageHeading, Searchbox, Text } from "molecules";
import React from "react";
import { __ } from "wpi18n";
import { SettingsItem } from "./SettingsItem";
import {
  advancedSettings,
  businessOperationSettings,
  storeManagementSettings,
} from "./utils";

const Settings = () => {
  const renderSettingsSection = (title, settingsList) => (
    <Flex direction="column" gap={8}>
      <Text subHeader={title} type="xsm" />
      <Flex
        direction="column"
        gap={2}
        className={`${CLASS_PREFIX}-settings-card-wrapper`}
      >
        {settingsList.map((item, index) => (
          <SettingsItem key={index} {...item} />
        ))}
      </Flex>
    </Flex>
  );

  return (
    <>
      <PageHeading
        text={__("Settings", "kirki-ecommerce")}
        size="sm"
        sticky
        type="primary"
        style={{ height: "32px" }}
      />
      <Container size="sm">
        <Card
          type="shadow"
          style={{
            padding: "var(--decom-spacing-4) var(--decom-spacing-3)",
            backgroundColor: "var(--decom-background-bg-surface-secondary)",
          }}
        >
          <Flex direction="column" gap={24}>
            <Searchbox />
            {renderSettingsSection("STORE MANAGEMENT", storeManagementSettings)}
            {renderSettingsSection(
              "BUSINESS OPERATION",
              businessOperationSettings
            )}
            {renderSettingsSection("ADVANCED CONFIGURATION", advancedSettings)}
          </Flex>
        </Card>
      </Container>
    </>
  );
};

export default Settings;
