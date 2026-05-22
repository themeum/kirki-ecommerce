import ActionGroup from '@/molecules/action-group';
import Button from '@/molecules/button';
import Card from '@/molecules/card';
import Flex from '@/molecules/flex';
import Input from '@/molecules/input';
import React from "react";
import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { __ } from "@/wpi18n";
import { updateProduct } from "../../../../store/productSlice";
import { useEffect } from "react";

const AddOrEditInfo = (props) => {
  const { index, onClose = () => {} } = props;
  const dispatch = useDispatch();
  const { data: productData } = useSelector((state) => state.product);
  const [infoData, setInfoData] = useState({});

  useEffect(() => {
    if (index || index === 0) {
      setInfoData({
        title: productData?.additional_info[index]?.title,
        description: productData?.additional_info[index]?.description,
      });
    }
  }, [index]);

  const handleOnChange = (value, fieldName) => {
    setInfoData((prev) => ({
      ...prev,
      [fieldName]: value,
    }));
  };

  const onSaveInfo = () => {
    if (index || index === 0) {
      const allData = [...productData?.additional_info];
      allData[index] = infoData;
      dispatch(
        updateProduct({
          key: "additional_info",
          value: allData,
        }),
      );
    } else {
      dispatch(
        updateProduct({
          key: "additional_info",
          value: [...(productData?.additional_info || []), infoData],
        }),
      );
    }
    setInfoData({});
    onClose();
  };

  return (
    <Card type="inner">
      <Flex direction="column" gap={16}>
        <Input
          label={__("Title", "kirki-ecommerce")}
          placeholder={__("e.g. Care Instructions", "kirki-ecommerce")}
          value={infoData?.title || ""}
          onChange={(value) => handleOnChange(value, "title")}
        />
        <Input
          label={__("Description", "kirki-ecommerce")}
          multiline={4}
          value={infoData?.description || ""}
          placeholder={__(
            "e.g. Clean with a damp cloth, avoid harsh chemicals, and store in a cool, dry place. Regular maintenance will keep it lookingnew!",
            "kirki-ecommerce",
          )}
          onChange={(value) => handleOnChange(value, "description")}
        />
        <ActionGroup>
          <Button
            text={__("Cancel", "kirki-ecommerce")}
            type="secondary"
            size="small"
            onClick={() => {
              setInfoData({});
              onClose();
            }}
          />
          <Button
            text={__("OK", "kirki-ecommerce")}
            type="primary"
            size="small"
            state={!infoData.title || !infoData?.description ? "disabled" : ""}
            onClick={onSaveInfo}
          />
        </ActionGroup>
      </Flex>
    </Card>
  );
};

export default AddOrEditInfo;
