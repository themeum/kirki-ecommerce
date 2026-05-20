import { AreaIcon, SizeIcon, VolumeIcon, WeightIcon } from "icons";
import { __ } from "wpi18n";

export const unitList = [
  // TODO: ask if subtext units need to be converted
  { heading: __("Weight", "kirki-ecommerce"), leftIcon: <WeightIcon /> },
  { title: __("Miligram", "kirki-ecommerce"), value: "mg", subText: "mg" },
  { title: __("Gram", "kirki-ecommerce"), value: "g", subText: "g" },
  {
    title: __("Kilogram", "kirki-ecommerce"),
    value: "kg",
    subText: "kg",
    fallback: true,
  },
  { heading: __("Volume", "kirki-ecommerce"), leftIcon: <VolumeIcon /> },
  { title: __("Mililiter", "kirki-ecommerce"), value: "ml", subText: "ml" },
  { title: __("Centilitre", "kirki-ecommerce"), value: "cl", subText: "cl" },
  { title: __("Liter", "kirki-ecommerce"), value: "L", subText: "L" },
  { title: __("Miligram", "kirki-ecommerce"), value: "m3", subText: "m3" },
  { heading: __("Size", "kirki-ecommerce"), leftIcon: <SizeIcon /> },
  { title: __("Millimeter", "kirki-ecommerce"), value: "mm", subText: "mm" },
  { title: __("Centimeter", "kirki-ecommerce"), value: "cm", subText: "cm" },
  { title: __("Meter", "kirki-ecommerce"), value: "m", subText: "m" },
  { heading: __("Area", "kirki-ecommerce"), leftIcon: <AreaIcon /> },
  { title: __("Square Feet", "kirki-ecommerce"), value: "sqft", subText: "sqft" },
];

export const normalizedUnit = {
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

const weightUnitList = [
  { title: __("Miligram", "kirki-ecommerce"), value: "mg", subText: "mg" },
  { title: __("Gram", "kirki-ecommerce"), value: "g", subText: "g" },
  {
    title: __("Kilogram", "kirki-ecommerce"),
    value: "kg",
    subText: "kg",
    fallback: true,
  },
];
const volumeUnitList = [
  { title: __("Mililiter", "kirki-ecommerce"), value: "ml", subText: "ml" },
  { title: __("Centilitre", "kirki-ecommerce"), value: "cl", subText: "cl" },
  { title: __("Liter", "kirki-ecommerce"), value: "L", subText: "L" },
  { title: __("Miligram", "kirki-ecommerce"), value: "m3", subText: "m3" },
];

const sizeUnitList = [
  { title: __("Millimeter", "kirki-ecommerce"), value: "mm", subText: "mm" },
  { title: __("Centimeter", "kirki-ecommerce"), value: "cm", subText: "cm" },
  { title: __("Meter", "kirki-ecommerce"), value: "m", subText: "m" },
];
const areaUnitList = [
  { title: __("Square Feet", "kirki-ecommerce"), value: "sqft", subText: "sqft" },
];

const unitGroupMap = {
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

export const getSpecifiedUnitList = (unit) => {
  if (!unit) return [];
  return unitGroupMap[unit];
};
