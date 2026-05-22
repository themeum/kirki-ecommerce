import React, { useState, useEffect } from "react";
import {
  Button,
  Popover,
  PopoverHeader,
  PopoverBody,
  Flex,
  Text,
  ActionGroup,
  Input,
  Select,
  Checkbox,
} from "../../../../molecules";

import { ConfigureKeyIcon, EyeClosedIcon, EyeIcon } from "@/Icons";
import { __ } from "@/wpi18n";

const ApiConfigurationPopup = ({
  isOpen,
  onClose = () => {},
  handleOnChange,
  dataObj,
  selectedAPI,
  errors,
}) => {
  const initialData = {
    api_key: "",
    update_frequency: "every_1_hour",
    fallback_behaviour: "last_known_rate",
    is_cache_enabled: false,
  };
  const [localConfig, setLocalConfig] = useState(initialData);
  const [inputType, setInputType] = useState("password");

  const updateFrequencyOptions = [
    { title: __("Every 15 minutes", "kirki-ecommerce"), value: "every_15_min" },
    { title: __("Every 30 minutes", "kirki-ecommerce"), value: "every_30_min" },
    { title: __("Every hour", "kirki-ecommerce"), value: "every_1_hour" },
    { title: __("Every 6 hours", "kirki-ecommerce"), value: "every_6_hours" },
    { title: __("Every 12 hours", "kirki-ecommerce"), value: "every_12_hours" },
    { title: __("Daily (24 hours)", "kirki-ecommerce"), value: "daily_24_hours" },
  ];

  useEffect(() => {
    if (isOpen) {
      const hasData = dataObj?.api_key;
      setLocalConfig(hasData ? dataObj : initialData);
      setInputType("password");
    } else {
      setLocalConfig(initialData);
    }
  }, [selectedAPI, dataObj, isOpen]);

  const updateApiConfig = (value, field) => {
    setLocalConfig((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleShowApiKey = () => {
    if (inputType === "password") setInputType("text");
    else setInputType("password");
  };

  const handleConfiguration = () => {
    handleOnChange(selectedAPI, "api_provider");
    handleOnChange(localConfig, "api_config");
    onClose();
  };

  return (
    <>
      <Popover isOpen={isOpen}>
        <PopoverHeader onClose={onClose}>
          {__("API Configuration", "kirki-ecommerce")}
        </PopoverHeader>
        <PopoverBody
          style={{
            padding: "20px",
            borderTop: "1px solid #E4E3E9",
            borderBottom: "1px solid #E4E3E9",
          }}
        >
          <Flex direction="column" gap={16}>
            <Input
              type={inputType}
              label={__("API Key", "kirki-ecommerce")}
              rightIcon={
                inputType === "password" ? <EyeClosedIcon /> : <EyeIcon />
              }
              placeholder={"******"}
              handleRightAction={handleShowApiKey}
              value={localConfig?.api_key || ""}
              onChange={(val) => updateApiConfig(val, "api_key")}
              error={errors["data.api_config.api_key"]}
            />
            <Text
              type={"secondary"}
              style={{ fontWeight: 400 }}
              header={__(
                "Your API key is encrypted and stored securely. Get your API key from ExchangeRate API",
                "kirki-ecommerce",
              )}
            />
            <Select
              label={__("Update Frequency", "kirki-ecommerce")}
              value={localConfig?.update_frequency}
              onChange={(val) => updateApiConfig(val, "update_frequency")}
              optionsArray={updateFrequencyOptions}
              error={errors["data.api_config.update_frequency"]}
            />
            <Select
              label={__("Fallback Behavior", "kirki-ecommerce")}
              value={localConfig?.fallback_behaviour}
              onChange={(val) => updateApiConfig(val, "fallback_behaviour")}
              optionsArray={[
                {
                  title: __("Use base currency only", "kirki-ecommerce"),
                  value: "base_currency",
                },
                {
                  title: __("Use last known rate", "kirki-ecommerce"),
                  value: "last_known_rate",
                },
              ]}
              error={errors["data.api_config.fallback_behaviour"]}
            />
            <Checkbox
              label={__("Cache exchange rates to reduce API calls", "kirki-ecommerce")}
              value={localConfig?.is_cache_enabled || false}
              onChange={(checked) =>
                updateApiConfig(checked, "is_cache_enabled")
              }
            />
          </Flex>
        </PopoverBody>
        <Flex style={{ padding: "12px 20px" }}>
          <Button
            type={"destructiveSoft"}
            text={__("Remove", "kirki-ecommerce")}
            onClick={() => {
              setLocalConfig(initialData);
            }}
          />
          <ActionGroup gap={12}>
            <Button
              text={__("Cancel", "kirki-ecommerce")}
              type={"ghost"}
              onClick={onClose}
              style={{ boxShadow: "0 1px 1px 0 rgba(86, 65, 243, 0.3)" }}
            />
            <Button
              leftIcon={<ConfigureKeyIcon />}
              text={__("Configure", "kirki-ecommerce")}
              onClick={handleConfiguration}
              type={"primary"}
            />
          </ActionGroup>
        </Flex>
      </Popover>
    </>
  );
};

export default ApiConfigurationPopup;
