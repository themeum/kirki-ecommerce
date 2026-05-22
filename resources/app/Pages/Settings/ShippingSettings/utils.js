import { StoreIcon, TruckIcon, WeightIcon } from "@/Icons";
import { getNestedSearchedValue, setUnsavedDataStatus } from "../utils";
import {
  updateSettingsAPI,
  updateSettings,
} from "../../../store/settingsSlice";
import { store } from "../../../store";
import { dispatchToastMessage } from "../../utils";
import { __ } from "@/wpi18n";

export const getSelectedRegionTags = (regions = [], countryList = []) => {
  return regions
    .map((region) => {
      const selectedCountry = countryList?.find(
        (country) =>
          country?.code?.toLowerCase() === region?.country?.toLowerCase()
      );

      if (!selectedCountry) return null;

      const statesCount = region?.states?.length || 0;

      return {
        id: selectedCountry?.code,
        title: selectedCountry.name,
        tagIcon: <span>{selectedCountry.flag}</span>,
        subText: statesCount ? `${statesCount} states` : "",
      };
    })
    .filter(Boolean);
};

export const getSearchedCountries = (searchValue, countryList) => {
  if (!searchValue) return countryList;
  return getNestedSearchedValue(searchValue, countryList, ["states"]);
};

export const saveShippingZones = async ({
  zones,
  from = "",
  shippingSettingsData,
  toastMessage = "",
  variant = "success",
}) => {
  const data = {
    ...shippingSettingsData,
    shipping_zones: zones,
  };
  const result = await updateSettingsAPI("shipping", data);
  if (result?.success) {
    store.dispatch(updateSettings({ key: "shipping", value: result.data }));
    setUnsavedDataStatus(false);
    if (from !== "delete") {
      dispatchToastMessage(variant, { title: toastMessage });
    }
  } else {
    dispatchToastMessage("error", { title: result?.message });
  }
};

export const shippingMethodIconMap = {
  flat_rate: <TruckIcon />,
  local_pickup: <WeightIcon />,
  weight: <StoreIcon />,
};

export const conditionOptions = [
  {
    title: __("Product Category", "kirki-ecommerce"),
    value: "product_categories",
  },
  {
    title: __("Shipping Profile", "kirki-ecommerce"),
    value: "shipping_profile",
  },

  {
    title: __("Destination", "kirki-ecommerce"),
    value: "destination_region",
  },
  {
    title: __("Cart Value (Subtotal)", "kirki-ecommerce"),
    value: "cart_weight",
  },
];

export const actionOptionsArray = [
  {
    title: __("Set Shipping Price", "kirki-ecommerce"),
    value: "set_shipping_cost",
  },
  {
    title: __("Add Extra to Price", "kirki-ecommerce"),
    value: "add_shipping_cost",
  },
  {
    title: __("Disable This Shipping Method", "kirki-ecommerce"),
    value: "disable_shipping_method",
  },
  {
    title: __("Free Shipping", "kirki-ecommerce"),
    value: "set_free_shipping",
  },
];

export const METHOD_SCHEMAS = {
  flat_rate: {
    amount: 0,
    is_taxable: false,
    description: null,
  },

  local_pickup: {
    address: null,
    has_fee: false,
    amount: 0,
    is_taxable: false,
    description: null,
    has_pick_time: false,
    pickup_time_start: null,
    pickup_time_end: null,
  },

  weight: {
    ranges: [],
    amount: 0,
    is_taxable: false,
    description: null,
  },
};
