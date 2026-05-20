import { PlusIcon } from "icons";
import { ActionGroup, Button, Flex, Select, Text } from "molecules";
import React from "react";
import { useSelector } from "react-redux";
import { useState } from "react";
import { __ } from "wpi18n";
import { useEffect } from "react";
import { getShippingBoxListAPI } from "../../../../store/settingsSlice";
import { useGetListAPI } from "hooks";
import { useNavigate } from "react-router";
import ShippingBoxPopup from "../../../Settings/ShippingSettings/ShippingBox/ShippingBoxPopup";

const ShippingBox = ({ value, errors, onChange = () => {}, invisible }) => {
  const navigate = useNavigate();
  const { loaded: shippingBoxLoaded, data: shippingBox } = useSelector(
    (state) => state.settings?.shipping?.shippingBox
  );
  const [openShippingBoxPopup, setOpenShippingBoxPopup] = useState(false);
  const [shippingBoxList, setShippingBoxList] = useState([]);
  useGetListAPI({
    reducerName: "settings",
    apiCallBack: getShippingBoxListAPI,
    nestedToggler: ["shipping", "shippingBox"],
    limit: -1,
  });

  useEffect(() => {
    if (shippingBoxLoaded) formatBoxList(shippingBox);
  }, [shippingBox]);

  const formatBoxList = (boxList = []) => {
    const allBoxList = boxList.map((item) => {
      return {
        value: item.id,
        title: `${item.name} - ${item.length} x ${item.width} x ${item.height} ${item.unit}`,
      };
    });
    setShippingBoxList(allBoxList);
  };

  const handleOnChange = (id) => {
    onChange(id, "shipping_box_id");
  };

  return (
    <>
      <Select
        optionsArray={shippingBoxList}
        invisible={invisible}
        value={value}
        onChange={(value) => handleOnChange(value)}
        error={errors?.shipping_box_id}
        dropdownHeader={
          <>
            <Flex
              style={{
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <Text
                subHeader={__("Available shipping boxes", "kirki-ecommerce")}
                type="primary"
              />

              <Button
                text={__("Manage", "kirki-ecommerce")}
                type="blank"
                style={{ color: "#5641F3" }}
                onClick={() => navigate("/settings/shipping")}
              />
            </Flex>
          </>
        }
        dropdownFooter={
          <ActionGroup>
            <Button
              type="secondary"
              text={__("Add new shipping box", "kirki-ecommerce")}
              size="small"
              leftIcon={<PlusIcon />}
              onClick={() => setOpenShippingBoxPopup(true)}
            />
          </ActionGroup>
        }
      />
      {openShippingBoxPopup && (
        <ShippingBoxPopup
          isOpen={openShippingBoxPopup}
          onSave={(value) => handleOnChange(value)}
          onClose={() => setOpenShippingBoxPopup(false)}
        />
      )}
    </>
  );
};

export default ShippingBox;
