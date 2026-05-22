import React, { useEffect, useState } from "react";
import {
  Button,
  Card,
  Flex,
  Text,
  ActionGroup,
} from "../../../../../molecules";
import { EditPenIcon, LighteningIcon, TrashIcon } from "@/Icons";
import HeaderActionsCard from "../../../../../components/HeaderActionsCard";
import TaxRulesModal from "./TaxRulesModal";
import { CLASS_PREFIX } from "@/conf";
import { getDestinationDisplayValue } from "./helper";
import { __, sprintf } from "@/wpi18n";
import { dispatchToastMessage } from "../../../../utils";

const TaxRules = (props) => {
  const { region, updateTaxRules } = props;
  const [addRuleModal, setAddRuleModal] = useState(false);
  const [rulesObj, setRulesObj] = useState([]);
  const [editingRuleIndex, setEditingRuleIndex] = useState(null);

  useEffect(() => {
    setRulesObj(Array.isArray(region?.rules) ? [...region.rules] : []);
  }, [region]);

  const handleDeleteRules = (item, index) => {
    const initialRules = Array.isArray(rulesObj) ? [...rulesObj] : [];
    const updatedRules = initialRules.filter((_, i) => i !== index);
    setRulesObj(updatedRules);

    dispatchToastMessage("delete", {
      title: __("Tax rule deleted", "kirki-ecommerce"),
      duration: 5000,
      undoAction: () => {
        setRulesObj(initialRules);
      },
      onSuccess: async () => {
        updateTaxRules(updatedRules, "delete");
      },
    });
  };

  return (
    <div>
      <Card type="large">
        <HeaderActionsCard
          header={__("Tax Rules", "kirki-ecommerce")}
          subHeader={__(
            "Define conditional rules to adjust tax prices based on product type, weight, zone, or cart value.",
            "kirki-ecommerce"
          )}
          buttonText={__("Add Rule", "kirki-ecommerce")}
          onAdd={() => setAddRuleModal(true)}
        />
        {(addRuleModal || rulesObj.length > 0) && (
          <Flex direction={"column"} gap={16}>
            {addRuleModal && (
              <TaxRulesModal
                showModal={addRuleModal}
                setShowModal={setAddRuleModal}
                rulesObj={rulesObj}
                setRulesObj={setRulesObj}
                updateTaxRules={updateTaxRules}
                from={"add"}
                region={region}
              />
            )}
            <div>
              {rulesObj?.map((item, index) => (
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
                        <Flex direction={"column"} gap={8}>
                          {item?.conditions.map((condition, index) => (
                            <Flex gap={8} key={index}>
                              <Text
                                header={
                                  index === 0
                                    ? sprintf(
                                        __("IF %1$s %2$s", "kirki-ecommerce"),
                                        condition?.type,
                                        condition?.operator
                                      )
                                    : sprintf(
                                        __("AND IF %1$s %2$s", "kirki-ecommerce"),
                                        condition?.type,
                                        condition?.operator
                                      )
                                }
                              />
                              <Text
                                header={
                                  condition?.type === "destination_region"
                                    ? __(
                                        getDestinationDisplayValue(
                                          condition?.value
                                        ),
                                        "kirki-ecommerce"
                                      )
                                    : sprintf(
                                        __("%s", "kirki-ecommerce"),
                                        condition?.value
                                      )
                                }
                                style={{
                                  color: "var(--decom-text-text-special-3)",
                                }}
                              />
                            </Flex>
                          ))}
                        </Flex>
                        <Flex gap={8}>
                          <Text
                            header={
                              item?.action?.type === "set_tax_rate"
                                ? `Then ${item?.action?.type}:`
                                : `Then ${item?.action?.type}`
                            }
                          />
                          {item?.action?.type === "set_tax_rate" && (
                            <Text
                              header={`${item?.action?.value}`}
                              style={{
                                color: "var(--decom-text-text-special-3)",
                              }}
                            />
                          )}
                        </Flex>
                      </Flex>
                    </Flex>
                    <ActionGroup className={`${CLASS_PREFIX}-card-actions`}>
                      <Button
                        type={"secondary"}
                        size={"icon"}
                        icon={<TrashIcon />}
                        onClick={() => handleDeleteRules(item, index)}
                      />
                      <Button
                        type={"secondary"}
                        size={"icon"}
                        icon={<EditPenIcon />}
                        onClick={() => setEditingRuleIndex(index)}
                      />
                    </ActionGroup>
                  </Flex>
                  {editingRuleIndex === index && (
                    <TaxRulesModal
                      region={region}
                      rulesObj={rulesObj}
                      setRulesObj={setRulesObj}
                      updateTaxRules={updateTaxRules}
                      showModal={true}
                      setShowModal={() => setEditingRuleIndex(null)}
                      from={"edit"}
                      ruleIndex={index}
                    />
                  )}
                </Card>
              ))}
            </div>
          </Flex>
        )}
      </Card>
    </div>
  );
};

export default TaxRules;
