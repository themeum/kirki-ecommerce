import { useFormContext, useWatch } from 'react-hook-form';

import type { ProductFormInput } from '@/features/products/schemas/forms/product-form';
import type { MediaRef } from '@/schemas/shared/media';
import { useSettingsQuery } from '@/services/settings';
import { isDefined } from '@/utils/object';

type SeoPreviewMode = 'search' | 'social' | 'schema';

type SeoPreviewData = {
  storeName: string;
  storeLogoUrl: string | null;
  breadcrumbUrl: string;
  previewTitle: string;
  previewDescription: string;
  previewImageUrl: string | null;
  displayPrice: string | null;
  strikethroughPrice: string | null;
};

const formatAmount = (
  amount: number | string | null | undefined,
  symbol: string,
  code: string,
): string | null => {
  if (!isDefined(amount) || amount === '') {
    return null;
  }

  const numericAmount = typeof amount === 'string' ? Number.parseFloat(amount) : amount;

  if (Number.isNaN(numericAmount)) {
    return null;
  }

  return `${symbol}${numericAmount.toFixed(2)} ${code}`.trim();
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

  const seoTitle = useWatch({ control, name: 'seo_title' });
  const seoDescription = useWatch({ control, name: 'seo_description' });
  const ogTitle = useWatch({ control, name: 'og_title' });
  const ogDescription = useWatch({ control, name: 'og_description' });
  const title = useWatch({ control, name: 'title' });
  const shortDescription = useWatch({ control, name: 'short_description' });
  const slug = useWatch({ control, name: 'slug' });
  const media = useWatch({ control, name: 'media' });
  const currency = useWatch({ control, name: 'currency' });
  const price = useWatch({ control, name: 'variants.0.base_price' });
  const salePriceValue = useWatch({ control, name: 'variants.0.base_sale_price' });

  const storeLogo = generalSettings?.store_logo;
  const storeLogoUrl = storeLogo && typeof storeLogo === 'object' ? (storeLogo.url ?? null) : null;
  const storeName = generalSettings?.store_name ?? '';
  const siteUrl = window.kirki_ecommerce.site_url.replace(/\/$/, '');
  const breadcrumbUrl = `${siteUrl} › products › ${slug ?? ''}`;

  const previewTitle = mode === 'social' ? ogTitle || title || '' : seoTitle || title || '';

  const previewDescription =
    mode === 'social'
      ? ogDescription || shortDescription || ''
      : seoDescription || shortDescription || '';

  const previewImageUrl = resolveMediaUrl(media);
  const currencySymbol = currency?.symbol ?? '$';
  const currencyCode = currency?.code ?? '';
  const regularPrice = formatAmount(price, currencySymbol, currencyCode);
  const salePrice = formatAmount(salePriceValue, currencySymbol, currencyCode);

  const regularAmount = isDefined(price) ? Number.parseFloat(String(price)) : null;
  const saleAmount =
    salePriceValue !== null && salePriceValue !== undefined
      ? Number.parseFloat(String(salePriceValue))
      : null;

  const hasSale =
    salePrice !== null &&
    regularPrice !== null &&
    saleAmount !== null &&
    regularAmount !== null &&
    !Number.isNaN(saleAmount) &&
    !Number.isNaN(regularAmount) &&
    saleAmount < regularAmount;

  const displayPrice = hasSale ? salePrice : regularPrice;
  const strikethroughPrice = hasSale ? regularPrice : null;

  return {
    storeName,
    storeLogoUrl,
    breadcrumbUrl,
    previewTitle,
    previewDescription,
    previewImageUrl,
    displayPrice,
    strikethroughPrice,
  };
};

export default useSeoPreviewData;

export type { SeoPreviewData, SeoPreviewMode };
