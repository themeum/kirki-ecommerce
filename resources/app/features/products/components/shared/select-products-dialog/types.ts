import type { ProductListItemWithVariants } from '@/features/products/schemas/catalog/product';
import type { ProductSelection } from '@/features/products/schemas/catalog/product-selection';

export type {
  ProductSelection,
  ProductVariantSelection,
} from '@/features/products/schemas/catalog/product-selection';

export type SelectProductsMode = 'order' | 'product';

export type ProductPickerItem = {
  product: ProductListItemWithVariants;
  selection: ProductSelection;
};
