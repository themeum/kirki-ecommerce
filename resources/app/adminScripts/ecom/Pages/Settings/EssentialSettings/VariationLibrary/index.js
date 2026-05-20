import React, { useState, useEffect } from "react";
import { __ } from "wpi18n";
import { useSelector } from "react-redux";
import { Card, Flex } from "molecules";
import { BoxIcon, ColorPaletteIcon } from "icons";
import { CLASS_PREFIX } from "conf";
import HeaderActionsCard from "../../../../components/HeaderActionsCard";
import GroupOptionCard from "../../../../components/GroupOptionCard";
import { useNavigate } from "react-router";
import AddVariationPopup from "./AddVariationPopup";
import { dispatchToastMessage } from "../../../utils";
import { deleteAttributeByIdAPI } from "../../../../store/attributesSlice";

const VariationList = () => {
  const navigate = useNavigate();
  const [showPopup, setShowPopup] = useState(false);
  const [variationType, setVariationType] = useState(null);
  const [attributeListArr, setAttributeListArr] = useState([]);

  const attributeList = useSelector((state) => state.attributes?.data) || [];

  const handleDeleteVariation = (item) => {
    const initialList = [...attributeListArr];
    const updatedAttributeList = attributeListArr?.filter(
      (attribute) => attribute?.id !== item?.id
    );
    setAttributeListArr(updatedAttributeList);
    dispatchToastMessage("delete", {
      title: __("Attribute deleted", "kirki-ecommerce"),
      duration: 5000,
      undoAction: () => {
        setAttributeListArr(initialList);
      },
      onSuccess: async () => {
        await deleteAttributeByIdAPI(item.id);
      },
    });
  };
  const handleEditVariation = (item) => {
    if (item?.type === "color")
      navigate(`/settings/essential/color/${item?.id}`);
    else navigate(`/settings/essential/list/${item?.id}`);
  };

  useEffect(() => {
    if (attributeList && attributeList.length) {
      fetchAttributeList();
    }
  }, [attributeList?.length]);

  const fetchAttributeList = () => {
    const formattedAttributes = attributeList.map((item) => ({
      ...item,
      badge1: `${item.values?.length || 0} values`,
      icon: item.type === "color" ? <ColorPaletteIcon /> : <BoxIcon />,
    }));
    setAttributeListArr(formattedAttributes);
  };

  return (
    <Card type="large">
      <HeaderActionsCard
        header={__("Variation Library", "kirki-ecommerce")}
        subHeader={__(
          "Used to create tax rates for different product groups, like heavy items needing higher fees.",
          "kirki-ecommerce"
        )}
        dropDownButton
        buttonText={__("Add Variation", "kirki-ecommerce")}
        handleOptionSelect={(value) => {
          setVariationType(value);
          setShowPopup(true);
        }}
      />
      {!attributeListArr.length ? (
        <Card type="innerDark" style={{ padding: "36px 0" }}>
          <Flex direction="column" gap={8} style={{ alignItems: "center" }}>
            <BoxIcon />
            <span style={{ color: "#878593" }}>
              {__("Added variation library will appear here", "kirki-ecommerce")}
            </span>
          </Flex>
        </Card>
      ) : (
        <Flex direction="column" className={`${CLASS_PREFIX}-box-wrapper`}>
          <GroupOptionCard
            dataArr={attributeListArr}
            handleDeleteItem={handleDeleteVariation}
            handleEditItem={handleEditVariation}
          />
        </Flex>
      )}
      <AddVariationPopup
        isOpen={showPopup}
        variationType={variationType}
        onClose={() => setShowPopup(false)}
      />
    </Card>
  );
};

export default VariationList;
