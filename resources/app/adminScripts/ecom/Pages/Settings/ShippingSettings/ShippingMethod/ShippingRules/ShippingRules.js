import React, { useState, useEffect } from "react";
import {
  Card,
  Flex,
  ActionGroup,
  Text,
  Button,
} from "../../../../../molecules";
import { __, sprintf } from "wpi18n";
import { CLASS_PREFIX } from "conf";
import { LighteningIcon, EditPenIcon, TrashIcon } from "icons";
import HeaderActionsCard from "../../../../../components/HeaderActionsCard";
import ShippingRuleModal from "./ShippingRuleModal";
import { useSelector } from "react-redux";
import { useSearchParams } from "react-router";
import { saveShippingZones } from "../../utils";
import { dispatchToastMessage } from "../../../../utils";

export const ShippingRules = (props) => {
  const { methodId } = props;
  const [searchParams] = useSearchParams();
  const zoneId = searchParams.get("zoneId");

  const [addRuleModal, setAddRuleModal] = useState(false);
  const [editingRuleIndex, setEditingRuleIndex] = useState(null);

  const [rulesObj, setRulesObj] = useState([]);
  const { data: shippingSettingsData, activeZoneId } = useSelector(
    (state) => state.settings?.shipping
  );

  useEffect(() => {
    if (!shippingSettingsData?.shipping_zones?.length || !methodId) return;
    let foundMethod = null;

    for (const zone of shippingSettingsData.shipping_zones) {
      const method = zone.shipping_methods?.find((m) => m.id === methodId);

      if (method) {
        foundMethod = method;
        break;
      }
    }
    if (foundMethod) {
      setRulesObj(foundMethod.shipping_rules || []);
    }
  }, [shippingSettingsData, methodId]);

  const handleDeleteRules = async (index) => {
    const originalZones = [...rulesObj];
    const updatedRules = rulesObj.filter((_, idx) => idx !== index);
    setRulesObj(updatedRules);

    const updatedShippingZones = shippingSettingsData?.shipping_zones.map(
      (zone) => {
        if (zone.id !== zoneId) return zone;

        return {
          ...zone,
          shipping_methods: zone?.shipping_methods.map((method) => {
            if (method.id !== methodId) return method;

            return {
              ...method,
              shipping_rules: updatedRules,
            };
          }),
        };
      }
    );

    dispatchToastMessage("delete", {
      title: __("Shipping rule deleted", "kirki-ecommerce"),
      duration: 5000,
      undoAction: () => {
        setRulesObj(originalZones);
      },
      onSuccess: async () => {
        await saveShippingZones({
          zones: updatedShippingZones,
          from: "delete",
          shippingSettingsData,
        });
      },
    });
  };
  return (
    <div>
      <Card type="large">
        <HeaderActionsCard
          header={__("Shipping Rules", "kirki-ecommerce")}
          subHeader={__(
            "Define conditional rules to adjust shipping prices based on product type, weight, zone, or cart value.",
            "kirki-ecommerce"
          )}
          buttonText={__("Add Rule", "kirki-ecommerce")}
          onAdd={() => setAddRuleModal(true)}
        />
        {(addRuleModal || rulesObj.length > 0) && (
          <Flex direction={"column"} gap={16}>
            {addRuleModal && (
              <ShippingRuleModal
                methodId={methodId}
                rulesObj={rulesObj}
                setRulesObj={setRulesObj}
                showModal={addRuleModal}
                setShowModal={setAddRuleModal}
                from={activeZoneId ? "add" : "edit"}
              />
            )}

            {rulesObj?.map((item, index) => (
              <div>
                <Card
                  className={`${CLASS_PREFIX}-shipping-rules-card`}
                  key={index}
                >
                  <Flex style={{ justifyContent: "space-between" }}>
                    <Flex direction={"column"} gap={16}>
                      <Card
                        type="dark"
                        className={`${CLASS_PREFIX}-rules-number-badge`}
                      >
                        <Text
                          type="xsm"
                          header={sprintf(__("Rule %s", "kirki-ecommerce"), index + 1)}
                          leftIcon={<LighteningIcon />}
                        />
                      </Card>
                      <Flex direction={"column"} gap={8}>
                        <Flex gap={8}>
                          <Text
                            header={sprintf(
                              __("IF %1$s %2$s", "kirki-ecommerce"),
                              item?.conditions[0]?.type,
                              item?.conditions[0]?.operator
                            )}
                          />
                          <Text
                            header={sprintf(
                              __("%s", "kirki-ecommerce"),
                              item?.conditions[0]?.type === "destination_region"
                                ? item?.conditions[0]?.value?.country
                                : item?.conditions[0]?.value
                            )}
                            style={{ color: "#9747FF" }}
                          />
                        </Flex>
                        <Flex gap={8}>
                          <Text header={sprintf(__("Then %s:", "kirki-ecommerce"))} />
                          {(item?.action?.type === "set_shipping_cost" ||
                            item?.action?.type === "add_shipping_cost") && (
                            <Text
                              header={sprintf(
                                __("%d", "kirki-ecommerce"),
                                item?.action?.value
                              )}
                              style={{ color: "#9747FF" }}
                            />
                          )}
                        </Flex>
                      </Flex>
                    </Flex>
                    <ActionGroup className={`${CLASS_PREFIX}-card-actions`}>
                      <Button
                        type="secondary"
                        size="small"
                        icon={<TrashIcon />}
                        onClick={() => handleDeleteRules(index)}
                      />

                      <Button
                        type="secondary"
                        size="small"
                        icon={<EditPenIcon />}
                        onClick={() => setEditingRuleIndex(index)}
                      />
                    </ActionGroup>
                  </Flex>
                  {editingRuleIndex === index && (
                    <ShippingRuleModal
                      methodId={methodId}
                      rulesObj={rulesObj[index]}
                      setRulesObj={setRulesObj}
                      showModal={true}
                      setShowModal={() => setEditingRuleIndex(null)}
                      from={"edit"}
                      ruleIndex={index}
                    />
                  )}
                </Card>
              </div>
            ))}
          </Flex>
        )}
      </Card>
    </div>
  );
};
