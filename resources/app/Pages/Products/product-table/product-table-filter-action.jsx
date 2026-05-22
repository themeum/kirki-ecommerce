import Button from '@/molecules/button';
import Capsule from '@/molecules/capsule';
import Flex from '@/molecules/flex';
import React from "react";
import { useDispatch, useSelector } from "react-redux";
import { setKeyValue } from "../../../store/productsSlice";
import { CLASS_PREFIX } from "@/conf";
import { __ } from "@/wpi18n";
import { makeSuggestionList } from "../../utils";
import { useState } from "react";
import { useEffect } from "react";

const statusOptions = [
  { value: "published", title: __("Published", "kirki-ecommerce") },
  { value: "draft", title: __("Draft", "kirki-ecommerce") },
];

const inventoryOptions = [
  { value: "in_stock", title: __("In stock", "kirki-ecommerce") },
  { value: "out_of_stock", title: __("Out of stock", "kirki-ecommerce") },
];

const ProductTableFilterAction = () => {
  const dispatch = useDispatch();
  const { filter: filterData } = useSelector((state) => state.products);
  const { results: brandData } = useSelector((state) => state.brands?.data);
  const { results: categoriesData } = useSelector(
    (state) => state.categories?.data,
  );
  const { results: collectionData } = useSelector(
    (state) => state.collections?.data,
  );
  const [filterObject, setFilterObject] = useState({});

  const brandOptions = makeSuggestionList(brandData, []);
  const categoryOptions = makeSuggestionList(categoriesData, []);
  const collectionOptions = makeSuggestionList(collectionData, []);

  const filterOptionsMap = {
    category_ids: categoryOptions,
    status: statusOptions,
    inventory_type: inventoryOptions,
    collection_id: collectionOptions,
    brand_id: brandOptions,
  };

  useEffect(() => {
    const { category_ids, status } = filterData;
    let formattedFilter = { ...filterData };
    if (status) {
      if (filterData.status === "") {
        formattedFilter = { ...formattedFilter, status: "all" };
      }
    }
    if (category_ids) {
      const idArray = category_ids?.split(",").map(Number);
      formattedFilter = { ...formattedFilter, category_ids: idArray };
    }
    setFilterObject(formattedFilter);
  }, [filterData]);

  const handleFilterChange = (val, filterName) => {
    const newFilter = { ...filterObject, [filterName]: val };
    setFilterObject(newFilter);
    handleOnApplyFilter(newFilter);
  };

  const handleOnApplyFilter = (filter) => {
    let formattedData = { ...filter };
    if (filter?.category_ids) {
      if (filter?.category_ids.length > 0)
        formattedData.category_ids = filter.category_ids.join(",");
    }
    if (filter?.status === "all") {
      delete formattedData.status;
      // formattedData.status = "";
    }
    dispatch(setKeyValue({ key: "filter", value: formattedData }));
  };

  const handleClearSingleFilter = (filterName) => {
    const newFilter = { ...filterObject };
    delete newFilter[filterName];
    setFilterObject(newFilter);
    handleOnApplyFilter(newFilter);
  };

  const handleClearAll = () => {
    dispatch(setKeyValue({ key: "filter", value: {} }));
  };

  return (
    <Flex gap={12} className={`${CLASS_PREFIX}-filter-action-bar`}>
      {Object.keys(filterData).map((item, index) => (
        <Capsule
          uniqueKey={item}
          optionsArray={filterOptionsMap[item]}
          value={filterObject[item]}
          onValueChange={(val) => handleFilterChange(val, item)}
          onClearItem={() => handleClearSingleFilter(item)}
          multiple={item === "category_ids"}
        />
      ))}
      <Button
        text={__("Clear All", "kirki-ecommerce")}
        onClick={handleClearAll}
        type="link"
        size="small"
      />
    </Flex>
  );
};

export default ProductTableFilterAction;
