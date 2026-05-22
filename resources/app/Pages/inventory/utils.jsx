import { DragIcon } from "@/icons";
import { __ } from "@/wpi18n";

export const allTableHeaders = [
  {
    title: __("Variants", "kirki-ecommerce"),
    value: "title",
    icon: <DragIcon />,
    isDefault: true,
  },
  {
    title: __("SKU", "kirki-ecommerce"),
    value: "sku",
    icon: <DragIcon />,
    isDefault: true,
  },
  {
    title: __("Price", "kirki-ecommerce"),
    value: "price",
    icon: <DragIcon />,
    isDefault: true,
  },
  {
    title: __("Sale Price", "kirki-ecommerce"),
    value: "sale_price",
    icon: <DragIcon />,
  },
  {
    title: __("Cost of Goods", "kirki-ecommerce"),
    value: "cost_of_goods",
    icon: <DragIcon />,
  },
  {
    title: __("Profit", "kirki-ecommerce"),
    value: "profit",
    icon: <DragIcon />,
  },
];
