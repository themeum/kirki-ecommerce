import { HashRouter, Route, RouterProvider, Routes } from "react-router";
import Tryouts from "./Tryouts";
import Products from "./Pages/Products";
import EditProduct from "./Pages/Products/EditProduct";
import Settings from "./Pages/Settings";
import GeneralSettings from "./Pages/Settings/GeneralSettings";
import { Provider } from "react-redux";
import { store } from "./store";
import Orders from "./Pages/Orders";
import OrderDetails from "./Pages/Orders/OrderDetails";
import Collections from "./Pages/Collections";
import CollectionDetails from "./Pages/Collections/CollectionDetails";
import Customers from "./Pages/Customers";
import CustomerDetails from "./Pages/Customers/CustomerDetails";
import Tags from "./Pages/Tags";
import Categories from "./Pages/Categories";
import Brands from "./Pages/Brands";
import CustomerGroups from "./Pages/Customers/CustomerGroups";
import ProductsSettings from "./Pages/Settings/ProductsSettings";
import PaymentSettings from "./Pages/Settings/PaymentSettings";
import ShippingSettings from "./Pages/Settings/ShippingSettings";
import ShippingZone from "./Pages/Settings/ShippingSettings/ShippingZone/ShippingZone";
import TaxSettings from "./Pages/Settings/TaxSettings";
import EmailSettings from "./Pages/Settings/EmailSettings";
import ShippingDeliveryMethod from "./Pages/Settings/ShippingSettings/ShippingMethod/ShippingDeliveryMethod";
import Init from "./Init";
import MultiCurrencySettings from "./Pages/Settings/MultiCurrencySettings";
import CheckoutSettings from "./Pages/Settings/CheckoutSettings";
import EditTemplate from "./Pages/Settings/EmailSettings/EditTemplate";
import UnsavedChangesController from "./floatingComponents/UnsavedTracker";
import ToastController from "./floatingComponents/ToastController";
import GeneralEditRegion from "./Pages/Settings/TaxSettings/TaxRegion/GeneralEditRegion";
import EditRegionEU from "./Pages/Settings/TaxSettings/TaxRegion/EditRegionEU";
import BulkEdit from "./Pages/BulkEdit";
import Inventory from "./Pages/Inventory";
import EssentialsSettings from "./Pages/Settings/EssentialSettings";
import { useEffect } from "react";
import ColorVariation from "./Pages/Settings/EssentialSettings/VariationLibrary/ColorVariation";
import ListVariation from "./Pages/Settings/EssentialSettings/VariationLibrary/ListVariation";

const App = () => {
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", "light");
  }, []);

  return (
    <Provider store={store}>
      <Init>
        <HashRouter basename="/">
          <ToastController />
          <Routes>
            <Route element={<UnsavedChangesController />}>
              <Route path="/" element={<Tryouts />} />
              <Route path="/products" element={<Products />} />
              <Route path="/products/:id" element={<EditProduct />} />
              <Route path="/variants/bulk" element={<BulkEdit />} />
              <Route path="/inventory" element={<Inventory />} />
              <Route path="/orders" element={<Orders />} />
              <Route path="/orders/:id" element={<OrderDetails />} />
              <Route path="/collections" element={<Collections />} />
              <Route path="/collections/:id" element={<CollectionDetails />} />
              <Route path="/tags" element={<Tags />} />
              <Route path="/categories" element={<Categories />} />
              <Route path="/brands" element={<Brands />} />
              <Route path="/customers" element={<Customers />} />
              <Route path="/customers/:id" element={<CustomerDetails />} />
              <Route path="/customers/groups" element={<CustomerGroups />} />
              <Route path="/settings" element={<Settings />} />
              <Route path="/settings/general" element={<GeneralSettings />} />
              <Route path="/settings/products" element={<ProductsSettings />} />
              <Route path="/settings/payments" element={<PaymentSettings />} />
              <Route path="/settings/shipping" element={<ShippingSettings />} />
              <Route
                path="/settings/shipping/zone/:zone_Id"
                element={<ShippingZone />}
              />
              <Route
                path="/settings/shipping/delivery-method"
                element={<ShippingDeliveryMethod />}
              />
              <Route
                path="/settings/shipping/delivery-method/:methodId/:zoneId"
                element={<ShippingDeliveryMethod />}
              />

              <Route
                path="/settings/currency"
                element={<MultiCurrencySettings />}
              />
              <Route path="/settings/tax" element={<TaxSettings />} />
              <Route
                path="/settings/tax/region/eu"
                element={<EditRegionEU />}
              />
              <Route
                path="/settings/tax/region/:code"
                element={<GeneralEditRegion />}
              />
              <Route path="/settings/email" element={<EmailSettings />} />
              <Route path="/settings/checkout" element={<CheckoutSettings />} />
              <Route
                path="/settings/email/edit-template"
                element={<EditTemplate />}
              />
              <Route
                path="/settings/essentials"
                element={<EssentialsSettings />}
              />
              <Route
                path="/settings/essential/color/:id"
                element={<ColorVariation />}
              />
              <Route
                path="/settings/essential/list/:id"
                element={<ListVariation />}
              />
            </Route>
          </Routes>
        </HashRouter>
      </Init>
    </Provider>
  );
};

export default App;

function resetActiveMenu(root) {
  const activeMenus = root.querySelectorAll("& > ul > li.current");

  for (const menu of [...activeMenus]) {
    menu.classList.remove("current");
  }
}

function getLeadingRouteHash(hash) {
  const hashParts = hash.split("/");
  return hashParts.slice(0, 2).join("/");
}

function checkActiveSubmenu(root) {
  const searchParams = new URLSearchParams(window.location.search);

  if (searchParams.has("page") && searchParams.get("page") === "ecommerce") {
    const hash = getLeadingRouteHash(window.location.hash || "#");

    const currentUrl = `admin.php?page=ecommerce${hash}`;
    const menuItems = [...root.querySelectorAll("& > ul > li")];

    for (const menuItem of menuItems) {
      const link = menuItem.querySelector("& > a")?.getAttribute("href");
      if (link === currentUrl) {
        menuItem.classList.add("current");
      }
    }
  }
}

document.addEventListener("DOMContentLoaded", () => {
  const ecommerceAdminMenu = document.getElementById("toplevel_page_ecommerce");
  if (!ecommerceAdminMenu) {
    return;
  }

  resetActiveMenu(ecommerceAdminMenu);
  checkActiveSubmenu(ecommerceAdminMenu);

  const menuItems = [
    ...ecommerceAdminMenu.querySelectorAll(
      "& > ul > li:not(:has(.gf-menu-separator))"
    ),
  ];

  for (const menuItem of menuItems) {
    menuItem.addEventListener("click", (event) => {
      event.preventDefault();
      const url = event.target.closest("a")?.getAttribute("href");
      resetActiveMenu(ecommerceAdminMenu);
      menuItem.classList.add("current");
      if (url) {
        if (event.metaKey || event.ctrlKey) {
          window.open(url, "_blank");
        } else {
          window.location.href = url;
        }
      }
    });
  }
});

window.addEventListener("popstate", () => {
  const ecommerceAdminMenu = document.getElementById("toplevel_page_ecommerce");
  if (!ecommerceAdminMenu) {
    return;
  }

  resetActiveMenu(ecommerceAdminMenu);
  checkActiveSubmenu(ecommerceAdminMenu);
});
