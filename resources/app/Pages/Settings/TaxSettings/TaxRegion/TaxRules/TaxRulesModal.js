import React, { useState, useEffect } from "react";
import {
  Placeholder,
  Flex,
  Text,
  Grid,
  Select,
  Input,
  Button,
} from "../../../../../molecules";
import { LighteningIcon } from "@/Icons";
import { CLASS_PREFIX } from "@/conf";
import { __ } from "@/wpi18n";
import { taxRuleActionOptionsArray } from "../../utils";
import { useSelector } from "react-redux";
import ConditionRow from "./ConditionRow";

import { getTaxProfileListAPI } from "../../../../../store/settingsSlice";
import useGetListAPI from "../../../../../hooks/useGetListAPI";

const TaxRulesModal = (props) => {
  const {
    showModal,
    setShowModal,
    rulesObj,
    setRulesObj,
    updateTaxRules,
    from = "",
    ruleIndex,
    region,
  } = props;

  const [selectedAction, setSelectedAction] = useState("set_tax_rate");
  const [selectedActionValue, setSelectedActionValue] = useState("");
  const [selectedCountries, setSelectedCountries] = useState([]);

  const { taxProfile } = useSelector((state) => state.settings?.tax);

  const [conditions, setConditions] = useState([
    {
      id: crypto.randomUUID(),
      condition: "tax_profile",
      value: null,
    },
  ]);

  useGetListAPI({
    reducerName: "settings",
    apiCallBack: getTaxProfileListAPI,
    nestedToggler: ["tax", "taxProfile"],
  });

  useEffect(() => {
    if (from === "edit" && ruleIndex !== undefined && rulesObj?.[ruleIndex]) {
      const existingRule = rulesObj[ruleIndex];

      setConditions(
        existingRule.conditions.map((c) => ({
          id: crypto.randomUUID(),
          condition: c.type,
          value: c.value ?? null,
        })),
      );
      setSelectedAction(existingRule.action?.type);
      setSelectedActionValue(existingRule.action?.value);
      const destinationCondition = existingRule.conditions.find(
        (c) => c.type === "destination_region",
      );

      setSelectedCountries(
        Array.isArray(destinationCondition?.value)
          ? destinationCondition.value
          : [],
      );
    } else {
      setConditions([
        { id: crypto.randomUUID(), condition: "tax_profile", value: null },
      ]);
      setSelectedCountries([]);
    }
  }, [from, ruleIndex, rulesObj]);

  const buildRule = () => ({
    relation: "AND",
    conditions: conditions.map((c) => ({
      type: c.condition,
      operator: "=",
      value: c.value ?? "",
    })),
    action: {
      type: selectedAction,
      value: selectedActionValue ?? 0,
    },
  });

  const handleAddOrUpdateTaxRule = () => {
    const newRulesObj = Array.isArray(rulesObj) ? rulesObj : [];
    const updatedRules =
      from === "edit" && typeof ruleIndex === "number"
        ? newRulesObj.map((rule, index) =>
            index === ruleIndex ? buildRule() : rule,
          )
        : [...newRulesObj, buildRule()];

    setRulesObj(updatedRules);
    updateTaxRules(updatedRules);
    setShowModal(false);
  };

  const getConditionValue = (condition) => {
    if (condition === "tax_profile") {
      return taxProfile?.data?.map((item) => ({
        title: item.name,
        value: item.name,
        id: item.id,
      }));
    }
    return [];
  };

  return (
    <div>
      <Placeholder
        style={{ minHeight: "fit-content", alignItems: "stretch" }}
        className={`${CLASS_PREFIX}-add-rule-modal ${
          showModal ? "is-open" : ""
        }`}
      >
        <Flex
          direction={"column"}
          gap={16}
          style={{ padding: "var(--decom-spacing-3)" }}
        >
          {from !== "edit" && (
            <Text
              header={__("New Tax Rules", "kirki-ecommerce")}
              leftIcon={<LighteningIcon />}
            />
          )}
          <Flex direction={"column"} gap={8}>
            <div className={`${CLASS_PREFIX}-condition-row`}>
              {conditions?.map((row, index) => (
                <ConditionRow
                  key={index}
                  row={row}
                  index={index}
                  conditions={conditions}
                  setConditions={setConditions}
                  getConditionValue={getConditionValue}
                  selectedCountries={selectedCountries}
                  setSelectedCountries={setSelectedCountries}
                  from={from}
                  region={region}
                />
              ))}
            </div>
          </Flex>
          <Flex direction={"column"} gap={8}>
            <Text header={__("THEN", "kirki-ecommerce")} />
            <Grid columns={2}>
              <Select
                optionsArray={taxRuleActionOptionsArray}
                value={selectedAction}
                onChange={(value) => setSelectedAction(value)}
              />
              {selectedAction === "set_tax_rate" && (
                <Input
                  value={selectedActionValue}
                  placeholder={__("e.g., $100", "kirki-ecommerce")}
                  onChange={(value) => setSelectedActionValue(value)}
                />
              )}
            </Grid>
          </Flex>
          <Flex gap={8} style={{ justifyContent: "flex-end" }}>
            <Button
              type="secondary"
              text={__("Cancel", "kirki-ecommerce")}
              size="small"
              onClick={() => setShowModal(false)}
            />
            <Button
              type="primary"
              text={
                from === "edit"
                  ? __("Update", "kirki-ecommerce")
                  : __("Add Rule", "kirki-ecommerce")
              }
              size="small"
              onClick={handleAddOrUpdateTaxRule}
            />
          </Flex>
        </Flex>
      </Placeholder>
    </div>
  );
};

export default TaxRulesModal;
