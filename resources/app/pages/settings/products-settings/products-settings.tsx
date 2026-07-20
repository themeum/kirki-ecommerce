import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigate, useOutletContext } from 'react-router';

import PageNavbar from '@/components/page-navbar';
import { Form } from '@/components/ui/form';
import { ProductSettingsIcon } from '@/icons';
import type { ErrorResponse } from '@/libs/api';
import { applyServerErrors } from '@/libs/form-errors';
import { useUnsavedStatus } from '@/libs/unsaved-store';
import Button from '@/molecules/button';
import Container from '@/molecules/container';
import Flex from '@/molecules/flex';
import PageHeading from '@/molecules/page-heading';
import {
  ProductsSettingsFormSchema,
  productsSettingsDefaultValues,
  type ProductsSettingsFormValues,
} from '@/schemas/forms/products-settings-form';
import { useSettingsQuery, useUpdateSettingsMutation } from '@/services/settings';
import type { SettingsSectionData } from '@/types';
import { __ } from '@/wpi18n';

import { setUnsavedDataStatus } from '@/pages/settings/utils';
import { Review } from '@/pages/settings/products-settings/review';
import { ShopPage } from '@/pages/settings/products-settings/shop-page';
import { StandardUnit } from '@/pages/settings/products-settings/standard-unit';

type SettingsOutletContext = {
  confirmAction: (params: { action?: () => void }) => void;
};

const toSubmitPayload = (
  values: ProductsSettingsFormValues,
): SettingsSectionData => {
  const shopPage = values.shop_page;

  return {
    ...values,
    shop_page:
      shopPage === null || shopPage === undefined || shopPage === ''
        ? shopPage
        : Number(shopPage),
  } as SettingsSectionData;
};

const ProductsSettings = () => {
  const navigate = useNavigate();
  const { confirmAction } = useOutletContext<SettingsOutletContext>();

  const hasUnsavedData = useUnsavedStatus();
  const { data: productSettingsData, isLoading } = useSettingsQuery('product');
  const { mutateAsync: saveSettings, isPending } = useUpdateSettingsMutation();

  const loaded = !isLoading && Boolean(productSettingsData);

  const form = useForm<ProductsSettingsFormValues>({
    resolver: zodResolver(ProductsSettingsFormSchema),
    defaultValues: productsSettingsDefaultValues,
  });

  useEffect(() => {
    if (!productSettingsData || !Object.keys(productSettingsData).length) {
      return;
    }

    form.reset({
      ...productsSettingsDefaultValues,
      ...productSettingsData,
      shop_page:
        productSettingsData.shop_page === null ||
        productSettingsData.shop_page === undefined
          ? null
          : String(productSettingsData.shop_page),
    });
  }, [productSettingsData, form]);

  useEffect(() => {
    setUnsavedDataStatus(form.formState.isDirty);
  }, [form.formState.isDirty]);

  const handleSaveData = async (values: ProductsSettingsFormValues) => {
    try {
      await saveSettings({
        key: 'product',
        data: toSubmitPayload(values),
      });
      form.reset(values);
    } catch (error) {
      applyServerErrors(form, error as ErrorResponse);
    }
  };

  const handleBackButton = () => {
    if (form.formState.isDirty) {
      confirmAction({
        action: () => navigate('/settings'),
      });
      return;
    }
    navigate('/settings');
  };

  const handleDiscardData = () => {
    form.reset();
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
                onClick={form.handleSubmit(handleSaveData)}
                size="small"
                state={isPending ? 'loading' : undefined}
              />
            </>
          ) : (
            <></>
          )
        }
      />
      <Container size="sm">
        {loaded ? (
          <Form {...form}>
            <Flex direction="column" gap={16}>
              <PageNavbar
                textIcon={<ProductSettingsIcon />}
                text={__('Products', 'kirki-ecommerce')}
                handleBack={handleBackButton}
              />
              <ShopPage />
              <StandardUnit />
              <Review />
            </Flex>
          </Form>
        ) : (
          <div>{__('Loading ...', 'kirki-ecommerce')}</div>
        )}
      </Container>
    </>
  );
};

ProductsSettings.displayName = 'ProductsSettings';

export default ProductsSettings;
