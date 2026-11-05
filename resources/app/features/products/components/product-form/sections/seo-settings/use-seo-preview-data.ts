import { useFormContext, useWatch } from 'react-hook-form';

import type { ProductFormInput } from '@/features/products/schemas/forms/product-form';
import { useBaseCurrency } from '@/hooks';
import type { MediaRef } from '@/schemas/shared/media';
import { useSettingsQuery } from '@/services/settings';
import { isDefined } from '@/utils/object';

const DEFAULT_SHOP_PAGE_SLUG = 'shop';

type SeoPreviewMode = 'search' | 'social' | 'schema';

type SeoPreviewData = {
  storeName: string;
  storeLogoUrl: string | null;
  breadcrumbUrl: string;
  isBreadcrumbLoading: boolean;
  previewTitle: string;
  previewDescription: string;
  previewImageUrl: string | null;
  displayPrice: string | null;
  strikethroughPrice: string | null;
};

const formatAmount = (
  amount: number | string | null | undefined,
  symbol: string,
): string | null => {
  if (!isDefined(amount) || amount === '') {
    return null;
  }

  const numericAmount = typeof amount === 'string' ? Number.parseFloat(amount) : amount;

  if (Number.isNaN(numericAmount)) {
    return null;
  }

  return `${symbol}${numericAmount.toFixed(2)}`.trim();
};

const parseAmount = (amount: number | string | null | undefined): number | null => {
  if (!isDefined(amount) || amount === '') {
    return null;
  }

  const numericAmount = typeof amount === 'string' ? Number.parseFloat(amount) : amount;

  return Number.isNaN(numericAmount) ? null : numericAmount;
};

const formatAmountRange = (amounts: number[], symbol: string, code: string): string | null => {
  if (amounts.length === 0) {
    return null;
  }

  const lowest = formatAmount(Math.min(...amounts), symbol);
  const highest = formatAmount(Math.max(...amounts), symbol);

  return lowest === highest ? `${lowest} ${code}` : `${lowest} - ${highest} ${code}`;
};

const resolveMediaUrl = (media: MediaRef[] | undefined): string | null => {
  const firstItem = media?.[0];

  if (!firstItem || typeof firstItem !== 'object') {
    return null;
  }

  return firstItem.url ?? null;
};

const useSeoPreviewData = (mode: SeoPreviewMode): SeoPreviewData => {
  const { control } = useFormContext<ProductFormInput>();
  const { data: generalSettings } = useSettingsQuery('general');
  const { data: advancedSettings, isPending: isBreadcrumbLoading } = useSettingsQuery('advance');
  const baseCurrency = useBaseCurrency();

  const seoTitle = useWatch({ control, name: 'seo_title' });
  const seoDescription = useWatch({ control, name: 'seo_description' });
  const ogTitle = useWatch({ control, name: 'og_title' });
  const ogDescription = useWatch({ control, name: 'og_description' });
  const title = useWatch({ control, name: 'title' });
  const shortDescription = useWatch({ control, name: 'short_description' });
  const slug = useWatch({ control, name: 'slug' });
  const media = useWatch({ control, name: 'media' });
  const variants = useWatch({ control, name: 'variants' });
  const hasVariants = useWatch({ control, name: 'has_variants' });

  const storeLogo = generalSettings?.store_logo;
  const storeLogoUrl = storeLogo && typeof storeLogo === 'object' ? (storeLogo.url ?? null) : null;
  const storeName = generalSettings?.store_name ?? '';
  const siteUrl = window.kirki_ecommerce.site_url.replace(/\/$/, '');
  const shopPageSlug =
    advancedSettings?.pages?.find((page) => page.key === 'shop')?.slug || DEFAULT_SHOP_PAGE_SLUG;
  const breadcrumbUrl = `${siteUrl} › ${shopPageSlug} › ${slug ?? ''}`;

  const previewTitle = mode === 'social' ? ogTitle || title || '' : seoTitle || title || '';

  const previewDescription =
    mode === 'social'
      ? ogDescription || shortDescription || ''
      : seoDescription || shortDescription || '';

  const previewImageUrl = resolveMediaUrl(media);
  const currencySymbol = baseCurrency?.symbol ?? '';
  const currencyCode = baseCurrency?.code ?? '';
  const pricedVariants = (hasVariants ? variants : variants?.slice(0, 1)) ?? [];

  const regularAmounts: number[] = [];
  const effectiveAmounts: number[] = [];
  const discountedRegularAmounts: number[] = [];

  pricedVariants.forEach((variant) => {
    const regularAmount = parseAmount(variant?.base_price);
    const saleAmount = parseAmount(variant?.base_sale_price);

    if (regularAmount === null) {
      return;
    }

    regularAmounts.push(regularAmount);

    if (saleAmount !== null && saleAmount < regularAmount) {
      effectiveAmounts.push(saleAmount);
      discountedRegularAmounts.push(regularAmount);
      return;
    }

    effectiveAmounts.push(regularAmount);
  });

  const displayPrice = formatAmountRange(effectiveAmounts, currencySymbol, currencyCode);
  const strikethroughPrice = formatAmountRange(
    discountedRegularAmounts,
    currencySymbol,
    currencyCode,
  );

  return {
    storeName,
    storeLogoUrl,
    breadcrumbUrl,
    isBreadcrumbLoading,
    previewTitle,
    previewDescription,
    previewImageUrl,
    displayPrice,
    strikethroughPrice,
  };
};

export default useSeoPreviewData;

export type { SeoPreviewData, SeoPreviewMode };
