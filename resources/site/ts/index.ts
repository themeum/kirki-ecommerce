/**
 * Kirki Ecommerce Site Bundle
 * Front-end JavaScript for product pages, cart, and checkout
 */

// Import the SCSS entry point (Vite will handle this)
import "../scss/index.scss";

// Import Alpine.js
import Alpine from "alpinejs";

// Import components
import { addToCart } from "./components/add-to-cart";
import { cart } from "./components/cart";
import { checkout } from "./components/checkout";
import { form } from "./components/form";
import { imageSlider } from "./components/image-slider";
import { modal } from "./components/modal";
import { productFilter } from "./components/product-filter";
import { quantitySelector } from "./components/quantity-selector";
import { tabs } from "./components/tabs";
import { variantSelector } from "./components/variant-selector";
import { shop } from "./components/shop";

// ----------------------------------------------------------------------------
// Alpine.js Registration
// ----------------------------------------------------------------------------

// Register components
Alpine.data("addToCart", addToCart);
Alpine.data("cart", cart);
Alpine.data("productFilter", productFilter);
Alpine.data("imageSlider", imageSlider);
Alpine.data("variantSelector", variantSelector);
Alpine.data("quantitySelector", quantitySelector);
Alpine.data("tabs", tabs);
Alpine.data("checkout", checkout);
Alpine.data("modal", modal);
Alpine.data("form", form);
Alpine.data('shop', shop);

// Initialize Alpine
window.Alpine = Alpine;
Alpine.start();

// ----------------------------------------------------------------------------
// Site initialization
// ----------------------------------------------------------------------------

console.log("Kirki Ecommerce site bundle loaded");

// Initialize stores on page load
document.addEventListener("alpine:init", () => {
  (Alpine.store("cartStore") as any).init();
  (Alpine.store("wishlistStore") as any).init();
});

// Export any utilities that templates might need
export { };

