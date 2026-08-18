import type {
  ProductSelection,
  ProductVariantSelection,
} from '@/features/products/components/shared/select-products-dialog/types';
import { getVariantLabel } from '@/features/products/components/shared/select-products-dialog/variant-label';
import type { ProductListItemWithVariants } from '@/features/products/schemas/catalog/product';
import { __ } from '@/wpi18n';

const buildVariantSelections = (
  product: ProductListItemWithVariants,
): ProductVariantSelection[] =>
  product.variants.reduce<ProductVariantSelection[]>((variants, variant) => {
    if (!variant.id) {
      return variants;
    }

    const label = getVariantLabel(product.attributes, variant);

    variants.push({
      variantId: variant.id,
      variantLabel:
        label || variant.sku || __('Default', 'kirki-ecommerce'),
      thumbnail: variant.media?.url ?? product.image ?? null,
      inStock: variant.in_stock,
      regularPrice: variant.base_price_money_object,
      salePrice: variant.base_sale_price_money_object,
    });

    return variants;
  }, []);

const buildProductSelection = (product: ProductListItemWithVariants): ProductSelection => ({
  productId: product.id,
  productTitle: product.title,
  thumbnail: product.image ?? null,
  inStock: Number(product.inventory ?? 0) > 0,
  regularPrice: product.base_price_money_object,
  salePrice: product.base_sale_price_money_object,
  variants: buildVariantSelections(product),
});

export { buildProductSelection, buildVariantSelections };
