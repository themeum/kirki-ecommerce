import React, { useState, useEffect } from "react";
import {
  Button,
  Card,
  Container,
  Input,
  PageHeading,
  Separator,
  RichText,
  Flex,
} from "molecules";
import { MediaGallery } from "components";
import SEOSettings from "./SEOSettings";
import { useDispatch, useSelector } from "react-redux";
import Variants from "./Variants";
import { __ } from "wpi18n";
import {
  addProductAPI,
  getProductByIdAPI,
  setProduct,
  updateProduct,
  updateProductAPI,
} from "../../../store/productSlice";
import { useNavigate, useParams } from "react-router";
import { NEW_ITEM_ID } from "conf";
import Inventory from "./Inventory";
import Shipping from "./Shipping";
import AdditionalInfo from "./AdditionalInfo";
import Price from "./Price";
import RightPanel from "./RightPanel";
import { getErrorsObject } from "../../../store/utils";
import {
  getSettingsAPI,
  getShippingBoxListAPI,
  getShippingProfileList,
  getTaxProfileListAPI,
} from "../../../store/settingsSlice";

const EditProduct = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [mediaItems, setMediaItems] = useState([]);
  let { id } = useParams();
  const [errors, setErrors] = useState({});
  const { loaded: defaultDataLoaded, data: defaultData } = useSelector(
    (state) => state.settings?.default,
  );

  const { loaded, data: productData } = useSelector((state) => state.product);
  const [hasVariation, setHasVariation] = useState(false);

  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const [shippingProfile, taxProfile, productSettings, shippingBox] =
          await Promise.all([
            dispatch(getShippingProfileList({ limit: -1 })),
            dispatch(getTaxProfileListAPI({ limit: -1 })),
            dispatch(getSettingsAPI("product")),
            dispatch(getShippingBoxListAPI({ limit: -1 })),
          ]);
        if (isNew()) {
          dispatch(
            updateProduct({
              key: "weight_unit",
              value: productSettings?.weight_unit,
              variants: true,
            }),
          );
          dispatch(
            updateProduct({
              key: "show_unit_price",
              value: productSettings?.is_unit_price_visible,
              variants: true,
            }),
          );
          const boxData = shippingBox?.data?.results.find((item) =>
            Boolean(item?.is_default),
          );
          dispatch(
            updateProduct({
              key: "dimension_unit",
              value: productSettings?.dimension_unit,
              variants: true,
            }),
          );
          dispatch(
            updateProduct({
              key: "shipping_box_id",
              value: boxData?.id,
              variants: true,
            }),
          );
        }
      } catch (error) {
        console.error("Initial load failed:", error);
      }
    };
    fetchInitialData();

    if (!isNew()) {
      getProductByIdAPI(id).then((result) => {
        if (result.success) {
          console.log(result.data);
          dispatch(setProduct(result.data));
          setMediaItems(result.data?.media);
          setHasVariation(true);
        }
      });
    }
  }, []);

  useEffect(() => {
    if (isNew() && productData?.variants[0]?.attribute_values.length > 0) {
      setHasVariation(true);
    }
  }, [productData]);

  useEffect(() => {
    if (defaultDataLoaded && isNew()) {
      dispatch(
        updateProduct({
          key: "currency",
          value: defaultData?.base_currency,
        }),
      );
    }
  }, [defaultData]);

  const handleMediaUpdate = (media) => {
    setMediaItems(media);
  };
  const handleAddOrCreateProduct = async () => {
    let result = {};
    let formattedData = { ...productData };
    const attributes = productData.attributes.map((item) => ({
      id: item.id,
      values: item.values.map((val) => Number(val.id)),
    }));
    const currency_id = productData?.currency?.id;
    const media = mediaItems.map((item) => Number(item.id));
    const brand_id = productData?.brand?.id;
    const categories = productData.categories?.map((item) => item.id);
    const tags = productData.tags.map((item) => item.id);
    const collections = productData.collections.map((item) => item.id);
    const variants = productData.variants.map((item) => ({
      ...item,
      media: Number(item.media?.id) || null,
    }));
    formattedData = {
      ...formattedData,
      attributes,
      media,
      brand_id,
      categories,
      tags,
      collections,
      variants,
      currency_id,
    };

    delete formattedData.brand;
    delete formattedData.currency;
    if (productData.id) {
      console.log(formattedData, "final data");
      result = await updateProductAPI(productData.id, formattedData);
    } else {
      console.log(formattedData, "final data");
      result = await addProductAPI(formattedData);
      // console.log(result, "product created");
    }

    if (result.success) {
      if (isNew()) {
        navigate("/products/" + result.data.id);
      }
      if (productData.id) {
        dispatch(setProduct(result.data));
        setMediaItems(result.data?.media);
      } else {
        setMediaItems(result.data?.media);
        dispatch(setProduct(result.data));
      }
    } else {
      console.log(result, "error");
      setErrors(getErrorsObject(result.errors));
    }
    return result;
  };

  const handleOnChange = (value, fieldName) => {
    dispatch(updateProduct({ key: fieldName, value: value }));
    setErrors((prev) => ({
      ...prev,
      [fieldName]: null,
    }));
  };

  const isNew = () => {
    return id === NEW_ITEM_ID;
  };
  return (
    <>
      <PageHeading
        text={
          isNew() ? __("New Product", "kirki-ecommerce") : __("Edit Product", "kirki-ecommerce")
        }
        hasBack
        sticky
        actions={
          <>
            <Button
              text={__("Cancel", "kirki-ecommerce")}
              type="ghost"
              size="small"
              onClick={() => window.history.back()}
            />
            <Button
              text={isNew() ? __("Create", "kirki-ecommerce") : __("Save", "kirki-ecommerce")}
              type="primary"
              onClick={handleAddOrCreateProduct}
              size="small"
            />
          </>
        }
      />
      <Container>
        <div style={{ display: "flex", gap: 16, width: "100%" }}>
          <div style={{ width: "70%" }}>
            <Flex direction="column" gap={16}>
              <Card type="form">
                <Flex gap={12}>
                  <div style={{ width: "70%" }}>
                    <Input
                      label={__("Title", "kirki-ecommerce")}
                      placeholder={__("e.g. Yellow T-Shirt", "kirki-ecommerce")}
                      type="text"
                      value={productData?.title || ""}
                      onChange={(value) => handleOnChange(value, "title")}
                      error={errors?.title}
                    />
                  </div>
                  <div style={{ width: "30%" }}>
                    <Input
                      value={productData?.ribbon || ""}
                      label={__("Ribbon", "kirki-ecommerce")}
                      placeholder={__("e.g. Fresh Arrival", "kirki-ecommerce")}
                      helpText={__("Ribbon", "kirki-ecommerce")}
                      type="text"
                      onChange={(value) => handleOnChange(value, "ribbon")}
                      onBlur={(value) => console.log(value)}
                      error={errors?.ribbon}
                    />
                  </div>
                </Flex>
                <Input
                  value={productData?.slug || ""}
                  label={__("Slug", "kirki-ecommerce")}
                  placeholder={__("yellow-t-shirt", "kirki-ecommerce")}
                  type="text"
                  onChange={(value) => handleOnChange(value, "slug")}
                  onBlur={(value) => console.log(value)}
                  error={errors?.slug}
                />

                <MediaGallery
                  label={__("Images and videos", "kirki-ecommerce")}
                  mediaItems={mediaItems}
                  onUpdate={(v) => handleMediaUpdate(v)}
                  error={errors?.media}
                />
                <RichText
                  value={productData?.description || ""}
                  label={__("Description", "kirki-ecommerce")}
                  placeholder={__("Write product description here...", "kirki-ecommerce")}
                  onChange={(value) => handleOnChange(value, "description")}
                  error={errors?.description}
                />
                <Separator marginTop="8px" />
                <AdditionalInfo />
              </Card>
              {(isNew() ||
                productData?.variants[0].attribute_values.length === 0) && (
                <>
                  <Price errors={errors} setErrors={setErrors} />
                  <Inventory errors={errors} setErrors={setErrors} />
                  <Shipping errors={errors} setErrors={setErrors} />
                </>
              )}
              <Variants
                errors={errors}
                setErrors={setErrors}
                onSave={handleAddOrCreateProduct}
              />
              <SEOSettings errors={errors} setErrors={setErrors} />
            </Flex>
          </div>
          <RightPanel
            handleOnChange={handleOnChange}
            errors={errors}
            setErrors={setErrors}
          />
        </div>
      </Container>
    </>
  );
};

export default EditProduct;
