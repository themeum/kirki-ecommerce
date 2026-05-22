import { configureStore } from "@reduxjs/toolkit";
import productSlice from "./productSlice";
import testSlice from "./testSlice";
import categoriesSlice from "./categoriesSlice";
import tagsSlice from "./tagsSlice";
import brandsSlice from "./brandsSlice";
import collectionsSlice from "./collectionsSlice";
import customersSlice from "./customersSlice";
import productsSlice from "./productsSlice";
import countriesSlice from "./countriesSlice";
import settingsSlice from "./settingsSlice";
import pageSlice from "./pageSlice";
import unsavedSlice from "./unsavedSlice";
import toastSlice from "./toastSlice";
import inventorySlice from "./inventorySlice";
import bulkEditSlice from "./BulkEditSlice";
import attributesSlice from "./attributesSlice";
import currenciesSlice from "./currenciesSlice";
import schemaSlice from "./schemaSlice";

export const store = configureStore({
  reducer: {
    product: productSlice,
    products: productsSlice,
    categories: categoriesSlice,
    tags: tagsSlice,
    brands: brandsSlice,
    collections: collectionsSlice,
    customers: customersSlice,
    countries: countriesSlice,
    test: testSlice,
    settings: settingsSlice,
    pages: pageSlice,
    unsaved: unsavedSlice,
    toast: toastSlice,
    inventory: inventorySlice,
    bulk: bulkEditSlice,
    attributes: attributesSlice,
    currencies: currenciesSlice,
    schema: schemaSlice,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ["toast/showToast"],
        ignoredPaths: ["toast.toasts"],
      },
    }),
});
