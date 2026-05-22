import React from "react";
import { __, sprintf } from "@/wpi18n";
import { Badge, Button, Card, Flex, Text } from "../../../../molecules";
import { EditIcon, FlagIcon, RadioTickIcon } from "@/Icons";
import ProgressBar from "../../../../molecules/Progressbar";
import { dateFormatter } from "../../../utils";

const ApiConfigurationCard = ({
  selectedAPI,
  apiConfigObj,
  setOpenPopup,
  dataObj,
}) => {
  const formatValue = (value) =>
    value?.replace(/_/g, " ").replace(/\b\w/g, (char) => char.toUpperCase()) ??
    "";
  return (
    <Card>
      <Flex direction={"column"} gap={20}>
        <Flex
          style={{
            justifyContent: "space-between",
            alignItems: "flex-start",
          }}
        >
          <Flex direction={"column"} gap={8}>
            <Text
              type="primary"
              header={selectedAPI}
              leftIcon={<FlagIcon />}
              badge={
                <Badge
                  text={"Configured"}
                  type="published"
                  leftIcon={<RadioTickIcon />}
                />
              }
            />
            <Text
              subHeader={sprintf(
                __(`Last tested: %s`, "kirki-ecommerce"),
                dateFormatter(dataObj?.last_sync_at, "datetime"),
              )}
            />
          </Flex>
          <Button
            size="icon"
            icon={<EditIcon />}
            type="outlined"
            onClick={() => setOpenPopup(true)}
          />
        </Flex>
        {dataObj?.usage && dataObj?.usage !== null && (
          <Flex direction={"column"} gap={6}>
            <ProgressBar
              value={Number(dataObj?.usage?.used)}
              // onChange={setHeightValue}
              labelStyle={{ fontWeight: "400" }}
              showProgressIndicator={false}
              style={{ gap: "10px" }}
              progressBarColor={"var(--decom-color-gray-16)"}
              label={__("API Usage", "kirki-ecommerce")}
              rightText={sprintf(
                __("%d/%d", "kirki-ecommerce"),
                dataObj?.usage?.used,
                dataObj?.usage?.total,
              )}
            />
            <Text
              header={sprintf(
                __("Resets on %s", "kirki-ecommerce"),
                dateFormatter(dataObj?.next_sync_at),
              )}
              style={{ color: "var(--decom-color-gray-12)" }}
            />
          </Flex>
        )}
        <Card
          type="innerDark"
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "var(--decom-spacing-1)",
            borderRadius: "var(--decom-radius-rounded-sm)",
            padding: "var(--decom-spacing-2)",
          }}
        >
          <Flex gap={4}>
            <Text
              header={__("Fallback Behavior: ", "kirki-ecommerce")}
              style={{ color: "var(--decom-color-gray-12)" }}
            />
            <Text header={formatValue(apiConfigObj?.fallback_behaviour)} />
          </Flex>
          <Flex gap={4}>
            <Text
              header={__("Update Frequency: ", "kirki-ecommerce")}
              style={{ color: "var(--decom-color-gray-12)" }}
            />
            <Text header={formatValue(apiConfigObj?.update_frequency)} />
          </Flex>
        </Card>
      </Flex>
    </Card>
  );
};

export default ApiConfigurationCard;
