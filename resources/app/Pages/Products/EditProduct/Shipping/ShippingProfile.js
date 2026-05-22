import { Card, Checkbox, Grid, Select } from "@/molecules";
import React, { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import { __ } from "@/wpi18n";
import { CreateProfilePopup } from "../../../Settings/ShippingSettings/ShippingProfile/CreateProfilePopup";
import { getShippingProfileList } from "../../../../store/settingsSlice";
import { useGetListAPI } from "@/hooks";

const ShippingProfile = ({ errors, onChange = () => {} }) => {
  const { data: productData } = useSelector((state) => state.product);
  useGetListAPI({
    reducerName: "settings",
    apiCallBack: getShippingProfileList,
    nestedToggler: ["shipping", "shippingProfile"],
  });

  const [shippingProfileList, setShippingProfileList] = useState([]);
  const [openAddProfilePopup, setOpenAddProfilePopup] = useState(false);
  const [show, setShow] = useState(false);

  const { loaded, data: shippingProfile } = useSelector(
    (state) => state.settings?.shipping?.shippingProfile,
  );

  useEffect(() => {
    if (loaded) formatProfileList();
  }, [shippingProfile]);

  useEffect(() => {
    setShow(productData?.variants[0].shipping_profile_id ? true : false);
  }, [productData]);

  const formatProfileList = () => {
    const updatedData = shippingProfile?.map((item) => ({
      value: item.id,
      title: item.name,
    }));

    setShippingProfileList(updatedData);
  };

  const handleOnViewProfileOptions = (value, fieldName) => {
    setShow(value);
    onChange(null, fieldName);
  };

  return (
    <Card
      type="innerDark"
      style={{
        padding: "4px 8px 4px 12px",
        height: "44px",
      }}
    >
      <Grid style={{ alignItems: "center" }}>
        <Checkbox
          value={show}
          label={__("Assign shipping profile", "kirki-ecommerce")}
          helpText={__("Assign shipping profile", "kirki-ecommerce")}
          error={errors?.["variants.0.shipping_profile_id"]}
          onChange={(value) =>
            handleOnViewProfileOptions(value, "shipping_profile_id")
          }
        />
        <Select
          optionsArray={shippingProfileList}
          btnText="Add Shhipping Profile"
          onNewItemAdd={() => setOpenAddProfilePopup(true)}
          style={{
            visibility: show ? "visible" : "hidden",
          }}
          value={productData?.variants[0].shipping_profile_id}
          onChange={(value) => onChange(value, "shipping_profile_id")}
        />
      </Grid>
      <CreateProfilePopup
        isOpen={openAddProfilePopup}
        onClose={() => setOpenAddProfilePopup(false)}
        onSave={(value) => onChange(value, "shipping_profile_id")}
      />
    </Card>
  );
};

export default ShippingProfile;
