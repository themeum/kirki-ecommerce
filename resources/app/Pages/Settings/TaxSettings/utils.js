import { __ } from "@/wpi18n";

export const taxRuleConditionOptions = [
  { title: __("Tax Profile", "kirki-ecommerce"), value: "tax_profile" },
  { title: __("Destination", "kirki-ecommerce"), value: "destination_region" },
];

export const taxRuleActionOptionsArray = [
  { title: __("Set Tax Rate", "kirki-ecommerce"), value: "set_tax_rate" },
  { title: __("Tax Exempt", "kirki-ecommerce"), value: "exempt" },
];
