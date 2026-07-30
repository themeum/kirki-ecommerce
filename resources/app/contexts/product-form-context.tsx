import { createContext, useContext, useMemo, useReducer, type Dispatch, type ReactNode } from 'react';

import { createVariantCombinations } from '@/pages/products/utils';
import type {
  Attribute,
  Product,
  ProductVariant,
  UnitPriceValue,
  UpdateProductPayload,
  UpdateVariantsPayload,
} from '@/types';

type ProductFormState = {
  loaded: boolean;
  data: Product;
};

type ProductFormAction =
  | { type: 'SET_PRODUCT'; payload: Product }
  | { type: 'RESET_PRODUCT' }
  | { type: 'UPDATE_PRODUCT'; payload: UpdateProductPayload }
  | { type: 'UPDATE_VARIANTS'; payload: UpdateVariantsPayload }
  | { type: 'UPDATE_ATTRIBUTES'; payload: Attribute[] };

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
  has_limit_per_order: true,
  max_per_order: 1,
  is_visible: true,
  is_physical_product: true,
  is_default: true,
  shipping_profile_id: null,
  shipping_box_id: null,
  tax_profile_id: null,
};

const createInitialProduct = (): Product => ({
  title: '',
  slug: '',
  status: 'draft',
  ribbon: '',
  currency: null,
  brand: null,
  description: '',
  short_description: '',
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
});

const initialState: ProductFormState = {
  loaded: false,
  data: createInitialProduct(),
};

const applyVariantField = (
  variant: ProductVariant,
  key: string,
  value: unknown,
) => {
  if (key === 'base_price_per_unit') {
    const unitValue = value as UnitPriceValue;
    variant.total_unit_amount = unitValue?.total_unit_amount;
    variant.total_unit = unitValue?.total_unit;
    variant.base_unit_amount = unitValue?.base_unit_amount;
    variant.base_unit = unitValue?.base_unit;
    return;
  }

  if (key === 'in_stock') {
    variant.in_stock =
      typeof value === 'string'
        ? value.toLowerCase() !== 'false'
        : Boolean(value);
    return;
  }

  (variant as Record<string, unknown>)[key] = value;
};

const productFormReducer = (
  state: ProductFormState,
  action: ProductFormAction,
): ProductFormState => {
  if (action.type === 'SET_PRODUCT') {
    return {
      loaded: true,
      data: action.payload,
    };
  }

  if (action.type === 'RESET_PRODUCT') {
    return {
      loaded: false,
      data: createInitialProduct(),
    };
  }

  if (action.type === 'UPDATE_PRODUCT') {
    const { key, value, variants = false } = action.payload;
    const data = { ...state.data, variants: [...state.data.variants] };

    if (variants) {
      data.variants[0] = { ...data.variants[0] };
      applyVariantField(data.variants[0], key, value);
    } else {
      (data as Record<string, unknown>)[key] = value;
    }

    return { ...state, data };
  }

  if (action.type === 'UPDATE_VARIANTS') {
    const { key, value, variant_index = [] } = action.payload;
    const variants = state.data.variants.map((variant) => ({ ...variant }));

    variant_index.forEach((index) => {
      if (!variants[index]) {
        return;
      }
      applyVariantField(variants[index], key, value);
    });

    return {
      ...state,
      data: {
        ...state.data,
        variants,
      },
    };
  }

  if (action.type === 'UPDATE_ATTRIBUTES') {
    const attributes = action.payload;
    const variants = createVariantCombinations(
      attributes,
      state.data.variants,
    ) as ProductVariant[];

    return {
      ...state,
      data: {
        ...state.data,
        attributes,
        variants,
      },
    };
  }

  return state;
};

type ProductFormContextValue = {
  state: ProductFormState;
  dispatch: Dispatch<ProductFormAction>;
  product: Product;
  loaded: boolean;
  setProduct: (product: Product) => void;
  updateProduct: (payload: UpdateProductPayload) => void;
  updateVariants: (payload: UpdateVariantsPayload) => void;
  updateProductAttributes: (attributes: Attribute[]) => void;
  resetProduct: () => void;
};

const ProductFormContext = createContext<ProductFormContextValue | null>(null);

type ProductFormProviderProps = {
  children: ReactNode;
  initialProduct?: Product;
};

const ProductFormProvider = ({
  children,
  initialProduct,
}: ProductFormProviderProps) => {
  const [state, dispatch] = useReducer(
    productFormReducer,
    initialProduct
      ? { loaded: true, data: initialProduct }
      : initialState,
  );

  const value = useMemo<ProductFormContextValue>(
    () => ({
      state,
      dispatch,
      product: state.data,
      loaded: state.loaded,
      setProduct: (product) => {
        dispatch({ type: 'SET_PRODUCT', payload: product });
      },
      updateProduct: (payload) => {
        dispatch({ type: 'UPDATE_PRODUCT', payload });
      },
      updateVariants: (payload) => {
        dispatch({ type: 'UPDATE_VARIANTS', payload });
      },
      updateProductAttributes: (attributes) => {
        dispatch({ type: 'UPDATE_ATTRIBUTES', payload: attributes });
      },
      resetProduct: () => {
        dispatch({ type: 'RESET_PRODUCT' });
      },
    }),
    [state],
  );

  return (
    <ProductFormContext.Provider value={value}>
      {children}
    </ProductFormContext.Provider>
  );
};

const useProductForm = () => {
  const context = useContext(ProductFormContext);
  if (!context) {
    throw new Error('useProductForm must be used within ProductFormProvider');
  }
  return context;
};

ProductFormProvider.displayName = 'ProductFormProvider';

export {
  ProductFormProvider,
  useProductForm,
  defaultVariant,
  createInitialProduct,
};
export type { ProductFormState, ProductFormAction };
