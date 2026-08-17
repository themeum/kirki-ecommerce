import type React from 'react';
import { useEffect, useMemo, useState } from 'react';
import { useFormContext, useWatch } from 'react-hook-form';

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

type UseSingleGroupOptions = {
  parentId: number;
  selectedIndex: number[];
  setSelectedIndex: React.Dispatch<React.SetStateAction<number[]>>;
  expandVariation: boolean;
  updateVariants: (payload: UpdateVariantsPayload) => void;
};

type UseSingleGroupResult = {
  thisVariants: ProductVariant[];
  thisAttribute: ReturnType<typeof getAttributeByValueId>;
  attributes: Attribute[];
  combinedData: CombinedVariantData;
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
  handleParentThumbnailChange: (media: MediaChangePayload | null) => void;
  handleChildThumbnailChange: (media: MediaChangePayload | null, variant: ProductVariant) => void;
};

const stripMediaTimestamps = (value: unknown) => {
  const mediaValue = value as (MediaChangePayload & { date?: unknown; modified?: unknown }) | null;
  delete mediaValue?.date;
  delete mediaValue?.modified;
};

export const useSingleGroup = ({
  parentId,
  selectedIndex,
  setSelectedIndex,
  expandVariation,
  updateVariants,
}: UseSingleGroupOptions): UseSingleGroupResult => {
  const { control, setValue } = useFormContext<ProductFormInput>();
  const attributes = useWatch({ control, name: 'attributes' }) ?? [];
  const watchedVariants = useWatch({ control, name: 'variants' });
  const variants = useMemo(
    () => (watchedVariants ?? []) as ProductVariant[],
    [watchedVariants],
  );
  const productGallery = useWatch({ control, name: 'media' }) ?? [];
  const galleryIds = productGallery.map((item) => Number(item.id)).filter(Boolean);
  const [selectedCheckedIndex, setSelectedCheckedIndex] = useState<number[]>([]);
  const [combinedData, setCombinedData] = useState<CombinedVariantData>({});

  const thisVariants = useMemo(
    () => getGroupVariants(variants, parentId),
    [variants, parentId],
  );

  const [show, setShow] = useState(expandVariation);

  useEffect(() => {
    setCombinedData(getCombinedVariantData(thisVariants));
  }, [thisVariants]);

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

  const handleOnChildValueChange = (
    value: unknown,
    fieldName: string,
    variant: ProductVariant,
  ) => {
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

  const handleParentCheckboxClick = (
    value: boolean,
    attributeArray: number[],
  ) => {
    setShow(true);
    const indexList = generateVariantIndexes(variants, attributeArray);
    if (value) {
      setSelectedIndex((prev) => [
        ...prev,
        ...indexList.filter((item: number) => !selectedIndex.includes(item)),
      ]);
      setSelectedCheckedIndex([...Array(thisVariants.length).keys()]);
    } else {
      const newList = selectedIndex.filter(
        (item) => !indexList.includes(item),
      );
      setSelectedIndex(newList);
      setSelectedCheckedIndex([]);
    }
  };

  const handleChildCheckboxClick = (
    value: boolean,
    variant: ProductVariant,
    index: number,
  ) => {
    const indexList = getIndexArray(variant);
    if (value) {
      setSelectedIndex((prev) => [...prev, ...indexList]);
      setSelectedCheckedIndex((prev) => [...prev, index]);
    } else {
      const newList = selectedIndex.filter(
        (item) => !indexList.includes(item),
      );
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

  const handleParentThumbnailChange = (media: MediaChangePayload | null) => {
    handleOnParentValueChange(media, 'media');
    addToGalleryIfMissing(media);
  };

  const handleChildThumbnailChange = (media: MediaChangePayload | null, variant: ProductVariant) => {
    handleOnChildValueChange(media, 'media', variant);
    addToGalleryIfMissing(media);
  };

  const hasVariation = thisVariants.length > 0
    ? getSecondaryAttributeCount(thisVariants[0], parentId)
    : 0;

  return {
    thisVariants,
    thisAttribute,
    attributes,
    combinedData,
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
    handleParentThumbnailChange,
    handleChildThumbnailChange,
  };
};
