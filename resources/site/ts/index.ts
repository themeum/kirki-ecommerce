/**
 * Kirki Ecommerce Site Bundle
 * Front-end JavaScript for product pages, cart, and checkout
 */

// Import the SCSS entry point (Vite will handle this)
import '../scss/index.scss';

// Import Alpine.js
import Alpine from 'alpinejs';

// Import stores
// import { createCartStore } from './components/cart';
import { createWishlistStore } from './components/wishlist';
import { createToastStore } from './components/toast';

// Import components
import { addToCart } from './components/add-to-cart';
import { addToWishlist } from './components/add-to-wishlist';
import { productFilter } from './components/product-filter';
import { imageSlider } from './components/image-slider';
import { variantSelector } from './components/variant-selector';
import { quantitySelector } from './components/quantity-selector';
import { tabs } from './components/tabs';
import { checkout } from './components/checkout';
import { modal } from './components/modal';
import { toastItem } from './components/toast';
import { form } from './components/form';

// ----------------------------------------------------------------------------
// Alpine.js Registration
// ----------------------------------------------------------------------------

// Register global stores
Alpine.store('cartStore', createCartStore());
Alpine.store('wishlistStore', createWishlistStore());
Alpine.store('toastStore', createToastStore());

// Register components
Alpine.data('addToCart', addToCart);
Alpine.data('addToWishlist', addToWishlist);
Alpine.data('productFilter', productFilter);
Alpine.data('imageSlider', imageSlider);
Alpine.data('variantSelector', variantSelector);
Alpine.data('quantitySelector', quantitySelector);
Alpine.data('tabs', tabs);
Alpine.data('checkout', checkout);
Alpine.data('modal', modal);
Alpine.data('toastItem', toastItem);
Alpine.data('form', form);

// Initialize Alpine
window.Alpine = Alpine;
Alpine.start();

// ----------------------------------------------------------------------------
// Site initialization
// ----------------------------------------------------------------------------

console.log('Kirki Ecommerce site bundle loaded');

// Initialize stores on page load
document.addEventListener('alpine:init', () => {
  (Alpine.store('cartStore') as any).init();
  (Alpine.store('wishlistStore') as any).init();
});

// Export any utilities that templates might need
export {};
