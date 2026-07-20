import { useEffect, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

import SelectField from '@/components/form/select-field';
import { Card, CardContent } from '@/components/ui/card';
import { Form } from '@/components/ui/form';
import { CLASS_PREFIX } from '@/conf';
import { useProductForm } from '@/contexts/product-form-context';
import Flex from '@/molecules/flex';
import {
  ProductRightPanelFormSchema,
  productRightPanelDefaultValues,
  type ProductRightPanelFormValues,
} from '@/schemas/forms/product-right-panel-form';
import type { Product } from '@/types';
import { __ } from '@/wpi18n';

import Brand from '@/pages/products/edit-product/right-panel/brand';
import Categories from '@/pages/products/edit-product/right-panel/categories/categories';
import Collections from '@/pages/products/edit-product/right-panel/collections';
import Tags from '@/pages/products/edit-product/right-panel/tags';

const mapProductToRightPanelValues = (
  product: Product,
): ProductRightPanelFormValues => ({
  status: product.status ?? 'draft',
  brand: product.brand ?? null,
  categories: product.categories ?? [],
  tags: product.tags ?? [],
  collections: product.collections ?? [],
});

const RightPanel = () => {
  const { product, updateProduct, loaded } = useProductForm();
  const isSyncingRef = useRef(false);

  const form = useForm<ProductRightPanelFormValues>({
    resolver: zodResolver(ProductRightPanelFormSchema),
    defaultValues: productRightPanelDefaultValues,
  });

  useEffect(() => {
    if (!loaded && !product.id) {
      return;
    }

    isSyncingRef.current = true;
    form.reset(mapProductToRightPanelValues(product));
    queueMicrotask(() => {
      isSyncingRef.current = false;
    });
  }, [loaded, product.id, form]);

  useEffect(() => {
    const subscription = form.watch((values, info) => {
      if (isSyncingRef.current || !info.name) {
        return;
      }

      const rootKey = info.name.split(
        '.',
      )[0] as keyof ProductRightPanelFormValues;

      updateProduct({
        key: rootKey,
        value: values[rootKey] ?? null,
      });
    });

    return () => subscription.unsubscribe();
  }, [form, updateProduct]);

  const statusOptions = [
    { value: 'draft', label: __('Draft', 'kirki-ecommerce') },
    { value: 'published', label: __('Published', 'kirki-ecommerce') },
    { value: 'unpublished', label: __('Unpublished', 'kirki-ecommerce') },
    { value: 'archived', label: __('Archived', 'kirki-ecommerce') },
  ];

  return (
    <div style={{ width: '30%' }}>
      <Form {...form}>
        <Flex direction="column" gap={16}>
          <Card className={`${CLASS_PREFIX}-card ${CLASS_PREFIX}-card-form`}>
            <CardContent>
              <SelectField
                name="status"
                label={__('Status', 'kirki-ecommerce')}
                options={statusOptions}
              />
            </CardContent>
          </Card>
          <Categories />
          <Card className={`${CLASS_PREFIX}-card ${CLASS_PREFIX}-card-form`}>
            <CardContent>
              <Tags />
              <Collections />
              <Brand />
            </CardContent>
          </Card>
        </Flex>
      </Form>
    </div>
  );
};

RightPanel.displayName = 'RightPanel';

export default RightPanel;
