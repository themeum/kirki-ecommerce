import { useGetListAPI } from "@/hooks";
import React from "react";
import { useSelector } from "react-redux";
import { getCollectionsAPI } from "../../../../store/collectionsSlice";
import Select from '@/molecules/select/select';
import { __ } from "@/wpi18n";
import { useState } from "react";
import { useEffect } from "react";

const CollectionFilter = ({ filterObject, onChange = () => {} }) => {
  const { data: collectionData } = useSelector((state) => state.collections);
  useGetListAPI({
    reducerName: "collections",
    limit: -1,
    apiCallBack: getCollectionsAPI,
  });
  const [collectionOptions, setCollectionOptions] = useState([]);

  useEffect(() => {
    const suggestionList = collectionData?.results.map((item) => ({
      value: item.id,
      title: item.title,
      ...item,
    }));
    setCollectionOptions(suggestionList);
  }, [collectionData]);

  return (
    <Select
      label={__("Collection", "kirki-ecommerce")}
      value={filterObject?.collection_id || "all"}
      optionsArray={[
        { value: "all", title: __("All", "kirki-ecommerce") },
        ...(collectionOptions || []),
      ]}
      onChange={(val) => onChange(val)}
    />
  );
};

export default CollectionFilter;
