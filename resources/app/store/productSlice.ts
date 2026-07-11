import { createSlice } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import axios from 'axios';

import { APP_PREFIX } from '@/conf';
import type {
  Attribute,
  AxiosErrorLike,
  ListQueryParams,
  Product,
  ProductFormData,
  ProductVariant,
  UnitPriceValue,
  UpdateProductPayload,
  UpdateVariantsPayload,
} from '@/types';
import { createVariantCombinations } from '../pages/products/utils';

import { commonActions, getOptions, postOptions, putOptions } from './utils';

type ProductState = {
  loaded: boolean;
  toggler: boolean | number;
  data: Product;
};

const defaultVariant: ProductVariant = {
  attribute_values: [],
  media: null,
  sku: null,
  barcode: null,
  price: null,
  show_unit_price: null,
  base_unit: null,
  base_unit_amount: null,
  total_unit: null,
  total_unit_amount: null,
  sale_price: null,
  cost_of_goods: null,
  weight: null,
  weight_unit: null,
  dimension_unit: null,
  charge_taxes: true,
  allow_back_order: false,
  track_inventory: false,
  available_quantity: 0,
  in_stock: true,
  committed_quantity: 0,
  is_visible: true,
  is_physical_product: true,
  is_default: true,
  shipping_profile_id: null,
  shipping_box_id: null,
  tax_profile_id: null,
};

const initialState: ProductState = {
  loaded: false,
  toggler: false,
  data: {
    title: '',
    slug: '',
    status: 'draft',
    ribbon: '',
    currency: {},
    brand: null,
    description: '',
    additional_info: [],
    allow_back_order: false,
    has_limit_per_order: true,
    max_per_order: 1,
    seo_title: '',
    seo_description: '',
    seo_keywords: [],
    schema_id: null,
    llm_instructions: '',
    og_title: null,
    og_description: null,
    og_image: null,
    has_variants: false,
    categories: [],
    tags: [],
    collections: [],
    attributes: [],
    variants: [{ ...defaultVariant }],
    media: [],
  },
};

export const productSlice = createSlice({
  name: APP_PREFIX + '-product',
  initialState,
  reducers: {
    ...commonActions,
    setProduct: (state, action: PayloadAction<Product>) => {
      const { payload } = action;
      state.loaded = true;
      state.data = payload;
      return state;
    },

    updateProduct: (state, action: PayloadAction<UpdateProductPayload>) => {
      const { data } = state;
      const { payload } = action;
      const { key, value, variants = false } = payload;
      if (variants) {
        if (key === 'base_price_per_unit') {
          const unitValue = value as UnitPriceValue;
          data.variants[0].total_unit_amount = unitValue?.total_unit_amount;
          data.variants[0].total_unit = unitValue?.total_unit;
          data.variants[0].base_unit_amount = unitValue?.base_unit_amount;
          data.variants[0].base_unit = unitValue?.base_unit;
        } else if (key === 'in_stock') {
          data.variants[0][key] =
            (value as string).toLowerCase() === 'false' ? false : true;
        } else {
          (data.variants[0] as Record<string, unknown>)[key] = value;
        }
      } else {
        (data as Record<string, unknown>)[key] = value;
      }
      return state;
    },

    updateVariants: (state, action: PayloadAction<UpdateVariantsPayload>) => {
      const { data } = state;
      const { payload } = action;
      const { variants } = data;
      const { key, value, variant_index = [] } = payload;
      if (variant_index.length > 0) {
        variant_index.forEach((item) => {
          if (key === 'base_price_per_unit') {
            const unitValue = value as UnitPriceValue;
            variants[item].total_unit_amount = unitValue?.total_unit_amount;
            variants[item].total_unit = unitValue?.total_unit;
            variants[item].base_unit_amount = unitValue?.base_unit_amount;
            variants[item].base_unit = unitValue?.base_unit;
          } else if (key === 'in_stock') {
            variants[item][key] =
              (value as string).toLowerCase() === 'false' ? false : true;
          } else {
            (variants[item] as Record<string, unknown>)[key] = value;
          }
        });
      }
      return state;
    },
    updateProductAttributes: (state, action: PayloadAction<Attribute[]>) => {
      const { data } = state;
      const { payload } = action;
      data.attributes = payload;
      data.variants = createVariantCombinations(
        data.attributes,
        data.variants,
      ) as ProductVariant[];
      return state;
    },
  },
});

export const getProductByIdAPI = async (id: number | string) => {
  let data: unknown = false;
  await axios
    .request(getOptions('/products/' + id))
    .then(function (response) {
      data = response.data;
    })
    .catch(function (error: unknown) {
      const err = error as AxiosErrorLike;
      data = err.response;
      console.error(data);
    });
  return data;
};

export const addProductAPI = async (params: ProductFormData) => {
  let data: unknown = false;
  await axios
    .request(postOptions('/products', params))
    .then(function (response) {
      data = response.data;
    })
    .catch(function (error: unknown) {
      const err = error as AxiosErrorLike;
      data = err.response!.data;
    });

  return data;
};

export const updateProductAPI = async (
  id: number | string,
  params: ProductFormData,
) => {
  let data: unknown = false;
  await axios
    .request(putOptions('/products/' + id, params))
    .then(function (response) {
      data = response.data;
    })
    .catch(function (error: unknown) {
      console.log(error);
      const err = error as AxiosErrorLike;
      data = err.response!.data;
    });

  return data;
};

export const createShippingBoxAPI = async (params: Record<string, unknown>) => {
  let data: unknown = false;
  await axios
    .request(postOptions('/shipping-boxes', params))
    .then(function (response) {
      data = response.data;
    })
    .catch(function (error: unknown) {
      const err = error as AxiosErrorLike;
      data = err.response!.data;
    });

  return data;
};

export const getShippingBoxListAPI = async (
  params: ListQueryParams = {
    search: '',
    sort_by: 'id',
    sort_order: 'asc',
    page: 1,
    limit: '10',
  },
) => {
  let data: unknown = false;
  await axios
    .request(getOptions('/shipping-boxes', params))
    .then(function (response) {
      data = response.data;
    })
    .catch(function (error: unknown) {
      const err = error as AxiosErrorLike;
      data = err.response!.data;
    });

  return data;
};

export const {
  setKeyValue,
  setProduct,
  updateProduct,
  updateVariants,
  updateProductAttributes,
} = productSlice.actions;

export default productSlice.reducer;
