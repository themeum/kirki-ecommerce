import { useEffect, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Flex from '@/components/ui/flex';
import { Form } from '@/components/ui/form';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useProductForm } from '@/contexts/product-form-context';
import { ProductSeoFormSchema, productSeoDefaultValues, type ProductSeoFormValues } from '@/schemas/forms/product-seo-form';
import type { Product } from '@/types';
import { cardStyles } from '@/theme/card-styles';
import { __ } from '@/wpi18n';

import AEO from '@/pages/products/edit-product/seo-settings/aeo';
import Schema from '@/pages/products/edit-product/seo-settings/schema';
import SearchEngines from '@/pages/products/edit-product/seo-settings/search-engines';
import SocialShare from '@/pages/products/edit-product/seo-settings/social-share';

const mapProductToSeoValues = (product: Product): ProductSeoFormValues => {
  return {
    seo_title: product.seo_title ?? '',
    seo_description: product.seo_description ?? '',
    llm_instructions: product.llm_instructions ?? '',
    og_title: product.og_title ?? '',
    og_description: product.og_description ?? '',
    og_image: null,
    schema_id: product.schema_id ?? null,
  };
};

const SEOSettings = () => {
  const { product, updateProduct, loaded } = useProductForm();
  const [activeTab, setActiveTab] = useState(0);
  const isSyncingRef = useRef(false);

  const form = useForm<ProductSeoFormValues>({
    resolver: zodResolver(ProductSeoFormSchema),
    defaultValues: productSeoDefaultValues,
  });

  useEffect(() => {
    if (!loaded && !product.id) {
      return;
    }

    isSyncingRef.current = true;
    form.reset(mapProductToSeoValues(product));
    if (product.og_image !== null) {
      updateProduct({ key: 'og_image', value: null });
    }
    queueMicrotask(() => {
      isSyncingRef.current = false;
    });
  }, [loaded, product.id, form, updateProduct]);

  useEffect(() => {
    const subscription = form.watch((values, info) => {
      if (isSyncingRef.current || !info.name) {
        return;
      }

      const fieldName = info.name as keyof ProductSeoFormValues;
      updateProduct({
        key: fieldName,
        value: values[fieldName] ?? null,
      });
    });

    return () => subscription.unsubscribe();
  }, [form, updateProduct]);

  return (
    <Card cssOverride={cardStyles.formCard}>
      <CardHeader>
        <CardTitle>{__('AI & Web Presence', 'kirki-ecommerce')}</CardTitle>
      </CardHeader>
      <CardContent>
        <Flex direction="column" gap={4}>
          <Tabs
            value={String(activeTab)}
            onValueChange={(value) => setActiveTab(Number(value))}
          >
            <TabsList>
              <TabsTrigger value="0">
                {__('Search Engines', 'kirki-ecommerce')}
              </TabsTrigger>
              <TabsTrigger value="1">{__('AEO', 'kirki-ecommerce')}</TabsTrigger>
              <TabsTrigger value="2">
                {__('Social Share', 'kirki-ecommerce')}
              </TabsTrigger>
              <TabsTrigger value="3">
                {__('Schema', 'kirki-ecommerce')}
              </TabsTrigger>
            </TabsList>
          </Tabs>

          <Form {...form}>
            {activeTab === 0 && <SearchEngines />}
            {activeTab === 1 && <AEO />}
            {activeTab === 2 && <SocialShare />}
            {activeTab === 3 && <Schema />}
          </Form>
        </Flex>
      </CardContent>
    </Card>
  );
};

SEOSettings.displayName = 'SEOSettings';

export default SEOSettings;

