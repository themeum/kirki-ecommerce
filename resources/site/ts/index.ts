/**
 * Kirki Ecommerce Site Bundle
 * Front-end JavaScript for product pages, cart, and checkout
 */

// Import the SCSS entry point (Vite will handle this)
// Import Alpine.js
import Alpine from 'alpinejs';

// Import components
import { accountAddresses } from './components/account-addresses';
import { accountDashboard } from './components/account-dashboard';
import { accountDetails } from './components/account-details';
import { addToCart } from './components/add-to-cart';
import { cart } from './components/cart';
import { checkout, stateField } from './components/checkout';
import { form } from './components/form';
import { imageSlider } from './components/image-slider';
import { miniCart } from './components/mini-cart';
import { modal } from './components/modal';
import { popover } from './components/popover';
import { productFilter } from './components/product-filter';
import { quantitySelector } from './components/quantity-selector';
import { shop } from './components/shop';
import { tabs } from './components/tabs';
import { variantSelector } from './components/variant-selector';

import { accountOrders } from './components/account-orders';
import { registerLocalTimeDirective } from './directives/local-time';

import '../scss/index.scss';

// ----------------------------------------------------------------------------
// Alpine.js Registration
// ----------------------------------------------------------------------------

// Register directives
registerLocalTimeDirective(Alpine);

// Register components
Alpine.data('accountAddresses', accountAddresses);
Alpine.data('accountDashboard', accountDashboard);
Alpine.data('accountDetails', accountDetails);
Alpine.data('accountOrders', accountOrders);
Alpine.data('addToCart', addToCart);
Alpine.data('cart', cart);
Alpine.data('productFilter', productFilter);
Alpine.data('imageSlider', imageSlider);
Alpine.data('variantSelector', variantSelector);
Alpine.data('quantitySelector', quantitySelector);
Alpine.data('tabs', tabs);
Alpine.data('checkout', checkout);
Alpine.data('modal', modal);
Alpine.data('popover', popover);
Alpine.data('form', form);
Alpine.data('stateField', stateField);
Alpine.data('shop', shop);
Alpine.data('miniCart', miniCart);

// Initialize Alpine
window.Alpine = Alpine;
Alpine.start();

// ----------------------------------------------------------------------------
// Site initialization
// ----------------------------------------------------------------------------

console.log('Kirki Ecommerce site bundle loaded');

// Initialize stores on page load
document.addEventListener('alpine:init', () => {
  Alpine.store('cartStore').init();
  Alpine.store('wishlistStore').init();
});

// Export any utilities that templates might need
export {};
