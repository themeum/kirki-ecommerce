import { Card, Tab, Text } from "@/molecules";
import React, { useState } from "react";
import SearchEngines from "./SearchEngines";
import SocialShare from "./SocialShare";
import Schema from "./Schema";
import AEO from "./AEO";
import { __ } from "@/wpi18n";

const SEOSettings = ({ errors, setErrors }) => {
  const [activeTab, setActiveTab] = useState(0);

  const handleTabChange = (index) => {
    setActiveTab(index);
  };
  return (
    <Card type="form">
      <Text header={__("AI & Web Presence", "kirki-ecommerce")} type="primary" />
      <Tab activeIndex={activeTab} onChange={handleTabChange}>
        <div>{__("Search Engines", "kirki-ecommerce")}</div>
        <div>{__("AEO", "kirki-ecommerce")}</div>
        <div>{__("Social Share", "kirki-ecommerce")}</div>
        <div>{__("Schema", "kirki-ecommerce")}</div>
      </Tab>

      {activeTab === 0 && (
        <SearchEngines errors={errors} setErrors={setErrors} />
      )}
      {activeTab === 1 && <AEO errors={errors} setErrors={setErrors} />}
      {activeTab === 2 && <SocialShare errors={errors} setErrors={setErrors} />}
      {activeTab === 3 && <Schema errors={errors} setErrors={setErrors} />}
    </Card>
  );
};

export default SEOSettings;
