import type { ReactNode } from 'react';

import { AreaIcon, SizeIcon, VolumeIcon, WeightIcon } from '@/icons';
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

export const unitList: UnitListItem[] = [
  { heading: __('Weight', 'kirki-ecommerce'), leftIcon: <WeightIcon /> },
  { title: __('Miligram', 'kirki-ecommerce'), value: 'mg', subText: 'mg' },
  { title: __('Gram', 'kirki-ecommerce'), value: 'g', subText: 'g' },
  {
    title: __('Kilogram', 'kirki-ecommerce'),
    value: 'kg',
    subText: 'kg',
    fallback: true,
  },
  { heading: __('Volume', 'kirki-ecommerce'), leftIcon: <VolumeIcon /> },
  { title: __('Mililiter', 'kirki-ecommerce'), value: 'ml', subText: 'ml' },
  { title: __('Centilitre', 'kirki-ecommerce'), value: 'cl', subText: 'cl' },
  { title: __('Liter', 'kirki-ecommerce'), value: 'L', subText: 'L' },
  { title: __('Miligram', 'kirki-ecommerce'), value: 'm3', subText: 'm3' },
  { heading: __('Size', 'kirki-ecommerce'), leftIcon: <SizeIcon /> },
  { title: __('Millimeter', 'kirki-ecommerce'), value: 'mm', subText: 'mm' },
  { title: __('Centimeter', 'kirki-ecommerce'), value: 'cm', subText: 'cm' },
  { title: __('Meter', 'kirki-ecommerce'), value: 'm', subText: 'm' },
  { heading: __('Area', 'kirki-ecommerce'), leftIcon: <AreaIcon /> },
  {
    title: __('Square Feet', 'kirki-ecommerce'),
    value: 'sqft',
    subText: 'sqft',
  },
];

export const normalizedUnit: NormalizedUnitMap = {
  mg: 0.001,
  g: 1,
  kg: 1000,
  ml: 0.001,
  cl: 0.01,
  L: 1,
  m3: 1000,
  mm: 0.001,
  cm: 0.01,
  m: 1,
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
  { title: __('Liter', 'kirki-ecommerce'), value: 'L', subText: 'L' },
  { title: __('Miligram', 'kirki-ecommerce'), value: 'm3', subText: 'm3' },
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

const unitGroupMap: UnitGroupMap = {
  mg: weightUnitList,
  g: weightUnitList,
  kg: weightUnitList,
  ml: volumeUnitList,
  cl: volumeUnitList,
  L: volumeUnitList,
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
