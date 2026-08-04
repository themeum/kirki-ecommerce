import type { ReactNode } from 'react';

import { AreaIcon, SizeIcon, VolumeIcon, WeightIcon } from '@/icons';
import type { UnitPriceValue } from '@/types';
import { __ } from '@/wpi18n';

type UnitListItem = {
  heading?: string;
  title?: string;
  value?: string;
  subText?: string;
  leftIcon?: ReactNode;
  fallback?: boolean;
  infoText?: string;
  group?: string;
  isRequired?: boolean;
};

type NormalizedUnitMap = Record<string, number>;

type UnitGroupMap = Record<string, UnitListItem[]>;

type UnitGroup = {
  heading: string;
  leftIcon: ReactNode;
  items: UnitListItem[];
};

type UnitPriceSource = UnitPriceValue & {
  price?: number | string | null;
};

export const DEFAULT_UNIT = 'kg';

export const normalizedUnit: NormalizedUnitMap = {
  mg: 0.001,
  g: 1,
  kg: 1000,
  ml: 0.001,
  cl: 0.01,
  l: 1,
  m3: 1000,
  mm: 0.001,
  cm: 0.01,
  m: 1,
  sqft: 1,
};

const weightUnitList: UnitListItem[] = [
  { title: __('Miligram', 'kirki-ecommerce'), value: 'mg', subText: 'mg' },
  { title: __('Gram', 'kirki-ecommerce'), value: 'g', subText: 'g' },
  {
    title: __('Kilogram', 'kirki-ecommerce'),
    value: 'kg',
    subText: 'kg',
    fallback: true,
  },
];

const volumeUnitList: UnitListItem[] = [
  { title: __('Mililiter', 'kirki-ecommerce'), value: 'ml', subText: 'ml' },
  { title: __('Centilitre', 'kirki-ecommerce'), value: 'cl', subText: 'cl' },
  { title: __('Liter', 'kirki-ecommerce'), value: 'l', subText: 'L' },
  { title: __('Cubic meter', 'kirki-ecommerce'), value: 'm3', subText: 'm³' },
];

const sizeUnitList: UnitListItem[] = [
  { title: __('Millimeter', 'kirki-ecommerce'), value: 'mm', subText: 'mm' },
  { title: __('Centimeter', 'kirki-ecommerce'), value: 'cm', subText: 'cm' },
  { title: __('Meter', 'kirki-ecommerce'), value: 'm', subText: 'm' },
];

const areaUnitList: UnitListItem[] = [
  {
    title: __('Square Feet', 'kirki-ecommerce'),
    value: 'sqft',
    subText: 'sqft',
  },
];

export const unitGroups: UnitGroup[] = [
  {
    heading: __('Weight', 'kirki-ecommerce'),
    leftIcon: <WeightIcon />,
    items: weightUnitList,
  },
  {
    heading: __('Volume', 'kirki-ecommerce'),
    leftIcon: <VolumeIcon />,
    items: volumeUnitList,
  },
  {
    heading: __('Size', 'kirki-ecommerce'),
    leftIcon: <SizeIcon />,
    items: sizeUnitList,
  },
  {
    heading: __('Area', 'kirki-ecommerce'),
    leftIcon: <AreaIcon />,
    items: areaUnitList,
  },
];

/**
 * Display code for a stored unit value. The two differ where the stored value
 * has to stay ASCII and lowercase for the API — `l` shows as `L`, `m3` as `m³`.
 */
export const getUnitShortText = (unit: string | null | undefined): string => {
  if (!unit) {
    return '';
  }

  const match = unitGroups
    .flatMap((group) => group.items)
    .find((item) => item.value === unit);

  return match?.subText ?? unit;
};

const unitGroupMap: UnitGroupMap = {
  mg: weightUnitList,
  g: weightUnitList,
  kg: weightUnitList,
  ml: volumeUnitList,
  cl: volumeUnitList,
  l: volumeUnitList,
  m3: volumeUnitList,
  mm: sizeUnitList,
  cm: sizeUnitList,
  m: sizeUnitList,
  sqft: areaUnitList,
};

export const getSpecifiedUnitList = (
  unit: string | null | undefined,
): UnitListItem[] => {
  if (!unit) {
    return [];
  }
  return unitGroupMap[unit] ?? [];
};

/**
 * Price of a single base unit, derived from the variant price and how many
 * base units fit in the total unit. Returns `null` when the unit setup is
 * incomplete or the two units belong to different measurement groups.
 */
export const calculateBasePricePerUnit = (
  source: UnitPriceSource,
): number | null => {
  const { price, total_unit_amount, total_unit, base_unit_amount, base_unit } =
    source;

  const totalFactor = normalizedUnit[total_unit ?? ''];
  const baseFactor = normalizedUnit[base_unit ?? ''];
  const totalAmount = Number(total_unit_amount);
  const baseAmount = Number(base_unit_amount);

  if (!totalFactor || !baseFactor || !totalAmount || !baseAmount) {
    return null;
  }

  if (!getSpecifiedUnitList(total_unit).some((item) => item.value === base_unit)) {
    return null;
  }

  const numberOfBaseUnits = (totalAmount * totalFactor) / (baseAmount * baseFactor);

  if (!Number.isFinite(numberOfBaseUnits) || numberOfBaseUnits <= 0) {
    return null;
  }

  return Number(price ?? 0) / numberOfBaseUnits;
};
