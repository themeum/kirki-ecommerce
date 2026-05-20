import React, { useEffect, useState } from "react";
import { Card } from "../../../../molecules";
import GroupOptionCard from "../../../../components/GroupOptionCard";
import HeaderActionsCard from "../../../../components/HeaderActionsCard";
import ShippingBoxPopup from "./ShippingBoxPopup";
import {
  deleteShippingBoxByIdAPI,
  getShippingBoxListAPI,
  updateShippingBoxAPI,
  setKeyValue,
} from "../../../../store/settingsSlice";
import { __ } from "wpi18n";
import { dispatchToastMessage } from "../../../utils";
import { useDispatch, useSelector } from "react-redux";
import useGetListAPI from "../../../../hooks/useGetListAPI";

const ShippingBox = () => {
  const dispatch = useDispatch();
  const [openPopup, setOpenPopup] = useState(false);
  const [shippingBoxList, setShippingBoxList] = useState([]);
  const [editedItem, setEditedItem] = useState(null);
  useGetListAPI({
    reducerName: "settings",
    apiCallBack: getShippingBoxListAPI,
    nestedToggler: ["shipping", "shippingBox"],
    limit: -1,
  });
  const { data: shippingBox } = useSelector(
    (state) => state.settings?.shipping?.shippingBox,
  );

  useEffect(() => {
    fetchShippingBoxList();
  }, [shippingBox]);

  const openCreatePopup = () => {
    setEditedItem(null);
    setOpenPopup(true);
  };

  const openEditPopup = (item) => {
    setEditedItem(item);
    setOpenPopup(true);
  };

  const closePopup = () => {
    setOpenPopup(false);
    setEditedItem(null);
  };

  const fetchShippingBoxList = () => {
    const updatedList = shippingBox?.map((box) => ({
      ...box,
      // badge1: box.is_default === true ? "default" : null,
      is_action_disabled: box.is_default === true,
      actionsArray: getActionArray(box),
    }));

    setShippingBoxList(updatedList);
  };

  useEffect(() => {
    if (shippingBox && shippingBox.length) fetchShippingBoxList();
  }, [shippingBox?.length]);

  const handleAction = async (action, item) => {
    let result;
    if (action === "delete") {
      const initialList = [...shippingBoxList];
      setShippingBoxList((boxList) =>
        boxList.filter((box) => box?.id !== item?.id),
      );

      dispatchToastMessage("delete", {
        title: __("Shipping box deleted", "kirki-ecommerce"),
        duration: 5000,
        undoAction: () => {
          setShippingBoxList(initialList);
        },
        onSuccess: async () => {
          result = await deleteShippingBoxByIdAPI(item?.id);
        },
      });
    } else {
      let data = {
        ...item,
        is_default: !item?.is_default,
      };
      result = await updateShippingBoxAPI(item?.id, data);
    }
    if (result?.success) {
      dispatch(
        setKeyValue({
          key: "toggler",
          value: Date.now(),
          nestedToggler: ["shipping", "shippingBox"],
        }),
      );
      dispatchToastMessage("success", {
        title: item?.is_default
          ? __("Shipping box unset as default", "kirki-ecommerce")
          : __("Shipping box set as default", "kirki-ecommerce"),
      });
    }
  };

  const getActionArray = (box) => {
    if (box.is_default) return [];
    return [
      {
        title: box.is_default
          ? __("Unset as Default", "kirki-ecommerce")
          : __("Set as Default", "kirki-ecommerce"),
        value: "set_default",
      },
      {
        title: __("Delete", "kirki-ecommerce"),
        value: "delete",
      },
    ];
  };

  return (
    <>
      <Card type="large">
        <HeaderActionsCard
          header={__("Shipping Box", "kirki-ecommerce")}
          subHeader={__(
            "Configure box sizes for accurate shipping cost calculations.",
            "kirki-ecommerce",
          )}
          buttonText={__("Create Box", "kirki-ecommerce")}
          onAdd={openCreatePopup}
        />
        <GroupOptionCard
          dataArr={shippingBoxList}
          handleEditItem={openEditPopup}
          handleMoreOption={true}
          actionsArray={[]}
          handleAction={handleAction}
        />
      </Card>
      {openPopup && (
        <ShippingBoxPopup
          isOpen={openPopup}
          onClose={closePopup}
          selectedItem={editedItem}
          fetchShippingBoxList={fetchShippingBoxList}
        />
      )}
    </>
  );
};

export default ShippingBox;
