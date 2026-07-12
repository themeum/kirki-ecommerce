import {
  useEffect,
  useState,
  type ComponentType,
  type Dispatch,
  type SetStateAction,
} from 'react';
import { useNavigate, useParams } from 'react-router';

import MediaGallery from '@/components/media-gallery';
import { NEW_ITEM_ID } from '@/conf';
import Button from '@/molecules/button';
import Card from '@/molecules/card';
import Container from '@/molecules/container';
import Flex from '@/molecules/flex';
import Input from '@/molecules/input';
import PageHeading from '@/molecules/page-heading';
import RichText from '@/molecules/rich-text';
import Separator from '@/molecules/separator';
import { ProductFormProvider, useProductForm } from '@/contexts/product-form-context';
import { useProductQuery, useCreateProductMutation, useUpdateProductMutation } from '@/services/product';
import { useDefaultSettingsQuery, useSettingsQuery } from '@/services/settings';
import { useShippingBoxesQuery } from '@/services/shipping';
import { getErrorsObject } from '@/libs/api';
import type {
  FormErrors,
  MediaRef,
  ProductFormData,
  SettingsSectionData,
  ShippingBox,
} from '@/types';
import { __ } from '@/wpi18n';

import AdditionalInfo from '@/pages/products/edit-product/additional-info/additional-info';
import Inventory from '@/pages/products/edit-product/inventory/inventory';
import Price from '@/pages/products/edit-product/price/price';
import RightPanel from '@/pages/products/edit-product/right-panel/right-panel';
import SEOSettings from '@/pages/products/edit-product/seo-settings/seo-settings';
import Shipping from '@/pages/products/edit-product/shipping/shipping';
import Variants from '@/pages/products/edit-product/variants/variants';

type MediaItem = Omit<MediaRef, 'id'> & {
  id?: string | number;
};

type ProductSettingsData = SettingsSectionData & {
  weight_unit?: string;
  is_unit_price_visible?: boolean;
  dimension_unit?: string;
};

type SaveResult = {
  success?: boolean;
};

type VariantsProps = {
  errors?: FormErrors;
  setErrors?: Dispatch<SetStateAction<FormErrors>>;
  onSave?: () => Promise<unknown>;
};

type RightPanelProps = {
  handleOnChange: (value: unknown, fieldName: string) => void;
  errors: FormErrors;
  setErrors: Dispatch<SetStateAction<FormErrors>>;
};

const VariantsView = Variants as ComponentType<VariantsProps>;
const RightPanelView = RightPanel as ComponentType<RightPanelProps>;

