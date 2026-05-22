import { __ } from "@/wpi18n";

export const getDestinationDisplayValue = (value) => {
  if (!Array.isArray(value) || value.length === 0)
    return __("Select regions", "kirki-ecommerce");
  if (value.length === 1) return value[0];
  return `${value[0]} +${value.length - 1}…`;
};
