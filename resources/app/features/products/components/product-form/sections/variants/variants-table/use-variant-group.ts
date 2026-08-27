import type React from 'react';
import { useEffect, useMemo, useState } from 'react';
import { useFormContext, useWatch } from 'react-hook-form';

import type { AvailabilityStatus } from '@/features/products/lib/availability';
import { resolveGroupStatus, resolveVariantStatus } from '@/features/products/lib/availability';
import { generateVariantIndexes, getAttributeByValueId } from '@/features/products/lib/utils';
import {
  type CombinedVariantData,
  deriveSelectedCheckedIndexes,
  getCombinedVariantData,
  getGroupVariants,
  getSecondaryAttributeCount,
  getVariantIndexArray,
} from '@/features/products/lib/variant-group';
import type { Attribute } from '@/features/products/schemas/catalog/attribute';
import type { ProductVariant } from '@/features/products/schemas/catalog/variant';
import type { ProductFormInput } from '@/features/products/schemas/forms/product-form';
import type { MediaRef } from '@/schemas/shared/media';
import type { MediaChangePayload } from '@/types/pages/common';

type UpdateVariantsPayload = {
  key: string;
  value: unknown;
  variant_index?: number[];
};

type UseVariantGroupOptions = {
  parentId: number;
  selectedIndex: number[];
  setSelectedIndex: React.Dispatch<React.SetStateAction<number[]>>;
  expandVariation: boolean;
  storeDefaultThreshold: number;
  updateVariants: (payload: UpdateVariantsPayload) => void;
};

type UseVariantGroupResult = {
  thisVariants: ProductVariant[];
  thisAttribute: ReturnType<typeof getAttributeByValueId>;
  attributes: Attribute[];
  combinedData: CombinedVariantData;
  displayMedia: MediaRef[];
  childStatuses: AvailabilityStatus[];
  childQuantities: number[];
  groupStatus: AvailabilityStatus | null;
  groupQuantity: number;
  hasVariation: number;
  galleryIds: number[];
  productGallery: MediaRef[];
  variants: ProductVariant[];
  show: boolean;
  setShow: React.Dispatch<React.SetStateAction<boolean>>;
  selectedCheckedIndex: number[];
  handleParentCheckboxClick: (value: boolean, attributeArray: number[]) => void;
  handleChildCheckboxClick: (value: boolean, variant: ProductVariant, index: number) => void;
  handleOnParentValueChange: (value: unknown, fieldName: string) => void;
  handleOnChildValueChange: (value: unknown, fieldName: string, variant: ProductVariant) => void;
  handleParentMediaChange: (media: MediaChangePayload | null) => void;
  handleChildMediaChange: (media: MediaChangePayload | null, variant: ProductVariant) => void;
};

const stripMediaTimestamps = (value: unknown) => {
  const mediaValue = value as (MediaChangePayload & { date?: unknown; modified?: unknown }) | null;
  delete mediaValue?.date;
  delete mediaValue?.modified;
};

