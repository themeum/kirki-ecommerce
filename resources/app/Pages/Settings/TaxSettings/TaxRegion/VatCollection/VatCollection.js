import React, { useState } from "react";
import { Button, Card, Flex, Text } from "../../../../../molecules";
import { TrashIcon } from "@/Icons";
import HeaderActionsCard from "../../../../../components/HeaderActionsCard";
import VatCollectionPopup from "./VatCollectionPopup";
import { CLASS_PREFIX } from "@/conf";
import { __ } from "@/wpi18n";

import { dispatchToastMessage } from "../../../../utils";

export const VatCollection = (props) => {
  const {
    region,
    process,
    vatCollectionList,
    setVatCollectionList,
    updateVatCollection,
  } = props;
  const [showVatCollectionPopup, setShowVatCollectionPopup] = useState(false);
  const [editIndex, setEditIndex] = useState(null);

  const disableAddVatButton =
    process !== "oss" && vatCollectionList?.length >= 1;

  const filteredStatesOption = Array.isArray(region?.states)
    ? region.states
        .filter((state) => {
          if (editIndex === null || editIndex === undefined) {
            return !vatCollectionList.some((vat) => vat.state === state?.id);
          }

          return !vatCollectionList.some(
            (vat, index) => index !== editIndex && vat.state === state?.id
          );
        })
        .map((state) => ({
          title: state?.id,
          value: state?.id,
          leftIcon: state?.flag,
        }))
    : [];

  const handleAddOrUpdateVAT = (newItem, index) => {
    setVatCollectionList((prev) => {
      const safePrev = Array.isArray(prev) ? prev : [];
      const updatedList =
        typeof index === "number"
          ? safePrev.map((item, i) => (i === index ? newItem : item))
          : [...safePrev, newItem];

      updateVatCollection(updatedList);
      setEditIndex(null);
      return updatedList;
    });

    setShowVatCollectionPopup(false);
  };

  const handleEditVatRate = (index) => {
    setEditIndex(index);
    setShowVatCollectionPopup(true);
  };

  const handleDeleteItem = (itemToDelete) => {
    const initialList = Array.isArray(vatCollectionList)
      ? [...vatCollectionList]
      : [];

    const updatedList = initialList.filter(
      (item) =>
        item.state !== itemToDelete.state || item.rate !== itemToDelete.rate
    );
    setVatCollectionList(updatedList);
    dispatchToastMessage("delete", {
      title: __("VAT collection deleted", "kirki-ecommerce"),
      duration: 5000,
      undoAction: () => {
        setVatCollectionList(initialList);
      },
      onSuccess: async () => {
        updateVatCollection(updatedList, "delete");
      },
    });
  };

  const getFlagForState = (stateName) => {
    const country = region?.states.find((region) => region.id === stateName);
    return country?.flag || "";
  };

  return (
    <div>
      <Card type="large">
        <HeaderActionsCard
          header={__("VAT Collection", "kirki-ecommerce")}
          subHeader={__(
            "Used to create shipping rates for different product groups, like heavy items needing higher fees.",
            "kirki-ecommerce"
          )}
          buttonText={__("Collect VAT", "kirki-ecommerce")}
          hideButton={disableAddVatButton}
          onAdd={() => setShowVatCollectionPopup(true)}
        />
        <Flex direction="column" gap={8}>
          {vatCollectionList?.map((item, index) => (
            <Card
              type={"inner"}
              key={index}
              className={`${CLASS_PREFIX}-vat-row`}
            >
              <Text
                header={item?.state}
                leftIcon={getFlagForState(item?.state)}
              />
              <Text
                header={`${item?.rate}%`}
                className={`${CLASS_PREFIX}-vat-text`}
              />
              <Flex gap={8} className={`${CLASS_PREFIX}-vat-actions`}>
                <Button
                  type={"tartiary"}
                  text={__("Edit Rates", "kirki-ecommerce")}
                  onClick={() => handleEditVatRate(index)}
                />
                <Button
                  type={"secondary"}
                  size={"icon"}
                  icon={<TrashIcon />}
                  onClick={() => handleDeleteItem(item)}
                />
              </Flex>
            </Card>
          ))}
        </Flex>
      </Card>
      {showVatCollectionPopup && (
        <VatCollectionPopup
          statesOption={filteredStatesOption}
          openPopup={showVatCollectionPopup}
          setOpenPopup={setShowVatCollectionPopup}
          onAdd={handleAddOrUpdateVAT}
          editIndex={editIndex}
          setEditIndex={setEditIndex}
          vatCollectionList={vatCollectionList}
        />
      )}
    </div>
  );
};
