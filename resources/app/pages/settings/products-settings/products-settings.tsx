import { useEffect, useState } from 'react';
import { useNavigate, useOutletContext } from 'react-router';

import PageNavbar from '@/components/page-navbar';
import { ProductSettingsIcon } from '@/icons';
import Button from '@/molecules/button';
import Container from '@/molecules/container';
import Flex from '@/molecules/flex';
import PageHeading from '@/molecules/page-heading';
import { getErrorsObject } from '@/libs/api';
import { useUnsavedStatus } from '@/libs/unsaved-store';
import { useSettingsQuery, useUpdateSettingsMutation } from '@/services/settings';
import type {
  BarcodeGenerationSettings,
  FormErrors,
  SettingsSectionData,
} from '@/types';
import { __ } from '@/wpi18n';

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

  const hasUnsavedData = useUnsavedStatus();
  const { data: productSettingsData, isLoading } = useSettingsQuery('product');
  const { mutate: saveSettings } = useUpdateSettingsMutation();

  const loaded = !isLoading && Boolean(productSettingsData);

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

  const handleSaveData = () => {
    saveSettings(
      { key: 'product', data: dataObj },
      {
        onSuccess: () => setUnsavedDataStatus(false),
        onError: (error) => {
          const errObj = error as { errors?: Record<string, string[]> };
          setErrors(getErrorsObject(errObj.errors));
        },
      },
    );
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
    setUnsavedDataStatus(false);
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

ProductsSettings.displayName = 'ProductsSettings';

export default ProductsSettings;
