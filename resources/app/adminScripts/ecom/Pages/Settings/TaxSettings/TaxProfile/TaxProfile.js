import React, { useState, useEffect } from "react";
import { Card, Flex } from "../../../../molecules";
import HeaderActionsCard from "../../../../components/HeaderActionsCard";
import GroupOptionCard from "../../../../components/GroupOptionCard";
import { BoxOpenIcon, BoxClosedIcon } from "icons";
import { CLASS_PREFIX } from "conf";
import { __ } from "wpi18n";
import {
  deleteTaxProfileById,
  getTaxProfileListAPI,
  setKeyValue,
} from "../../../../store/settingsSlice";
import { TaxProfilePopup } from "./TaxProfilePopup";
import { dispatchToastMessage } from "../../../utils";
import { useSelector, useDispatch } from "react-redux";
import useGetListAPI from "../../../../hooks/useGetListAPI";
const TaxProfile = () => {
  const dispatch = useDispatch();
  const [showPopup, setShowPopup] = useState(false);
  const [editingProfile, setEditingProfile] = useState(null);
  const [taxProfileList, setTaxProfileList] = useState([]);
  useGetListAPI({
    reducerName: "settings",
    apiCallBack: getTaxProfileListAPI,
    nestedToggler: ["tax", "taxProfile"],
  });
  const { loaded, data: taxProfile } = useSelector(
    (state) => state.settings?.tax?.taxProfile,
  );

  useEffect(() => {
    fetchTaxProfileList();
  }, [taxProfile]);

  const fetchTaxProfileList = async () => {
    const updatedData = taxProfile?.map((item) => ({
      ...item,
      icon: <BoxClosedIcon />,
    }));

    setTaxProfileList(updatedData);
  };

  useEffect(() => {
    if (taxProfile && taxProfile?.length) fetchTaxProfileList();
  }, [taxProfile?.length]);

  const handleDeleteTaxProfile = async (item) => {
    const initialList = [...taxProfileList];

    setTaxProfileList((prev) =>
      prev.filter((profile) => profile?.id !== item?.id),
    );
    dispatchToastMessage("delete", {
      title: __("Tax profile deleted", "kirki-ecommerce"),
      duration: 5000,
      undoAction: () => {
        setTaxProfileList(initialList);
      },
      onSuccess: async () => {
        const result = await deleteTaxProfileById(item?.id);
        if (result.success) {
          dispatch(
            setKeyValue({
              key: "toggler",
              value: Date.now(),
              nestedToggler: ["tax", "taxProfile"],
            }),
          );
        }
      },
    });
  };

  const handleEditTaxProfile = (item) => {
    setEditingProfile(item);
  };

  return (
    <div>
      <Card type="large">
        <HeaderActionsCard
          header={__("Tax Profiles", "kirki-ecommerce")}
          subHeader={__(
            "Used to create tax rates for different product groups, like heavy items needing higher fees.",
            "kirki-ecommerce",
          )}
          buttonText={__("Create Profile", "kirki-ecommerce")}
          onAdd={() => setShowPopup(true)}
        />

        {!taxProfileList?.length ? (
          <Card type="innerDark" style={{ padding: "36px 0" }}>
            <Flex direction="column" gap={8} style={{ alignItems: "center" }}>
              <BoxOpenIcon />
              <span style={{ color: "#878593" }}>
                {__("Added shipping profiles will appear here", "kirki-ecommerce")}
              </span>
            </Flex>
          </Card>
        ) : (
          <Flex direction="column" className={`${CLASS_PREFIX}-box-wrapper`}>
            <GroupOptionCard
              dataArr={taxProfileList}
              handleDeleteItem={handleDeleteTaxProfile}
              handleEditItem={handleEditTaxProfile}
            />
          </Flex>
        )}
      </Card>
      {/* refactor this part */}
      {showPopup && (
        <TaxProfilePopup
          isOpen={showPopup}
          onClose={() => setShowPopup(false)}
          fetchTaxProfileList={fetchTaxProfileList}
        />
      )}
      {editingProfile && (
        <TaxProfilePopup
          isOpen={editingProfile}
          onClose={() => setEditingProfile(null)}
          fetchTaxProfileList={fetchTaxProfileList}
          from="edit"
          taxProfile={editingProfile}
        />
      )}
    </div>
  );
};

export default TaxProfile;