const EditProductInner = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const isNew = id === NEW_ITEM_ID;
  const { product: productData, setProduct, updateProduct } = useProductForm();
  const [mediaItems, setMediaItems] = useState<MediaItem[]>([]);
  const [errors, setErrors] = useState<FormErrors>({});

  const { data: productResponse } = useProductQuery(id as string, !isNew);
  const { data: defaultSettings } = useDefaultSettingsQuery();
  const { data: productSettings } = useSettingsQuery('product', {}, isNew);
  const { data: shippingBoxes } = useShippingBoxesQuery({ limit: -1 });

  const createProductMutation = useCreateProductMutation();
  const updateProductMutation = useUpdateProductMutation();

  useEffect(() => {
    if (productResponse) {
      setProduct(productResponse);
      setMediaItems(productResponse?.media as MediaItem[]);
    }
  }, [productResponse]);

  useEffect(() => {
    if (!isNew || !productSettings || !shippingBoxes) {
      return;
    }
    const settings = productSettings as ProductSettingsData;
    updateProduct({ key: 'weight_unit', value: settings.weight_unit, variants: true });
    updateProduct({ key: 'show_unit_price', value: settings.is_unit_price_visible, variants: true });
    updateProduct({ key: 'dimension_unit', value: settings.dimension_unit, variants: true });
    const defaultBox = (shippingBoxes as (ShippingBox & { is_default?: boolean })[]).find(
      (item) => Boolean(item.is_default),
    );
    updateProduct({ key: 'shipping_box_id', value: defaultBox?.id, variants: true });
  }, [productSettings, shippingBoxes]);

  useEffect(() => {
    if (isNew && defaultSettings) {
      updateProduct({ key: 'currency', value: defaultSettings.base_currency });
    }
  }, [defaultSettings]);

  const handleAddOrCreateProduct = async (): Promise<SaveResult> => {
    const attributes = productData.attributes.map((item) => ({
      id: item.id,
      values: (item.values ?? []).map((val) => Number(val.id)),
    }));
    const currency_id = productData.currency?.id ?? null;
    const media = mediaItems.map((item) => Number(item.id));
    const brand_id = productData.brand?.id ?? null;
    const categories = productData.categories.map((item) => item.id);
    const tags = productData.tags.map((item) => item.id);
    const collections = productData.collections.map((item) => item.id);
    const variants = productData.variants.map((item) => ({
      ...item,
      media: Number(item.media?.id) || null,
    }));
    const og_image =
      typeof productData.og_image === 'object' && productData.og_image !== null
        ? Number(productData.og_image.id)
        : productData.og_image;

    const formattedData: ProductFormData = {
      title: productData.title,
      slug: productData.slug,
      status: productData.status,
      ribbon: productData.ribbon,
      description: productData.description,
      additional_info: productData.additional_info,
      allow_back_order: productData.allow_back_order,
      seo_title: productData.seo_title,
      seo_description: productData.seo_description,
      seo_keywords: productData.seo_keywords,
      og_title: productData.og_title,
      og_description: productData.og_description,
      og_image,
      schema_id: productData.schema_id,
      llm_instructions: productData.llm_instructions,
      has_variants: productData.has_variants,
      attributes,
      media,
      brand_id,
      categories,
      tags,
      collections,
      variants,
      currency_id,
    };

    try {
      if (productData.id) {
        const response = await updateProductMutation.mutateAsync({
          id: productData.id,
          data: formattedData,
        });
        setProduct(response.data);
        setMediaItems(response.data?.media as MediaItem[]);
      } else {
        const response = await createProductMutation.mutateAsync(formattedData);
        setProduct(response.data);
        setMediaItems(response.data?.media as MediaItem[]);
        if (isNew) {
          navigate('/products/' + response.data.id);
        }
      }
      return { success: true };
    } catch (error) {
      setErrors(
        getErrorsObject((error as { errors?: Record<string, string[]> }).errors),
      );
      return { success: false };
    }
  };

  const handleOnChange = (value: unknown, fieldName: string) => {
    updateProduct({ key: fieldName, value: value });
    setErrors((prev) => ({
      ...prev,
      [fieldName]: null,
    }));
  };

  return (
    <>
      <PageHeading
        text={
          isNew
            ? __('New Product', 'kirki-ecommerce')
            : __('Edit Product', 'kirki-ecommerce')
        }
        hasBack
        sticky
        actions={
          <>
            <Button
              text={__('Cancel', 'kirki-ecommerce')}
              type="ghost"
              size="small"
              onClick={() => window.history.back()}
            />
            <Button
              text={
                isNew
                  ? __('Create', 'kirki-ecommerce')
                  : __('Save', 'kirki-ecommerce')
              }
              type="primary"
              onClick={handleAddOrCreateProduct}
              size="small"
            />
          </>
        }
      />
      <Container>
        <div style={{ display: 'flex', gap: 16, width: '100%' }}>
          <div style={{ width: '70%' }}>
            <Flex direction="column" gap={16}>
              <Card type="form">
                <Flex gap={12}>
                  <div style={{ width: '70%' }}>
                    <Input
                      label={__('Title', 'kirki-ecommerce')}
                      placeholder={__('e.g. Yellow T-Shirt', 'kirki-ecommerce')}
                      type="text"
                      value={productData?.title || ''}
                      onChange={(value) => handleOnChange(value, 'title')}
                      error={errors?.title as string | boolean | undefined}
                    />
                  </div>
                  <div style={{ width: '30%' }}>
                    <Input
                      value={productData?.ribbon || ''}
                      label={__('Ribbon', 'kirki-ecommerce')}
                      placeholder={__('e.g. Fresh Arrival', 'kirki-ecommerce')}
                      helpText={__('Ribbon', 'kirki-ecommerce')}
                      type="text"
                      onChange={(value) => handleOnChange(value, 'ribbon')}
                      onBlur={(value) => console.log(value)}
                      error={errors?.ribbon as string | boolean | undefined}
                    />
                  </div>
                </Flex>
                <Input
                  value={productData?.slug || ''}
                  label={__('Slug', 'kirki-ecommerce')}
                  placeholder={__('yellow-t-shirt', 'kirki-ecommerce')}
                  type="text"
                  onChange={(value) => handleOnChange(value, 'slug')}
                  onBlur={(value) => console.log(value)}
                  error={errors?.slug as string | boolean | undefined}
                />

                <MediaGallery
                  label={__('Images and videos', 'kirki-ecommerce')}
                  mediaItems={mediaItems}
                  onUpdate={(v) => setMediaItems(v)}
                  error={errors?.media as string | boolean | undefined}
                />
                <RichText
                  value={productData?.description || ''}
                  label={__('Description', 'kirki-ecommerce')}
                  placeholder={__(
                    'Write product description here...',
                    'kirki-ecommerce',
                  )}
                  onChange={(value) => handleOnChange(value, 'description')}
                  error={errors?.description as string | boolean | undefined}
                />
                <Separator marginTop="8px" />
                <AdditionalInfo />
              </Card>
              {(isNew ||
                productData?.variants[0].attribute_values.length === 0) && (
                <>
                  <Price errors={errors} setErrors={setErrors} />
                  <Inventory errors={errors} setErrors={setErrors} />
                  <Shipping errors={errors} setErrors={setErrors} />
                </>
              )}
              <VariantsView
                errors={errors}
                setErrors={setErrors}
                onSave={handleAddOrCreateProduct}
              />
              <SEOSettings errors={errors} setErrors={setErrors} />
            </Flex>
          </div>
          <RightPanelView
            handleOnChange={handleOnChange}
            errors={errors}
            setErrors={setErrors}
          />
        </div>
      </Container>
    </>
  );
};

EditProductInner.displayName = 'EditProductInner';

const EditProduct = () => {
  return (
    <ProductFormProvider>
      <EditProductInner />
    </ProductFormProvider>
  );
};

EditProduct.displayName = 'EditProduct';

export default EditProduct;
