import { store } from "../store";
import { showToast } from "../store/toastSlice";

import { format, isValid, parse, formatDistanceToNow } from "date-fns";

export const dateFormatter = (value, type = "date") => {
  if (!value) return "";

  let date;
  if (typeof value === "string") {
    date = parse(value, "yyyy-MM-dd HH:mm:ss", new Date());
  } else {
    date = new Date(value);
  }
  if (!isValid(date)) return "";

  if (type === "relative") {
    return formatDistanceToNow(date, { addSuffix: true });
  }
  const formatMap = {
    date: "yyyy-MM-dd",
    time: "HH:mm:ss",
    datetime: "yyyy-MM-dd, HH:mm:ss",
    readable: "MMMM d, yyyy",
  };
  return format(date, formatMap[type] || formatMap.date);
};

export const makeSuggestionList = (data = [], selectedValues = []) => {
  const suggestionList = data
    .filter((item) => !selectedValues.some((s) => s.value === item.id))
    .map((item) => ({
      value: item.id,
      title: item.name || item.title,
    }));

  return suggestionList;
};

export const dispatchToastMessage = (variant = "success", config = {}) => {
  const { title, duration, undoAction, onSuccess } = config;
  store.dispatch(
    showToast({
      title,
      variant,
      duration,
      undoAction,
      onSuccess,
    })
  );
};
export const calculateProfit = (fieldName, data) => {
  if ((data.price || data.sale_price) && data.cost_of_goods) {
    const effectivePrice = data.sale_price || data.price;
    const profit = effectivePrice - data.cost_of_goods;
    if (fieldName === "margin") {
      const profitPercentage = (profit / effectivePrice) * 100;
      return profitPercentage.toFixed(2);
    }
    return profit.toFixed(2);
  }
};

export const normalizeErrors = (errorObj = {}) => {
  const normalized = {};

  Object.entries(errorObj).forEach(([key, value]) => {
    const fieldName = key.split(".").pop();
    normalized[fieldName] = value;
  });

  return normalized;
};