export const useVariantGroup = ({
  parentId,
  selectedIndex,
  setSelectedIndex,
  expandVariation,
  storeDefaultThreshold,
  updateVariants,
}: UseVariantGroupOptions): UseVariantGroupResult => {
  const { control, setValue } = useFormContext<ProductFormInput>();
  const attributes = useWatch({ control, name: 'attributes' }) ?? [];
  const watchedVariants = useWatch({ control, name: 'variants' });
  const variants = useMemo(() => (watchedVariants ?? []) as ProductVariant[], [watchedVariants]);
  const productGallery = useWatch({ control, name: 'media' }) ?? [];
  const galleryIds = productGallery.map((item) => Number(item.id)).filter(Boolean);
  const [selectedCheckedIndex, setSelectedCheckedIndex] = useState<number[]>([]);
  const [combinedData, setCombinedData] = useState<CombinedVariantData>({
    minPrice: 0,
    maxPrice: 0,
    media: [],
  });

  const thisVariants = useMemo(() => getGroupVariants(variants, parentId), [variants, parentId]);

  const [show, setShow] = useState(expandVariation);

  useEffect(() => {
    setCombinedData(getCombinedVariantData(thisVariants));
  }, [thisVariants]);

  const allChildrenHaveMedia =
    thisVariants.length > 0 && thisVariants.every((variant) => Boolean(variant.media));
  const displayMedia = allChildrenHaveMedia ? combinedData.media : [];

  const childStatuses = useMemo(
    () =>
      thisVariants.map((variant) =>
        resolveVariantStatus(
          {
            trackInventory: Boolean(variant.track_inventory),
            inStock: Boolean(variant.in_stock),
            availableQuantity: Number(variant.available_quantity ?? 0),
            lowStockThreshold: variant.low_stock_threshold ?? null,
          },
          storeDefaultThreshold,
        ),
      ),
    [thisVariants, storeDefaultThreshold],
  );

  const groupStatus = useMemo(() => resolveGroupStatus(childStatuses), [childStatuses]);

  const childQuantities = useMemo(
    () =>
      thisVariants.map((variant) =>
        variant.track_inventory ? Number(variant.available_quantity ?? 0) : 0,
      ),
    [thisVariants],
  );

  const groupQuantity = useMemo(
    () => childQuantities.reduce((sum, quantity) => sum + quantity, 0),
    [childQuantities],
  );

  const thisAttribute = getAttributeByValueId(attributes, parentId);

  useEffect(() => {
    setShow(expandVariation);
  }, [expandVariation]);

  useEffect(() => {
    const nextCheckedIndex = deriveSelectedCheckedIndexes(
      selectedIndex,
      variants.length,
      thisVariants.length,
    );

    if (nextCheckedIndex !== null) {
      setSelectedCheckedIndex(nextCheckedIndex);
    }
  }, [selectedIndex, thisVariants.length, variants.length]);

  const getIndexArray = (variant: ProductVariant): number[] =>
    getVariantIndexArray(variants, variant);

  const handleOnChildValueChange = (value: unknown, fieldName: string, variant: ProductVariant) => {
    const indexList = getIndexArray(variant).filter(
      (index: number) => !selectedIndex.includes(index),
    );
    if (fieldName === 'media') {
      stripMediaTimestamps(value);
    }

    updateVariants({
      key: fieldName,
      value,
      variant_index: [...selectedIndex, ...indexList],
    });
  };

  const handleOnParentValueChange = (value: unknown, fieldName: string) => {
    const indexList = generateVariantIndexes(variants, [parentId]);
    if (fieldName === 'media') {
      stripMediaTimestamps(value);
    }
    updateVariants({
      key: fieldName,
      value,
      variant_index: [
        ...selectedIndex,
        ...indexList.filter((item: number) => !selectedIndex.includes(item)),
      ],
    });
    setSelectedCheckedIndex([]);
    setSelectedIndex([]);
  };

  const handleParentCheckboxClick = (value: boolean, attributeArray: number[]) => {
    setShow(true);
    const indexList = generateVariantIndexes(variants, attributeArray);
    if (value) {
      setSelectedIndex((prev) => [
        ...prev,
        ...indexList.filter((item: number) => !selectedIndex.includes(item)),
      ]);
      setSelectedCheckedIndex([...Array(thisVariants.length).keys()]);
    } else {
      const newList = selectedIndex.filter((item) => !indexList.includes(item));
      setSelectedIndex(newList);
      setSelectedCheckedIndex([]);
    }
  };

  const handleChildCheckboxClick = (value: boolean, variant: ProductVariant, index: number) => {
    const indexList = getIndexArray(variant);
    if (value) {
      setSelectedIndex((prev) => [...prev, ...indexList]);
      setSelectedCheckedIndex((prev) => [...prev, index]);
    } else {
      const newList = selectedIndex.filter((item) => !indexList.includes(item));
      setSelectedIndex(newList);
      setSelectedCheckedIndex((prev) => prev.filter((item) => item !== index));
    }
  };

  const addToGalleryIfMissing = (media: MediaChangePayload | null) => {
    if (!media?.id) {
      return;
    }
    const isInGallery = productGallery.some((item) => String(item.id) === String(media.id));
    if (!isInGallery) {
      setValue('media', [...productGallery, media as MediaRef], { shouldDirty: true });
    }
  };

  const handleParentMediaChange = (media: MediaChangePayload | null) => {
    handleOnParentValueChange(media, 'media');
    addToGalleryIfMissing(media);
  };

  const handleChildMediaChange = (media: MediaChangePayload | null, variant: ProductVariant) => {
    handleOnChildValueChange(media, 'media', variant);
    addToGalleryIfMissing(media);
  };

  const hasVariation =
    thisVariants.length > 0 ? getSecondaryAttributeCount(thisVariants[0], parentId) : 0;

  return {
    thisVariants,
    thisAttribute,
    attributes,
    combinedData,
    displayMedia,
    childStatuses,
    childQuantities,
    groupStatus,
    groupQuantity,
    hasVariation,
    galleryIds,
    productGallery,
    variants,
    show,
    setShow,
    selectedCheckedIndex,
    handleParentCheckboxClick,
    handleChildCheckboxClick,
    handleOnParentValueChange,
    handleOnChildValueChange,
    handleParentMediaChange,
    handleChildMediaChange,
  };
};
