import { lazy, Suspense } from "react";
import { createHashRouter } from "react-router";
import Tryouts from "@/Tryouts";
import UnsavedChangesController from "@/floatingComponents/UnsavedTracker";
import LoadingSpinner from "@/components/LoadingSpinner";
import NotFound from "@/Pages/NotFound";

const Products = lazy(() => import("@/Pages/Products"));
const EditProduct = lazy(() => import("@/Pages/Products/EditProduct"));
const BulkEdit = lazy(() => import("@/Pages/BulkEdit"));
const Inventory = lazy(() => import("@/Pages/Inventory"));
const Orders = lazy(() => import("@/Pages/Orders"));
const OrderDetails = lazy(() => import("@/Pages/Orders/OrderDetails"));
const Collections = lazy(() => import("@/Pages/Collections"));
const CollectionDetails = lazy(() => import("@/Pages/Collections/CollectionDetails"));
const Tags = lazy(() => import("@/Pages/Tags"));
const Categories = lazy(() => import("@/Pages/Categories"));
const Brands = lazy(() => import("@/Pages/Brands"));
const Customers = lazy(() => import("@/Pages/Customers"));
const CustomerDetails = lazy(() => import("@/Pages/Customers/CustomerDetails"));
const CustomerGroups = lazy(() => import("@/Pages/Customers/CustomerGroups"));
const Settings = lazy(() => import("@/Pages/Settings"));
const GeneralSettings = lazy(() => import("@/Pages/Settings/GeneralSettings"));
const ProductsSettings = lazy(() => import("@/Pages/Settings/ProductsSettings"));
const PaymentSettings = lazy(() => import("@/Pages/Settings/PaymentSettings"));
const ShippingSettings = lazy(() => import("@/Pages/Settings/ShippingSettings"));
const ShippingZone = lazy(() => import("@/Pages/Settings/ShippingSettings/ShippingZone/ShippingZone"));
const TaxSettings = lazy(() => import("@/Pages/Settings/TaxSettings"));
const EmailSettings = lazy(() => import("@/Pages/Settings/EmailSettings"));
const ShippingDeliveryMethod = lazy(() => import("@/Pages/Settings/ShippingSettings/ShippingMethod/ShippingDeliveryMethod"));
const MultiCurrencySettings = lazy(() => import("@/Pages/Settings/MultiCurrencySettings"));
const CheckoutSettings = lazy(() => import("@/Pages/Settings/CheckoutSettings"));
const EditTemplate = lazy(() => import("@/Pages/Settings/EmailSettings/EditTemplate"));
const GeneralEditRegion = lazy(() => import("@/Pages/Settings/TaxSettings/TaxRegion/GeneralEditRegion"));
const EditRegionEU = lazy(() => import("@/Pages/Settings/TaxSettings/TaxRegion/EditRegionEU"));
const EssentialsSettings = lazy(() => import("@/Pages/Settings/EssentialSettings"));
const ColorVariation = lazy(() => import("@/Pages/Settings/EssentialSettings/VariationLibrary/ColorVariation"));
const ListVariation = lazy(() => import("@/Pages/Settings/EssentialSettings/VariationLibrary/ListVariation"));

const withSuspense = (Component) => (
  <Suspense fallback={<LoadingSpinner />}>
    <Component />
  </Suspense>
);

export const router = createHashRouter([
  {
    element: <UnsavedChangesController />,
    children: [
      { path: "/", element: <Tryouts /> },
      { path: "/products", element: withSuspense(Products) },
      { path: "/products/:id", element: withSuspense(EditProduct) },
      { path: "/variants/bulk", element: withSuspense(BulkEdit) },
      { path: "/inventory", element: withSuspense(Inventory) },
      { path: "/orders", element: withSuspense(Orders) },
      { path: "/orders/:id", element: withSuspense(OrderDetails) },
      { path: "/collections", element: withSuspense(Collections) },
      { path: "/collections/:id", element: withSuspense(CollectionDetails) },
      { path: "/tags", element: withSuspense(Tags) },
      { path: "/categories", element: withSuspense(Categories) },
      { path: "/brands", element: withSuspense(Brands) },
      { path: "/customers", element: withSuspense(Customers) },
      { path: "/customers/:id", element: withSuspense(CustomerDetails) },
      { path: "/customers/groups", element: withSuspense(CustomerGroups) },
      { path: "/settings", element: withSuspense(Settings) },
      { path: "/settings/general", element: withSuspense(GeneralSettings) },
      { path: "/settings/products", element: withSuspense(ProductsSettings) },
      { path: "/settings/payments", element: withSuspense(PaymentSettings) },
      { path: "/settings/shipping", element: withSuspense(ShippingSettings) },
      { path: "/settings/shipping/zone/:zone_Id", element: withSuspense(ShippingZone) },
      { path: "/settings/shipping/delivery-method", element: withSuspense(ShippingDeliveryMethod) },
      {
        path: "/settings/shipping/delivery-method/:methodId/:zoneId",
        element: withSuspense(ShippingDeliveryMethod),
      },
      { path: "/settings/currency", element: withSuspense(MultiCurrencySettings) },
      { path: "/settings/tax", element: withSuspense(TaxSettings) },
      { path: "/settings/tax/region/eu", element: withSuspense(EditRegionEU) },
      { path: "/settings/tax/region/:code", element: withSuspense(GeneralEditRegion) },
      { path: "/settings/email", element: withSuspense(EmailSettings) },
      { path: "/settings/checkout", element: withSuspense(CheckoutSettings) },
      { path: "/settings/email/edit-template", element: withSuspense(EditTemplate) },
      { path: "/settings/essentials", element: withSuspense(EssentialsSettings) },
      { path: "/settings/essential/color/:id", element: withSuspense(ColorVariation) },
      { path: "/settings/essential/list/:id", element: withSuspense(ListVariation) },
      { path: "*", element: <NotFound /> },
    ],
  },
]);
