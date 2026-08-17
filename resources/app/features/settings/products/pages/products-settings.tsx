import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';

import Container from '@/components/ui/container';
import Flex from '@/components/ui/flex';
import { Form } from '@/components/ui/form';
import { useSettingsPageActions } from '@/features/settings/hooks/use-settings-page-actions';
import { setUnsavedDataStatus } from '@/features/settings/lib/utils';
import SettingsPageHeader from '@/features/settings/pages/settings-page-header';
import { Review } from '@/features/settings/products/pages/review';
import { StandardUnit } from '@/features/settings/products/pages/standard-unit';
import {
  type ProductsSettingsFormInput,
  type ProductsSettingsFormPayload,
  ProductsSettingsFormSchema,
} from '@/features/settings/products/schemas/forms/products-settings-form';
import ProductsSettingsSkeleton from '@/features/settings/products/skeletons/products-settings-skeleton';
import { ProductSettingsIcon } from '@/icons';
import type { ErrorResponse } from '@/libs/api';
import { applyServerErrors } from '@/libs/form-errors';
import { getDefaults, pickFormValues } from '@/libs/zod';
import { useSettingsQuery, useUpdateSettingsMutation } from '@/services/settings';
import { __ } from '@/wpi18n';

const ProductsSettings = () => {
  const { data: productSettingsData, isLoading } = useSettingsQuery('product');
  const { mutateAsync: saveSettings, isPending } = useUpdateSettingsMutation<'product'>();

  const loaded = !isLoading && Boolean(productSettingsData);

  const form = useForm<ProductsSettingsFormInput, unknown, ProductsSettingsFormPayload>({
    resolver: zodResolver(ProductsSettingsFormSchema),
    defaultValues: getDefaults(ProductsSettingsFormSchema),
  });

  useEffect(() => {
    if (!productSettingsData || !Object.keys(productSettingsData).length) {
      return;
    }

    form.reset(
      pickFormValues(ProductsSettingsFormSchema, productSettingsData, {
        shop_page:
          productSettingsData.shop_page === null || productSettingsData.shop_page === undefined
            ? null
            : String(productSettingsData.shop_page),
      }),
    );
  }, [productSettingsData, form]);

  useEffect(() => {
    setUnsavedDataStatus(form.formState.isDirty);
  }, [form.formState.isDirty]);

  const handleSaveData = async (payload: ProductsSettingsFormPayload) => {
    try {
      await saveSettings({
        key: 'product',
        data: payload,
      });
      form.reset(form.getValues());
    } catch (error) {
      applyServerErrors(form, error as ErrorResponse);
    }
  };

  const handleDiscardData = () => {
    form.reset();
  };

  useSettingsPageActions({
    isDirty: form.formState.isDirty,
    isSaving: isPending,
    onSave: form.handleSubmit(handleSaveData),
    onDiscard: handleDiscardData,
  });

  return (
    <Container size="sm">
      {loaded ? (
        <Form {...form}>
          <Flex direction="column" gap={4}>
            <SettingsPageHeader
              icon={<ProductSettingsIcon />}
              title={__('Products', 'kirki-ecommerce')}
            />
            <StandardUnit />
            <Review />
          </Flex>
        </Form>
      ) : (
        <ProductsSettingsSkeleton />
      )}
    </Container>
  );
};

ProductsSettings.displayName = 'ProductsSettings';

export default ProductsSettings;
