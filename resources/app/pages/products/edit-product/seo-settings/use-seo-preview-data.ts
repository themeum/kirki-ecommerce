import { useFormContext } from 'react-hook-form';

import { useProductForm } from '@/contexts/product-form-context';
import type { ProductSeoFormValues } from '@/schemas/forms/product-seo-form';
import { useSettingsQuery } from '@/services/settings';
import type { MediaRef } from '@/types';

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
  if (amount === null || amount === undefined || amount === '') {
    return null;
  }

  const numericAmount =
    typeof amount === 'string' ? Number.parseFloat(amount) : amount;

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
  const { product } = useProductForm();
  const { watch } = useFormContext<ProductSeoFormValues>();
  const { data: generalSettings } = useSettingsQuery('general');

  const seoTitle = watch('seo_title');
  const seoDescription = watch('seo_description');
  const ogTitle = watch('og_title');
  const ogDescription = watch('og_description');

  const storeLogo = generalSettings?.store_logo;
  const storeLogoUrl =
    storeLogo && typeof storeLogo === 'object' ? (storeLogo.url ?? null) : null;
  const storeName = generalSettings?.store_name ?? '';
  const siteUrl = window.kirki_ecommerce.site_url.replace(/\/$/, '');
  const slug = product.slug ?? '';
  const breadcrumbUrl = `${siteUrl} › products › ${slug}`;

  const previewTitle =
    mode === 'social'
      ? ogTitle || product.title || ''
      : seoTitle || product.title || '';

  const previewDescription =
    mode === 'social'
      ? ogDescription || product.short_description || ''
      : seoDescription || product.short_description || '';

  const previewImageUrl = resolveMediaUrl(product.media);
  const currencySymbol = product.currency?.symbol ?? '$';
  const currencyCode = product.currency?.code ?? '';
  const variant = product.variants[0];
  const regularPrice = formatAmount(
    variant?.price,
    currencySymbol,
    currencyCode,
  );
  const salePrice = formatAmount(
    variant?.sale_price,
    currencySymbol,
    currencyCode,
  );

  const regularAmount =
    variant?.price !== null && variant?.price !== undefined
      ? Number.parseFloat(String(variant.price))
      : null;
  const saleAmount =
    variant?.sale_price !== null && variant?.sale_price !== undefined
      ? Number.parseFloat(String(variant.sale_price))
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
