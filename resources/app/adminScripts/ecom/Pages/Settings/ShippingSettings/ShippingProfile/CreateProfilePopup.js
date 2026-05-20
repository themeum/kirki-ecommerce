import React, { useState, useEffect } from "react";
import {
  Popover,
  PopoverHeader,
  PopoverBody,
  PopoverFooter,
  Input,
  Button,
} from "../../../../molecules";
import {
  createShippingProfile,
  updateShippingProfileById,
  setKeyValue,
} from "../../../../store/settingsSlice";
import { dispatchToastMessage } from "../../../utils";
import { __ } from "wpi18n";
import { useDispatch } from "react-redux";

export const CreateProfilePopup = (props) => {
  const {
    isOpen,
    onClose = () => {},
    onSave = () => {},
    fetchProfileList,
    editIndex = null,
    shippingProfileList,
  } = props;
  const dispatch = useDispatch();
  const [profileTitle, setProfileTitle] = useState("");

  useEffect(() => {
    if (editIndex) {
      const selectedProfile = shippingProfileList.find(
        (profile) => profile?.id === editIndex
      );
      setProfileTitle(selectedProfile?.name);
    }
  }, [editIndex]);

  const AddOrUpdateShippingProfile = async () => {
    if (!profileTitle.trim()) return;

    const data = { name: profileTitle };
    let result;

    if (editIndex) {
      const selectedProfile = shippingProfileList.find(
        (profile) => profile?.id === editIndex
      );
      if (!selectedProfile) return;
      result = await updateShippingProfileById(selectedProfile.id, data);
    } else {
      result = await createShippingProfile(data);
    }

    if (result.success) {
      dispatch(
        setKeyValue({
          key: "toggler",
          value: Date.now(),
          nestedToggler: ["shipping", "shippingProfile"],
        })
      );
      onSave(result.data.id);
      dispatchToastMessage("success", {
        title: editIndex
          ? __("Shipping profile updated", "kirki-ecommerce")
          : __("Shipping profile created", "kirki-ecommerce"),
      });
      handleOnPopupClose();
    }
  };

  const handleOnPopupClose = () => {
    setProfileTitle("");
    onClose();
  };

  const buttonState = profileTitle === "";

  return (
    <div>
      <Popover isOpen={isOpen} style={{ width: "400px" }}>
        <PopoverHeader
          style={{ padding: "var(--decom-spacing-5)" }}
          onClose={handleOnPopupClose}
        >
          {__("Create shipping profile", "kirki-ecommerce")}
        </PopoverHeader>
        <PopoverBody
          style={{
            padding:
              "var(--decom-spacing-0) var(--decom-spacing-5) var(--decom-spacing-5) var(--decom-spacing-5)",
          }}
        >
          <Input
            label={__("Title", "kirki-ecommerce")}
            placeholder={__("e.g. Fragile", "kirki-ecommerce")}
            value={profileTitle}
            onChange={(value) => setProfileTitle(value)}
          />
        </PopoverBody>
        <PopoverFooter>
          <Button
            type="outlined"
            text={__("Cancel", "kirki-ecommerce")}
            size="small"
            onClick={handleOnPopupClose}
          />
          <Button
            type="primary"
            text={__("Save", "kirki-ecommerce")}
            size="small"
            onClick={AddOrUpdateShippingProfile}
            state={buttonState ? "disabled" : "default"}
          />
        </PopoverFooter>
      </Popover>
    </div>
  );
};
