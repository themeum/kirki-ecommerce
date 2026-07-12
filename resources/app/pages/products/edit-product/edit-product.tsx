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
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import {
  addProductAPI,
  getProductByIdAPI,
  setProduct,
  updateProduct,
  updateProductAPI,
} from '@/store/productSlice';
import {
  getSettingsAPI,
  getShippingBoxListAPI,
  getShippingProfileList,
  getTaxProfileListAPI,
} from '@/store/settingsSlice';
import { getErrorsObject } from '@/store/utils';
import type {
  ApiCallResult,
  FormErrors,
  MediaRef,
  Product,
  ProductFormData,
  SettingsSectionData,
  ShippingBox,
} from '@/types';
import { isApiSuccess } from '@/types/pages/api-guards';
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

type ShippingBoxListResponse = {
  data?: {
    results?: Array<ShippingBox & { is_default?: boolean }>;
  };
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

const EditProduct = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const [mediaItems, setMediaItems] = useState<MediaItem[]>([]);
  const { id } = useParams();
  const [errors, setErrors] = useState<FormErrors>({});
  const { loaded: defaultDataLoaded, data: defaultData } = useAppSelector(
    (state) => state.settings?.default,
  );

  const { data: productData } = useAppSelector((state) => state.product);
  const [, setHasVariation] = useState(false);

  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const [, , productSettings, shippingBox] = await Promise.all([
          dispatch(getShippingProfileList({ limit: -1 })),
          dispatch(getTaxProfileListAPI({ limit: -1 })),
          dispatch(getSettingsAPI('product')),
          dispatch(getShippingBoxListAPI({ limit: -1 })),
        ]);
        if (isNew()) {
          const settingsData = productSettings as ProductSettingsData;
          dispatch(
            updateProduct({
              key: 'weight_unit',
              value: settingsData?.weight_unit,
              variants: true,
            }),
          );
          dispatch(
            updateProduct({
              key: 'show_unit_price',
              value: settingsData?.is_unit_price_visible,
              variants: true,
            }),
          );
          const boxResponse = shippingBox as ShippingBoxListResponse;
          const boxData = boxResponse?.data?.results?.find((item) =>
            Boolean(item?.is_default),
          );
          dispatch(
            updateProduct({
              key: 'dimension_unit',
              value: settingsData?.dimension_unit,
              variants: true,
            }),
          );
          dispatch(
            updateProduct({
              key: 'shipping_box_id',
              value: boxData?.id,
              variants: true,
            }),
          );
        }
      } catch (error) {
        console.error('Initial load failed:', error);
      }
    };
    fetchInitialData();

    if (!isNew()) {
      getProductByIdAPI(id as string).then((rawResult) => {
        const result = rawResult as ApiCallResult<Product>;
        if (isApiSuccess(result)) {
          console.log(result.data);
          dispatch(setProduct(result.data));
          setMediaItems(result.data?.media as MediaItem[]);
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
          key: 'currency',
          value: defaultData?.base_currency,
        }),
      );
    }
  }, [defaultData]);

  const handleMediaUpdate = (media: MediaItem[]) => {
    setMediaItems(media);
  };

  const handleAddOrCreateProduct = async () => {
    let result = {} as ApiCallResult<Product>;
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

    if (productData.id) {
      console.log(formattedData, 'final data');
      result = (await updateProductAPI(
        productData.id,
        formattedData,
      )) as ApiCallResult<Product>;
    } else {
      console.log(formattedData, 'final data');
      result = (await addProductAPI(formattedData)) as ApiCallResult<Product>;
    }

    if (isApiSuccess(result)) {
      if (isNew()) {
        navigate('/products/' + result.data.id);
      }
      if (productData.id) {
        dispatch(setProduct(result.data));
        setMediaItems(result.data?.media as MediaItem[]);
      } else {
        setMediaItems(result.data?.media as MediaItem[]);
        dispatch(setProduct(result.data));
      }
    } else {
      console.log(result, 'error');
      const errorPayload = result as { errors?: Record<string, string[]> };
      setErrors(getErrorsObject(errorPayload.errors));
    }
    return result;
  };

  const handleOnChange = (value: unknown, fieldName: string) => {
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
          isNew()
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
                isNew()
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
                  onUpdate={(v) => handleMediaUpdate(v)}
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
              {(isNew() ||
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

EditProduct.displayName = 'EditProduct';

export default EditProduct;
