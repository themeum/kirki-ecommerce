import { useEffect, useState } from 'react';
import { useNavigate, useOutletContext } from 'react-router';

import PageNavbar from '@/components/page-navbar';
import { ProductSettingsIcon } from '@/icons';
import Button from '@/molecules/button';
import Container from '@/molecules/container';
import Flex from '@/molecules/flex';
import PageHeading from '@/molecules/page-heading';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { getPagesAPI } from '@/store/pageSlice';
import {
  getSettingsAPI,
  updateSettings,
  updateSettingsAPI,
} from '@/store/settingsSlice';
import { getErrorsObject } from '@/store/utils';
import type {
  BarcodeGenerationSettings,
  FormErrors,
  SettingsSectionData,
} from '@/types';
import { isApiSuccess } from '@/types/pages/api-guards';
import { __ } from '@/wpi18n';

import { dispatchToastMessage } from '@/pages/utils';
import { checkUnsavedDataStatus, setUnsavedDataStatus } from '@/pages/settings/utils';
import { Review } from '@/pages/settings/products-settings/review';
import { ShopPage } from '@/pages/settings/products-settings/shop-page';
import { StandardUnit } from '@/pages/settings/products-settings/standard-unit';

type SettingsOutletContext = {
  confirmAction: (params: { action?: () => void }) => void;
};

type ProductSettingsFormData = SettingsSectionData & {
  weight_unit?: string;
  dimension_unit?: string;
  shop_page?: string | number;
  is_unit_price_visible?: boolean;
  is_enabled_reviews?: boolean;
  is_enabled_star_ratings?: boolean;
  barcode_generation?: BarcodeGenerationSettings;
};

const ProductsSettings = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const [dataObj, setDataObj] = useState<ProductSettingsFormData>({
    weight_unit: 'kg',
    dimension_unit: 'm',
  });
  const [initialData, setInitialData] = useState<ProductSettingsFormData>({
    weight_unit: 'kg',
    dimension_unit: 'm',
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const { confirmAction } = useOutletContext<SettingsOutletContext>();

  const hasUnsavedData = useAppSelector((state) => state.unsaved?.hasUnsavedData);
  const { loaded, data: productSettingsData } = useAppSelector(
    (state) => state.settings?.product,
  );

  useEffect(() => {
    dispatch(getPagesAPI());
    dispatch(getSettingsAPI('product'));
  }, []);

  useEffect(() => {
    if (Object.keys(productSettingsData || {}).length) {
      setDataObj(productSettingsData as ProductSettingsFormData);
      setInitialData(productSettingsData as ProductSettingsFormData);
    }
  }, [productSettingsData]);

  const handleOnChange = (value: unknown, key: string) => {
    const barcode_generation = [
      'data_origin',
      'format',
      'width',
      'height',
      'country_of_origin',
      'is_human_readable_text_visible',
      'is_product_name_visible',
      'is_country_of_origin_visible',
    ];

    setUnsavedDataStatus(true);
    setDataObj((prev) => {
      if (barcode_generation.includes(key)) {
        return {
          ...prev,
          barcode_generation: {
            ...(prev.barcode_generation ?? {}),
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
      ['data.' + key]: null,
    }));
  };

  const handleSaveData = async () => {
    const result = await updateSettingsAPI('product', dataObj);
    if (isApiSuccess(result)) {
      dispatch(
        updateSettings({
          key: 'product',
          value: result.data as SettingsSectionData,
        }),
      );
      dispatchToastMessage('success', {
        title: __('Product settings updated', 'kirki-ecommerce'),
      });
      setUnsavedDataStatus(false);
    } else {
      const errorPayload = result as { errors?: Record<string, string[]> };
      setErrors(getErrorsObject(errorPayload.errors));
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
        text={__('Settings', 'kirki-ecommerce')}
        size="sm"
        sticky
        type="primary"
        style={{ height: '32px' }}
        actions={
          hasUnsavedData ? (
            <>
              <Button
                type="ghost"
                text={__('Cancel', 'kirki-ecommerce')}
                size="small"
                onClick={handleDiscardData}
              />
              <Button
                type="primary"
                text={__('Save', 'kirki-ecommerce')}
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
              text={__('Products', 'kirki-ecommerce')}
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
          <div>{__('Loading ...', 'kirki-ecommerce')}</div>
        )}
      </Container>
    </>
  );
};

export default ProductsSettings;
