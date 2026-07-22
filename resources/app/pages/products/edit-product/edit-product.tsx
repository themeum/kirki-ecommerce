import {
  useEffect,
  useState,
  type ComponentType,
  type Dispatch,
  type SetStateAction,
} from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigate, useParams } from 'react-router';

import RichTextField from '@/components/form/rich-text-field';
import TextField from '@/components/form/text-field';
import MediaGallery from '@/components/media-gallery';
import Button from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Form } from '@/components/ui/form';
import { CLASS_PREFIX, NEW_ITEM_ID } from '@/conf';
import {
  ProductFormProvider,
  useProductForm,
} from '@/contexts/product-form-context';
import type { ErrorResponse } from '@/libs/api';
import { getErrorsObject } from '@/libs/api';
import { applyServerErrors } from '@/libs/form-errors';
import Container from '@/components/ui/container';
import Flex from '@/components/ui/flex';
import PageHeading from '@/components/ui/page-heading';
import { Separator } from '@/components/ui/separator';
import {
  mapProductBasicsFromProduct,
  ProductBasicsFormSchema,
  productBasicsDefaultValues,
  type ProductBasicsFormValues,
} from '@/schemas/forms/product-basics-form';
import {
  useCreateProductMutation,
  useProductQuery,
  useUpdateProductMutation,
} from '@/services/product';
import { useDefaultSettingsQuery, useSettingsQuery } from '@/services/settings';
import { useShippingBoxesQuery } from '@/services/shipping';
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

const VariantsView = Variants as ComponentType<VariantsProps>;

const EditProductInner = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const isNew = id === NEW_ITEM_ID;
  const { product: productData, setProduct, updateProduct } = useProductForm();
  const [mediaItems, setMediaItems] = useState<MediaItem[]>([]);
  const [errors, setErrors] = useState<FormErrors>({});
  const [formSyncKey, setFormSyncKey] = useState(0);

  const basicsForm = useForm<ProductBasicsFormValues>({
    resolver: zodResolver(ProductBasicsFormSchema),
    defaultValues: productBasicsDefaultValues,
  });

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
      setFormSyncKey((prev) => prev + 1);
    }
  }, [productResponse]);

  useEffect(() => {
    if (!isNew || !productSettings || !shippingBoxes) {
      return;
    }
    const settings = productSettings as ProductSettingsData;
    updateProduct({
      key: 'weight_unit',
      value: settings.weight_unit,
      variants: true,
    });
    updateProduct({
      key: 'show_unit_price',
      value: settings.is_unit_price_visible,
      variants: true,
    });
    updateProduct({
      key: 'dimension_unit',
      value: settings.dimension_unit,
      variants: true,
    });
    const defaultBox = (
      shippingBoxes as (ShippingBox & { is_default?: boolean })[]
    ).find((item) => Boolean(item.is_default));
    updateProduct({
      key: 'shipping_box_id',
      value: defaultBox?.id,
      variants: true,
    });
    setFormSyncKey((prev) => prev + 1);
  }, [productSettings, shippingBoxes]);

  useEffect(() => {
    if (isNew && defaultSettings) {
      updateProduct({ key: 'currency', value: defaultSettings.base_currency });
      setFormSyncKey((prev) => prev + 1);
    }
  }, [defaultSettings]);

  useEffect(() => {
    basicsForm.reset(mapProductBasicsFromProduct(productData));
  }, [formSyncKey]);

  useEffect(() => {
    const subscription = basicsForm.watch((values, info) => {
      if (info.type !== 'change' || !info.name) {
        return;
      }

      const fieldName = info.name as keyof ProductBasicsFormValues;
      updateProduct({ key: fieldName, value: values[fieldName] });
      basicsForm.clearErrors(fieldName);
      setErrors((prev) => ({
        ...prev,
        [fieldName]: null,
      }));
    });

    return () => subscription.unsubscribe();
  }, [basicsForm, updateProduct]);

  useEffect(() => {
    const hasErrors = Object.values(errors).some(Boolean);
    if (!hasErrors) {
      return;
    }
    applyServerErrors(basicsForm, { errors } as ErrorResponse);
  }, [errors]);

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
      setErrors({});
      setFormSyncKey((prev) => prev + 1);
      return { success: true };
    } catch (error) {
      const errorResponse = error as ErrorResponse;
      setErrors(getErrorsObject(errorResponse.errors));
      applyServerErrors(basicsForm, errorResponse);
      return { success: false };
    }
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
              variant="ghost"
              size="sm"
              onClick={() => window.history.back()}
            >
              {__('Cancel', 'kirki-ecommerce')}
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={handleAddOrCreateProduct}
            >
              {isNew
                ? __('Create', 'kirki-ecommerce')
                : __('Save', 'kirki-ecommerce')}
            </Button>
          </>
        }
      />
      <Container>
        <div style={{ display: 'flex', gap: 16, width: '100%' }}>
          <div style={{ width: '70%' }}>
            <Flex direction="column" gap={16}>
              <Form {...basicsForm}>
                <Card className={`${CLASS_PREFIX}-card ${CLASS_PREFIX}-card-form`}>
                  <CardContent>
                    <Flex gap={12}>
                      <div style={{ width: '70%' }}>
                        <TextField
                          name="title"
                          label={__('Title', 'kirki-ecommerce')}
                          placeholder={__(
                            'e.g. Yellow T-Shirt',
                            'kirki-ecommerce',
                          )}
                        />
                      </div>
                      <div style={{ width: '30%' }}>
                        <TextField
                          name="ribbon"
                          label={__('Ribbon', 'kirki-ecommerce')}
                          placeholder={__(
                            'e.g. Fresh Arrival',
                            'kirki-ecommerce',
                          )}
                          description={__('Ribbon', 'kirki-ecommerce')}
                        />
                      </div>
                    </Flex>
                    <TextField
                      name="slug"
                      label={__('Slug', 'kirki-ecommerce')}
                      placeholder={__('yellow-t-shirt', 'kirki-ecommerce')}
                    />

                    <MediaGallery
                      label={__('Images and videos', 'kirki-ecommerce')}
                      mediaItems={mediaItems}
                      onUpdate={(v) => setMediaItems(v)}
                      error={errors?.media as string | boolean | undefined}
                    />
                    <RichTextField
                      name="description"
                      label={__('Description', 'kirki-ecommerce')}
                      placeholder={__(
                        'Write product description here...',
                        'kirki-ecommerce',
                      )}
                    />
                    <Separator marginTop="8px" />
                    <AdditionalInfo />
                  </CardContent>
                </Card>
              </Form>
              {(isNew ||
                productData?.variants[0].attribute_values.length === 0) && (
                <>
                  <Price
                    errors={errors}
                    setErrors={setErrors}
                    formSyncKey={formSyncKey}
                  />
                  <Inventory
                    errors={errors}
                    setErrors={setErrors}
                    formSyncKey={formSyncKey}
                  />
                  <Shipping
                    errors={errors}
                    setErrors={setErrors}
                    formSyncKey={formSyncKey}
                  />
                </>
              )}
              <VariantsView
                errors={errors}
                setErrors={setErrors}
                onSave={handleAddOrCreateProduct}
              />
              <SEOSettings />
            </Flex>
          </div>
          <RightPanel />
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
