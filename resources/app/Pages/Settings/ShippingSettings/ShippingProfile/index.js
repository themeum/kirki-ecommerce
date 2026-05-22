import React, { useState, useEffect } from "react";
import { Card, Flex } from "../../../../molecules";
import { BoxClosedIcon, BoxOpenIcon } from "@/Icons";
import { CLASS_PREFIX } from "@/conf";
import GroupOptionCard from "../../../../components/GroupOptionCard";
import HeaderActionsCard from "../../../../components/HeaderActionsCard";
import { CreateProfilePopup } from "./CreateProfilePopup";
import {
  deleteShippingProfileById,
  getShippingProfileList,
  setKeyValue,
} from "../../../../store/settingsSlice";
import { __ } from "@/wpi18n";
import useGetListAPI from "../../../../hooks/useGetListAPI";
import { dispatchToastMessage } from "../../../utils";
import { useDispatch, useSelector } from "react-redux";

const ShippingProfile = () => {
  const dispatch = useDispatch();
  const [showPopup, setShowPopup] = useState(false);
  const [editProfileIndex, setEditProfileIndex] = useState(null);
  const [shippingProfileList, setShippingProfileList] = useState([]);
  useGetListAPI({
    reducerName: "settings",
    apiCallBack: getShippingProfileList,
    nestedToggler: ["shipping", "shippingProfile"],
  });

  const { loaded, data: shippingProfile } = useSelector(
    (state) => state.settings?.shipping?.shippingProfile,
  );

  useEffect(() => {
    fetchProfileList();
  }, [shippingProfile]);

  const fetchProfileList = () => {
    const updatedData = shippingProfile?.map((item) => ({
      ...item,
      icon: <BoxClosedIcon />,
    }));

    setShippingProfileList(updatedData);
  };

  useEffect(() => {
    if (shippingProfile && shippingProfile.length) fetchProfileList();
  }, [shippingProfile?.length]);

  const handleEditShippingProfile = async (item) => {
    setEditProfileIndex(item?.id);
    setShowPopup(true);
  };
  const handleDeleteShippingProfile = async (item) => {
    const initialList = [...shippingProfileList];
    setShippingProfileList((prev) =>
      prev.filter((profile) => profile.id !== item.id),
    );

    dispatchToastMessage("delete", {
      title: __("Shipping profile deleted", "kirki-ecommerce"),
      duration: 5000,
      undoAction: () => {
        setShippingProfileList(initialList);
      },
      onSuccess: async () => {
        const result = await deleteShippingProfileById(item?.id);
        if (result.success) {
          dispatch(
            setKeyValue({
              key: "toggler",
              value: Date.now(),
              nestedToggler: ["shipping", "shippingProfile"],
            }),
          );
        }
      },
    });
  };

  return (
    <>
      <Card type="large">
        <HeaderActionsCard
          header={__("Shipping Profiles", "kirki-ecommerce")}
          subHeader={__(
            "Used to create shipping rates for different product groups, like heavy items needing higher fees.",
            "kirki-ecommerce",
          )}
          buttonText={__("Create Profile", "kirki-ecommerce")}
          onAdd={() => setShowPopup(true)}
        />

        {!shippingProfileList?.length ? (
          <Card
            type="innerDark"
            style={{ padding: "var(--decom-spacing-9) var(--decom-spacing-0)" }}
          >
            <Flex direction="column" gap={8} style={{ alignItems: "center" }}>
              <BoxOpenIcon />
              <span style={{ color: "var(--decom-text-text-subdued)" }}>
                {__("Added shipping profiles will appear here", "kirki-ecommerce")}
              </span>
            </Flex>
          </Card>
        ) : (
          <Flex direction="column" className={`${CLASS_PREFIX}-box-wrapper`}>
            <GroupOptionCard
              dataArr={shippingProfileList}
              handleDeleteItem={handleDeleteShippingProfile}
              handleEditItem={handleEditShippingProfile}
            />
          </Flex>
        )}
      </Card>
      {showPopup && (
        <CreateProfilePopup
          isOpen={showPopup}
          onClose={() => {
            setShowPopup(false);
            setEditProfileIndex(null);
          }}
          shippingProfileList={shippingProfileList}
          fetchProfileList={fetchProfileList}
          editIndex={editProfileIndex}
        />
      )}
    </>
  );
};

export default ShippingProfile;
