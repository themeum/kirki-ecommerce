import { configureStore } from '@reduxjs/toolkit';

import attributesSlice from '@/store/attributesSlice';
import brandsSlice from '@/store/brandsSlice';
import bulkEditSlice from '@/store/BulkEditSlice';
import categoriesSlice from '@/store/categoriesSlice';
import collectionsSlice from '@/store/collectionsSlice';
import countriesSlice from '@/store/countriesSlice';
import currenciesSlice from '@/store/currenciesSlice';
import customersSlice from '@/store/customersSlice';
import inventorySlice from '@/store/inventorySlice';
import pageSlice from '@/store/pageSlice';
import productSlice from '@/store/productSlice';
import productsSlice from '@/store/productsSlice';
import schemaSlice from '@/store/schemaSlice';
import settingsSlice from '@/store/settingsSlice';
import tagsSlice from '@/store/tagsSlice';
import testSlice from '@/store/testSlice';
import toastSlice from '@/store/toastSlice';
import unsavedSlice from '@/store/unsavedSlice';

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
