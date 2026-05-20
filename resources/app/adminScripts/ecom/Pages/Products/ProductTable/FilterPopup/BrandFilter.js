import { useGetListAPI } from "hooks";
import { Select } from "molecules";
import React from "react";
import { useEffect } from "react";
import { useState } from "react";
import { useSelector } from "react-redux";
import { __ } from "wpi18n";
import { getBrandsAPI } from "../../../../store/brandsSlice";

const BrandFilter = ({ filterObject, onChange = () => {} }) => {
  const { data: brandData } = useSelector((state) => state.brands);
  useGetListAPI({
    reducerName: "brands",
    page: 1,
    search: "",
    sort_by: "id",
    sort_order: "asc",
    limit: -1,
    apiCallBack: getBrandsAPI,
  });
  const [brandOptions, setBrandOptions] = useState([]);

  useEffect(() => {
    const suggestionList = brandData?.results.map((item) => ({
      value: item.id,
      title: item.name,
      ...item,
    }));
    setBrandOptions(suggestionList);
  }, [brandData]);
  return (
    <Select
      label={__("Brand", "kirki-ecommerce")}
      value={filterObject?.brand_id || "none"}
      optionsArray={brandOptions}
      onChange={(val) => onChange(val)}
    />
  );
};

export default BrandFilter;
