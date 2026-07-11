import { configureStore } from '@reduxjs/toolkit';

import attributesSlice from './attributesSlice';
import brandsSlice from './brandsSlice';
import bulkEditSlice from './BulkEditSlice';
import categoriesSlice from './categoriesSlice';
import collectionsSlice from './collectionsSlice';
import countriesSlice from './countriesSlice';
import currenciesSlice from './currenciesSlice';
import customersSlice from './customersSlice';
import inventorySlice from './inventorySlice';
import pageSlice from './pageSlice';
import productSlice from './productSlice';
import productsSlice from './productsSlice';
import schemaSlice from './schemaSlice';
import settingsSlice from './settingsSlice';
import tagsSlice from './tagsSlice';
import testSlice from './testSlice';
import toastSlice from './toastSlice';
import unsavedSlice from './unsavedSlice';

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
        ignoredActions: ['toast/showToast'],
        ignoredPaths: ['toast.toasts'],
      },
    }),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
