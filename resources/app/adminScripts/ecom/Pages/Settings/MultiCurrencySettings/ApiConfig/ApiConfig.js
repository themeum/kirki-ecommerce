import React, { useEffect, useState } from "react";
import OptionAccordion from "../../../../components/OptionAccordion";
import {
  Select,
  Card,
  Flex,
  Text,
  ActionGroup,
  ToggleButton,
  Button,
} from "../../../../molecules";
import { ReplaceIcon, FlagIcon, WrenchIcon } from "icons";
import { __ } from "wpi18n";
import ApiConfigurationPopup from "./ApiConfigurationPopup";
import { getCurrencyAPIProviderListAPI } from "../../../../store/currenciesSlice";
import ApiConfigurationCard from "./ApiConfigurationCard";

const ApiConfig = ({ dataObj, handleOnChange, errors }) => {
  const [selectedAPI, setSelectedAPI] = useState("");
  const [apiProviderList, setAPIProviderList] = useState([]);
  const [apiConfigObj, setApiConfigObj] = useState({});
  const [openPopup, setOpenPopup] = useState(false);

  useEffect(() => {
    setSelectedAPI(dataObj?.api_provider || "");
    fetchAPIProviderList();
  }, [dataObj]);

  useEffect(() => {
    if (selectedAPI === dataObj?.api_provider)
      setApiConfigObj(dataObj?.api_config);
    else setApiConfigObj({});
  }, [selectedAPI, dataObj]);

  const fetchAPIProviderList = async () => {
    const result = await getCurrencyAPIProviderListAPI();
    if (result.success) {
      setAPIProviderList(result?.data);
    } else {
      setAPIProviderList([]);
    }
  };

  const rightActions = () => (
    <ActionGroup gap={8} style={{ alignItems: "center" }}>
      <ToggleButton
        value={dataObj["is_automatic_update_enabled"]}
        onChange={(value) =>
          handleOnChange(value, "is_automatic_update_enabled")
        }
      />
    </ActionGroup>
  );

  const hasAPIConfiguration = apiConfigObj?.api_key;

  return (
    <>
      <OptionAccordion
        header={__("Automatic Updates", "kirki-ecommerce")}
        subHeader={__(
          "Configure automatic exchange rate providers for real-time currency conversion",
          "kirki-ecommerce",
        )}
        leftIcon={<ReplaceIcon />}
        rightActions={rightActions()}
      >
        <Select
          label={__("Select API Provider", "kirki-ecommerce")}
          value={selectedAPI}
          onChange={(value) => setSelectedAPI(value)}
          optionsArray={apiProviderList?.map((item) => ({
            title: item?.name,
            value: item?.id,
          }))}
        />
        {selectedAPI &&
          (hasAPIConfiguration ? (
            <ApiConfigurationCard
              setOpenPopup={setOpenPopup}
              selectedAPI={selectedAPI}
              apiConfigObj={apiConfigObj}
              dataObj={dataObj}
            />
          ) : (
            <Card type="inner">
              <Flex
                style={{
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <Flex direction={"column"} gap={8}>
                  <Text header={selectedAPI} leftIcon={<FlagIcon />} />
                  <Text
                    subHeader={__(
                      "Configure your API key and connection settings for ExchangeRate API",
                      "kirki-ecommerce",
                    )}
                  />
                </Flex>
                <ActionGroup>
                  <Button
                    text={__("Configure", "kirki-ecommerce")}
                    size="small"
                    type="outlined"
                    leftIcon={<WrenchIcon />}
                    onClick={() => setOpenPopup(true)}
                  />
                </ActionGroup>
              </Flex>
            </Card>
          ))}
      </OptionAccordion>
      <ApiConfigurationPopup
        isOpen={openPopup}
        onClose={() => setOpenPopup(false)}
        dataObj={apiConfigObj}
        handleOnChange={handleOnChange}
        selectedAPI={selectedAPI}
        errors={errors}
      />
    </>
  );
};

export default ApiConfig;
