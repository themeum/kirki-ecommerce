import React, { useEffect, useState } from "react";
import Popover from '@/molecules/popover/popover';
import PopoverBody from '@/molecules/popover/popover-body';
import PopoverHeader from '@/molecules/popover/popover-header';
import PopoverFooter from '@/molecules/popover/popover-footer';
import Input from '@/molecules/input';
import Button from '@/molecules/button';
import {
  createTaxProfile,
  setKeyValue,
  updateTaxProfileAPI,
} from "../../../../store/settingsSlice";
import { __ } from "@/wpi18n";
import { useDispatch } from "react-redux";
import { dispatchToastMessage } from "../../../utils";

export const TaxProfilePopup = (props) => {
  const {
    isOpen,
    onClose = () => {},
    onSave = () => {},
    from = "",
    taxProfile = null,
  } = props;
  const dispatch = useDispatch();
  const [profileTitle, setProfileTitle] = useState("");

  useEffect(() => {
    if (taxProfile) {
      setProfileTitle(taxProfile?.name);
    }
  }, []);

  const AddOrUpdateTaxProfile = async () => {
    let data = {
      name: profileTitle,
    };
    const result =
      from === "edit"
        ? await updateTaxProfileAPI(taxProfile?.id, data)
        : await createTaxProfile(data);
    if (result.success) {
      dispatch(
        setKeyValue({
          key: "toggler",
          value: Date.now(),
          nestedToggler: ["tax", "taxProfile"],
        })
      );
      onSave(result?.data?.id);
      dispatchToastMessage("success", {
        title:
          from === "edit"
            ? __("Tax profile updated", "kirki-ecommerce")
            : __("Tax profile created", "kirki-ecommerce"),
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
          {__("Create tax profile", "kirki-ecommerce")}
        </PopoverHeader>
        <PopoverBody
          style={{
            padding:
              "var(--decom-spacing-0) var(--decom-spacing-5) var(--decom-spacing-5) var(--decom-spacing-5)",
          }}
        >
          <Input
            label={__("Title", "kirki-ecommerce")}
            placeholder={__("e.g. Books", "kirki-ecommerce")}
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
            text={from === "edit" ? __("Update", "kirki-ecommerce") : __("Save", "kirki-ecommerce")}
            size="small"
            onClick={AddOrUpdateTaxProfile}
            state={buttonState ? "disabled" : "default"}
          />
        </PopoverFooter>
      </Popover>
    </div>
  );
};
