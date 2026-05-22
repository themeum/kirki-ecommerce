import ActionGroup from '@/molecules/action-group';
import Button from '@/molecules/button';
import Card from '@/molecules/card';
import Flex from '@/molecules/flex';
import Label from '@/molecules/label';
import Searchbox from '@/molecules/searchbox';
import Text from '@/molecules/text';
import Thumbnail from '@/molecules/thumbnail';
import React from "react";
import { useDispatch, useSelector } from "react-redux";
import { getBrandsAPI, setKeyValue } from "../../../../store/brandsSlice";
import { useGetListAPI } from "@/hooks";
import { __ } from "@/wpi18n";
import { useEffect } from "react";
import { useState } from "react";
import { MinusIcon } from "@/icons";
import { updateProduct } from "../../../../store/productSlice";
import BrandAddEditPopover from "../../../brands/brand-add-edit-popover";

const Brand = () => {
  const dispatch = useDispatch();
  const { data: productData } = useSelector((state) => state.product);
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
  const [suggestionArray, setSuggestionArray] = useState([]);
  const [openBrandCreatePopup, setOpenBrandCreatePopup] = useState(false);
  const [brandTitle, setBrandTitle] = useState("");

  useEffect(() => {
    const suggestionList = brandData?.results.map((item) => ({
      value: item.id,
      title: item.name,
      ...item,
    }));
    setSuggestionArray(suggestionList);
  }, [productData.brand, brandData]);

  const handleSearchChange = (searchText) => {
    dispatch(setKeyValue({ key: "search", value: searchText }));
  };

  const handleRemoveBrand = () => {
    dispatch(updateProduct({ key: "brand", value: null }));
  };
  const handleAddBrand = (brand) => {
    dispatch(updateProduct({ key: "brand", value: brand }));
  };
  const handleAddNewBrand = (searchText) => {
    setBrandTitle(searchText);
    setOpenBrandCreatePopup(true);
  };
  return (
    <>
      {productData?.brand?.id ? (
        <Flex direction="column" gap={8}>
          <Label text={__("Brand", "kirki-ecommerce")} helpText={__("Brand", "kirki-ecommerce")} />
          <Card type="inner">
            <Flex gap={8} style={{ alignItems: "center" }}>
              <Thumbnail src={productData?.brand?.logo?.url} />
              <Text type="xsm" header={productData?.brand?.name} />
              <ActionGroup style={{ cursor: "pointer" }}>
                <Button
                  type="ghost"
                  size="small"
                  icon={<MinusIcon />}
                  onClick={handleRemoveBrand}
                />
              </ActionGroup>
            </Flex>
          </Card>
        </Flex>
      ) : (
        <Searchbox
          value={brandTitle}
          label={__("Brand", "kirki-ecommerce")}
          helpText={__("Brand", "kirki-ecommerce")}
          placeholder={__("Search or Add Brand", "kirki-ecommerce")}
          suggestionArray={suggestionArray || []}
          onChange={(searchText) => handleSearchChange(searchText)}
          onEnter={(value) => handleAddNewBrand(value)}
          onOptionClick={(brand) => handleAddBrand(brand)}
        />
      )}
      {openBrandCreatePopup && (
        <BrandAddEditPopover
          brand={{ name: brandTitle }}
          onClose={() => setOpenBrandCreatePopup(false)}
        />
      )}
    </>
  );
};

export default Brand;
