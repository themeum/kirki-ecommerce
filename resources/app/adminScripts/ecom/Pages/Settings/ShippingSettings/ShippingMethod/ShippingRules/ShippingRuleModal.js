import React, { useEffect, useState } from "react";
import {
  Flex,
  Placeholder,
  Text,
  Grid,
  Select,
  Input,
  Button,
} from "../../../../../molecules";
import { __ } from "wpi18n";
import { LighteningIcon } from "icons";
import { CLASS_PREFIX } from "conf";
import { getCategoriesAPI } from "../../../../../store/categoriesSlice";
import {
  updateSettingsAPI,
  updateSettings,
  getShippingProfileList,
} from "../../../../../store/settingsSlice";
import { useSelector, useDispatch } from "react-redux";
import { conditionOptions, actionOptionsArray } from "../../utils";
import { useSearchParams } from "react-router";
import { SelectDestinationPopup } from "../SelectDestinationPopup";
import { resolveDestinationRegion } from "./helper";
import { dispatchToastMessage, normalizeErrors } from "../../../../utils";
import useGetListAPI from "../../../../../hooks/useGetListAPI";

const ShippingRuleModal = (props) => {
  const dispatch = useDispatch();
  const {
    showModal,
    setShowModal,
    rulesObj,
    setRulesObj,
    methodId,
    from = "",
    ruleIndex = -1,
  } = props;

  const [searchParams] = useSearchParams();
  const selectedMethod = searchParams.get("methodId");
  const selectedZone = searchParams.get("zoneId");

  const [openDestinationPopup, setOpenDestinationPopup] = useState(false);
  const [selectedCountry, setSelectedCountry] = useState(null);
  const [selectedRegion, setSelectedRegion] = useState([]);
  const [selectedCondition, setSelectedCondition] =
    useState("product_category");
  const [selectedConditionValue, setSelectedConditionValue] = useState(null);
  const [selectedOperator, setSelectedOperator] = useState("");
  const [selectedAction, setSelectedAction] = useState("set_shipping_cost");
  const [selectedActionValue, setSelectedActionValue] = useState("");
  const [errors, setErrors] = useState({});

  useGetListAPI({
    reducerName: "settings",
    apiCallBack: getShippingProfileList,
    nestedToggler: ["shipping", "shippingProfile"],
  });

  const {
    data: shippingSettingsData,
    activeZoneId,
    shippingProfile,
  } = useSelector((state) => state.settings?.shipping);
  const { loaded: categoryLoaded, data: categoryList } = useSelector(
    (state) => state.categories,
  );

  const [conditionData, setConditionData] = useState({
    product_category: null,
    shipping_profile: null,
  });
  const methodID = from === "edit" ? selectedMethod : methodId;
  const zoneID = from === "edit" ? selectedZone : activeZoneId;

  useEffect(() => {
    if (selectedCondition !== "destination_region") return;
    let regionForCountry;
    let selected_country = "";

    if (selectedCountry) {
      selected_country = selectedCountry;
      regionForCountry = selectedRegion.find(
        (r) => r.country === selectedCountry,
      );
    } else {
      selected_country = selectedRegion[0]?.country;
      regionForCountry = selectedRegion.find(
        (r) => r.country === selected_country,
      );
    }
    setSelectedCountry(selected_country);

    if (selected_country && from !== "edit") {
      setSelectedConditionValue({
        country: selected_country,
        states: regionForCountry?.states || [],
      });
    }
  }, [selectedCountry, selectedRegion, selectedCondition]);

  useEffect(() => {
    if (from !== "edit" || !rulesObj) return;

    const condition = rulesObj?.conditions?.[0];
    const action = rulesObj?.action;

    if (condition) {
      setSelectedCondition(condition.type);
      setSelectedOperator(condition.operator);
      if (condition.type === "destination_region") {
        setSelectedConditionValue({
          country: condition.value.country,
          states: condition.value.states || [],
        });
        setSelectedCountry(condition.value.country);
      } else {
        setSelectedConditionValue(condition.value);
      }
    }

    if (action) {
      setSelectedAction(action.type);
      setSelectedActionValue(action.value);
    }
  }, [from, rulesObj]);

  useEffect(() => {
    if (
      selectedCondition === "product_category" &&
      categoryLoaded &&
      categoryList?.results
    ) {
      setConditionData((prev) => ({
        ...prev,
        product_category: categoryList.results,
      }));
    }
  }, [categoryLoaded, categoryList, selectedCondition]);

  useEffect(() => {
    if (!selectedCondition) return;
    if (conditionData[selectedCondition]) return;

    switch (selectedCondition) {
      case "product_category":
        if (!categoryLoaded) {
          dispatch(getCategoriesAPI());
        }
        break;

      case "shipping_profile":
        setConditionData((prev) => ({
          ...prev,
          shipping_profile: shippingProfile?.data,
        }));
        break;

      case "destination_region":
        resolveDestinationRegion({
          shippingSettingsData,
          methodID,
          setSelectedRegion,
        });
        break;

      default:
        break;
    }
  }, [selectedCondition]);

  const getConditionValue = () => {
    const data = conditionData[selectedCondition];

    switch (selectedCondition) {
      case "product_category":
      case "shipping_profile":
        return data?.map((item) => ({
          title: item.name,
          value: item.name,
          id: item.id,
        }));

      case "cart_weight":
        return [];

      default:
        return [];
    }
  };

  function getOperatorOptions() {
    if (selectedCondition === "cart_weight") {
      return [
        { title: __("> (Greater than)", "kirki-ecommerce"), value: ">" },
        { title: __("= (Equal to)", "kirki-ecommerce"), value: "=" },
        { title: __("< (Less than)", "kirki-ecommerce"), value: "<" },
      ];
    } else {
      return [{ title: __("is", "kirki-ecommerce"), value: "is" }];
    }
  }

  const buildRule = () => ({
    relation: "AND",
    conditions: [
      {
        type: selectedCondition,
        operator: selectedOperator || "=",
        value: selectedConditionValue,
      },
    ],
    action: {
      type: selectedAction,
      value: ["set_shipping_cost", "add_shipping_cost"].includes(selectedAction)
        ? selectedActionValue
        : null,
    },
  });

  const updateMethodRules = (method) => {
    const rules = method.shipping_rules || [];

    if (ruleIndex !== -1) {
      return rules.map((rule, idx) => (idx === ruleIndex ? buildRule() : rule));
    }
    return [...rules, buildRule()];
  };

  const handleAddOrUpdateShippingRule = async () => {
    if (!selectedCondition || !selectedAction) return;

    const updatedShippingZones = shippingSettingsData.shipping_zones.map(
      (zone) => {
        if (zone.id !== zoneID) return zone;

        return {
          ...zone,
          shipping_methods: zone.shipping_methods.map((method) => {
            if (method.id !== methodID) return method;

            return {
              ...method,
              shipping_rules: updateMethodRules(method),
            };
          }),
        };
      },
    );

    const updatedData = {
      ...shippingSettingsData,
      shipping_zones: updatedShippingZones,
    };

    await updateData(updatedData);
  };

  const updateData = async (updatedData) => {
    const result = await updateSettingsAPI("shipping", updatedData);

    if (result.success) {
      dispatch(updateSettings({ key: "shipping", value: updatedData }));
      dispatchToastMessage("success", {
        title: __("Shipping rule updated", "kirki-ecommerce"),
      });

      setShowModal(false);
    } else {
      if (result?.errors) setErrors(normalizeErrors(result?.errors));
      else {
        dispatchToastMessage("error", { title: result?.message });
      }
    }
  };

  return (
    <>
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
              header={__("New Shipping Rules", "kirki-ecommerce")}
              leftIcon={<LighteningIcon />}
            />
          )}
          <Flex direction={"column"} gap={8}>
            <Text header="IF" />
            <Grid columns={3}>
              <Select
                value={selectedCondition}
                optionsArray={conditionOptions}
                placeholder={__("Product profile", "kirki-ecommerce")}
                onChange={(value) => setSelectedCondition(value)}
              />
              {selectedCondition === "cart_weight" ? (
                <Select
                  value={selectedOperator}
                  optionsArray={getOperatorOptions()}
                  onChange={(value) => setSelectedOperator(value)}
                />
              ) : (
                <Input value={__("is", "kirki-ecommerce")} readOnly />
              )}

              {selectedCondition === "destination_region" ? (
                <Input
                  value={selectedCountry}
                  onClick={() => setOpenDestinationPopup(true)}
                  readOnly
                  error={errors["value"]}
                />
              ) : selectedCondition === "cart_weight" ? (
                <Input
                  value={selectedConditionValue}
                  onChange={(value) => setSelectedConditionValue(value)}
                  error={errors["value"]}
                />
              ) : (
                <Select
                  value={selectedConditionValue}
                  optionsArray={getConditionValue()}
                  onChange={(value) => setSelectedConditionValue(value)}
                  error={errors["value"]}
                />
              )}
            </Grid>
          </Flex>
          <Flex direction={"column"} gap={8}>
            <Text header={__("THEN", "kirki-ecommerce")} />
            <Grid columns={2}>
              <Select
                optionsArray={actionOptionsArray}
                value={selectedAction}
                onChange={(value) => setSelectedAction(value)}
              />
              {(selectedAction === "set_shipping_cost" ||
                selectedAction === "add_shipping_cost") && (
                <Input
                  value={selectedActionValue}
                  placeholder="e.g., $100"
                  onChange={(value) => setSelectedActionValue(value)}
                  error={errors["value"]}
                />
              )}
            </Grid>
          </Flex>
          <Flex gap={8} style={{ justifyContent: "flex-end" }}>
            <Button
              type="secondary"
              text={__("Cancel", "kirki-ecommerce")}
              onClick={() => setShowModal(false)}
            />
            <Button
              type="primary"
              text={
                from === "edit" ? __("Save", "kirki-ecommerce") : __("Add Rule", "kirki-ecommerce")
              }
              onClick={handleAddOrUpdateShippingRule}
            />
          </Flex>
        </Flex>
      </Placeholder>
      {openDestinationPopup && (
        <SelectDestinationPopup
          openPopup={openDestinationPopup}
          setOpenPopup={setOpenDestinationPopup}
          selectedRegion={selectedRegion}
          selectedCountry={selectedCountry}
          setSelectedCountry={setSelectedCountry}
          setSelectedRegion={setSelectedRegion}
          selectedConditionValue={selectedConditionValue}
          setSelectedConditionValue={setSelectedConditionValue}
          setRulesObj={setRulesObj}
          ruleIndex={ruleIndex}
        />
      )}
    </>
  );
};

export default ShippingRuleModal;
