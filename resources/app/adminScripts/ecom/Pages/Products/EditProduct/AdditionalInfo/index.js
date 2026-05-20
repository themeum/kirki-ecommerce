import { EditIcon, PlusIcon, TrashIcon } from "icons";
import { ActionGroup, Button, Card, Flex, Text } from "molecules";
import React from "react";
import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { __ } from "wpi18n";
import AddOrEditInfo from "./AddOrEditInfo";
import { CLASS_PREFIX } from "conf";
import { updateProduct } from "../../../../store/productSlice";

const AdditionalInfo = () => {
  const dispatch = useDispatch();
  const { data: productData } = useSelector((state) => state.product);
  const [showInfoForm, setShowInfoForm] = useState(false);
  const [editedIndex, setEditedIndex] = useState(null);

  const onClose = () => {
    setEditedIndex(null);
    setShowInfoForm(false);
  };

  const onEditInfo = (index) => {
    setEditedIndex(index);
    setShowInfoForm(true);
  };

  const onDeleteInfo = (deletedIndex) => {
    const newDataList = productData?.additional_info.filter(
      (item, index) => index !== deletedIndex,
    );
    dispatch(
      updateProduct({
        key: "additional_info",
        value: newDataList,
      }),
    );
  };
  return (
    <>
      <Text
        header={__("Additional Info", "kirki-ecommerce")}
        subHeader={__(
          "Share information like return policy or care instructions with your customers.",
          "kirki-ecommerce",
        )}
        type="primary"
      />
      {showInfoForm ? (
        <AddOrEditInfo index={editedIndex} onClose={onClose} />
      ) : (
        <>
          {productData?.additional_info &&
            productData?.additional_info?.length > 0 && (
              <div>
                {productData?.additional_info.map((item, index) => (
                  <Card
                    type="inner"
                    key={index}
                    className={`${CLASS_PREFIX}-option-card ${CLASS_PREFIX}-hover-parent ${
                      productData?.additional_info?.length > 1
                        ? `${CLASS_PREFIX}-option-card-border-radius`
                        : `${CLASS_PREFIX}-option-card-border-radius-single`
                    }`}
                  >
                    <Flex
                      style={{
                        alignItems: "flex-start",
                      }}
                    >
                      <Text
                        type="primary"
                        header={item?.title}
                        subHeader={item?.description}
                      />
                      <ActionGroup className={`${CLASS_PREFIX}-hover-visible`}>
                        <Button
                          icon={<TrashIcon />}
                          type="secondary"
                          size="small"
                          onClick={() => onDeleteInfo(index)}
                        />
                        <Button
                          icon={<EditIcon />}
                          type="secondary"
                          size="small"
                          onClick={() => onEditInfo(index)}
                        />
                      </ActionGroup>
                    </Flex>
                  </Card>
                ))}
              </div>
            )}
          <Button
            text={__("Add an Info Section", "kirki-ecommerce")}
            type="secondary"
            size="small"
            leftIcon={<PlusIcon />}
            onClick={() => setShowInfoForm(true)}
          />
        </>
      )}
    </>
  );
};

export default AdditionalInfo;
