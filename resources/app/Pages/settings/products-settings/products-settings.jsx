import { ProductSettingsIcon } from "@/icons";
import Button from '@/molecules/button';
import Container from '@/molecules/container';
import Flex from '@/molecules/flex';
import PageHeading from '@/molecules/page-heading';
import React, { useEffect, useState } from "react";
import { __ } from "@/wpi18n";
import { useDispatch, useSelector } from "react-redux";
import PageNavbar from '@/components/page-navbar';
import {
  getSettingsAPI,
  updateSettings,
  updateSettingsAPI,
} from "../../../store/settingsSlice";
import { getErrorsObject } from "../../../store/utils";
import { getPagesAPI } from "../../../store/pageSlice";
import { useNavigate, useOutletContext } from "react-router";
import { ShopPage } from './shop-page';
import { StandardUnit } from './standard-unit';
import { Review } from './review';
import { checkUnsavedDataStatus, setUnsavedDataStatus } from "../utils";
import { dispatchToastMessage } from "../../utils";

const ProductsSettings = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [dataObj, setDataObj] = useState({
    weight_unit: "kg",
    dimension_unit: "m",
  });
  const [initialData, setInitialData] = useState({
    weight_unit: "kg",
    dimension_unit: "m",
  });
  const [errors, setErrors] = useState({});
  const { confirmAction } = useOutletContext();

  const hasUnsavedData = useSelector((state) => state.unsaved?.hasUnsavedData);
  const { loaded, data: productSettingsData } = useSelector(
    (state) => state.settings?.product,
  );

  useEffect(() => {
    dispatch(getPagesAPI());
    dispatch(getSettingsAPI("product"));
  }, []);

  useEffect(() => {
    if (Object.keys(productSettingsData || {}).length) {
      setDataObj(productSettingsData);
      setInitialData(productSettingsData);
    }
  }, [productSettingsData]);

  const handleOnChange = (value, key) => {
    const barcode_generation = [
      "data_origin",
      "format",
      "width",
      "height",
      "country_of_origin",
      "is_human_readable_text_visible",
      "is_product_name_visible",
      "is_country_of_origin_visible",
    ];

    setUnsavedDataStatus(true);
    setDataObj((prev) => {
      if (barcode_generation.includes(key)) {
        return {
          ...prev,
          barcode_generation: {
            ...prev.barcode_generation,
            [key]: value,
          },
        };
      }
      return {
        ...prev,
        [key]: value,
      };
    });
    setErrors((prev) => ({
      ...prev,
      ["data." + key]: null,
    }));
  };

  const handleSaveData = async () => {
    let result = {};
    result = await updateSettingsAPI("product", dataObj);
    if (result.success) {
      dispatch(updateSettings({ key: "product", value: result.data }));
      dispatchToastMessage("success", {
        title: __("Product settings updated", "kirki-ecommerce"),
      });
      setUnsavedDataStatus(false);
    } else {
      setErrors(getErrorsObject(result.errors));
    }
  };

  const handleBackButton = () => {
    checkUnsavedDataStatus({
      initialDataObj: initialData,
      updatedDataObj: dataObj,
      onUnsaved: () =>
        confirmAction({
          action: () => navigate(`/settings`),
        }),
      onClean: () => {
        navigate(`/settings`);
      },
    });
  };

  const handleDiscardData = () => {
    setDataObj(initialData);
  };

  return (
    <>
      <PageHeading
        text={__("Settings", "kirki-ecommerce")}
        size="sm"
        sticky
        type="primary"
        style={{ height: "32px" }}
        actions={
          hasUnsavedData ? (
            <>
              <Button
                type="ghost"
                text={__("Cancel", "kirki-ecommerce")}
                size="small"
                onClick={handleDiscardData}
              />
              <Button
                type="primary"
                text={__("Save", "kirki-ecommerce")}
                onClick={handleSaveData}
                size="small"
              />
            </>
          ) : (
            <></>
          )
        }
      />
      <Container size="sm">
        {loaded ? (
          <Flex direction="column" gap={16}>
            <PageNavbar
              textIcon={<ProductSettingsIcon />}
              text={__("Products", "kirki-ecommerce")}
              handleBack={handleBackButton}
            />
            <ShopPage
              dataObj={dataObj}
              handleOnChange={handleOnChange}
              errors={errors}
            />

            <StandardUnit
              dataObj={dataObj}
              handleOnChange={handleOnChange}
              errors={errors}
            />

            {/* TODO: enable when feature is finalized */}
            {/* <Card type="large">
              <Text
                header={__("Variant configuration", "kirki-ecommerce")}
                subHeader={__(
                  "Manage and customize product variant settings to suit your needs.",
                  "kirki-ecommerce"
                )}
                type="primary"
                style={{ gap: "12px" }}
              />

              <Card type="inner" style={{ padding: "16px" }}>
                <Select
                  label={__("Display layout", "kirki-ecommerce")}
                  value={dataObj?.["display_layout"]}
                  onChange={(value) => handleOnChange(value, "display_layout")}
                  helpText={__("Display layout", "kirki-ecommerce")}
                  optionsArray={[{ title: "List view", value: "list" }]}
                  defaultValue="list"
                  error={errors["data.display_layout"]}
                />
              </Card>
            </Card> */}

            <Review
              dataObj={dataObj}
              handleOnChange={handleOnChange}
              errors={errors}
            />
          </Flex>
        ) : (
          <div>{__("Loading ...", "kirki-ecommerce")}</div>
        )}
      </Container>
    </>
  );
};

export default ProductsSettings;
