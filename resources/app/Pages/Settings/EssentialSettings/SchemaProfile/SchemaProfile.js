import React, { useState, useEffect } from "react";
import { __ } from "@/wpi18n";
import { Card, Flex } from "@/molecules";
import { BoxOpenIcon } from "@/Icons";
import { CLASS_PREFIX } from "@/conf";
import HeaderActionsCard from "../../../../components/HeaderActionsCard";
import GroupOptionCard from "../../../../components/GroupOptionCard";
import AddSchemaPopup from "./AddSchemaPopup";
import useGetListAPI from "../../../../hooks/useGetListAPI";
import {
  deleteSchemaByIdAPI,
  getSchemaProfileListAPI,
} from "../../../../store/schemaSlice";
import { useSelector } from "react-redux";
import { dispatchToastMessage } from "../../../utils";

const SchemaProfile = () => {
  const [showPopup, setShowPopup] = useState(false);
  const [editedItem, setEditedItem] = useState(null);
  const [schemaProfileList, setSchemaProfileList] = useState([]);

  useGetListAPI({
    reducerName: "schema",
    apiCallBack: getSchemaProfileListAPI,
  });
  const schemaList = useSelector((state) => state.schema) || [];

  useEffect(() => {
    fetchSchemaList();
  }, [schemaList?.data]);

  const fetchSchemaList = () => {
    const updatedSchemaList = schemaList?.data?.map((schema) => {
      return {
        ...schema,
        badge1: `${Object.keys(schema?.schema)?.length} Schemas`,
      };
    });
    setSchemaProfileList(updatedSchemaList);
  };

  const handleDeleteSchema = (item) => {
    const initialList = [...schemaProfileList];
    const updatedSchemaList = schemaProfileList?.filter(
      (schema) => schema?.id !== item?.id
    );
    setSchemaProfileList(updatedSchemaList);
    dispatchToastMessage("delete", {
      title: __("Schema deleted", "kirki-ecommerce"),
      duration: 5000,
      undoAction: () => {
        setSchemaProfileList(initialList);
      },
      onSuccess: async () => {
        await deleteSchemaByIdAPI(item.id);
      },
    });
  };
  const handleEditSchema = (item) => {
    setEditedItem(item);
    setShowPopup(true);
  };

  const handleClosePopup = () => {
    setShowPopup(false);
    setEditedItem(null);
  };

  return (
    <Card type="large">
      <HeaderActionsCard
        header={__("Schema Profile", "kirki-ecommerce")}
        subHeader={__(
          "Used to create tax rates for different product groups, like heavy items needing higher fees.",
          "kirki-ecommerce"
        )}
        buttonText={__("Add Profile", "kirki-ecommerce")}
        onAdd={() => setShowPopup(true)}
      />
      {!schemaProfileList?.length ? (
        <Card type="innerDark" style={{ padding: "36px 0" }}>
          <Flex direction="column" gap={8} style={{ alignItems: "center" }}>
            <BoxOpenIcon />
            <span style={{ color: "#878593" }}>
              {__("Added schema profiles will appear here", "kirki-ecommerce")}
            </span>
          </Flex>
        </Card>
      ) : (
        <Flex direction="column" className={`${CLASS_PREFIX}-box-wrapper`}>
          <GroupOptionCard
            dataArr={schemaProfileList}
            handleDeleteItem={handleDeleteSchema}
            handleEditItem={handleEditSchema}
          />
        </Flex>
      )}
      {showPopup && (
        <AddSchemaPopup
          isOpen={showPopup}
          onClose={handleClosePopup}
          editedItem={editedItem}
          setEditedItem={setEditedItem}
        />
      )}
    </Card>
  );
};

export default SchemaProfile;
