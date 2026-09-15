import { stemWord } from './tokenizer.mjs';

export const CONCEPT_PREFIX = '~';

const CONCEPT_GROUPS = {
  store: ['store', 'shop', 'business', 'merchant', 'storefront', 'company'],
  logo: ['logo', 'brand', 'image', 'icon', 'picture', 'media', 'upload'],
  email: [
    'email', 'mail', 'inbox', 'sender', 'smtp', 'recipient', 'correspondence',
    'newsletter',
  ],
  phone: ['phone', 'telephone', 'mobile', 'contact', 'call'],
  address: [
    'address', 'location', 'street', 'city', 'postcode', 'zip', 'postal',
    'country', 'state', 'province', 'place',
  ],
  selling: [
    'selling', 'sell', 'market', 'marketing', 'territory', 'availability',
    'audience', 'reach',
  ],
  order: ['order', 'purchase', 'transaction', 'sale', 'booking'],
  invoice: ['invoice', 'receipt', 'bill', 'billing', 'statement', 'slip'],
  identifier: [
    'id', 'identifier', 'number', 'prefix', 'suffix', 'sequence', 'code',
    'reference', 'numbering',
  ],
  product: [
    'product', 'item', 'goods', 'merchandise', 'catalog', 'catalogue',
    'listing', 'inventory',
  ],
  review: ['review', 'rating', 'feedback', 'comment', 'testimonial', 'star'],
  unit: [
    'unit', 'measure', 'measurement', 'weight', 'dimension', 'size',
    'standard', 'metric', 'imperial', 'volume', 'length',
  ],
  barcode: ['barcode', 'sku', 'upc', 'ean', 'gtin', 'isbn', 'scan', 'label'],
  variation: [
    'variation', 'variant', 'attribute', 'swatch', 'combination', 'library',
    'matrix',
  ],
  color: ['color', 'colour', 'swatch', 'palette', 'shade', 'hue'],
  shipping: [
    'shipping', 'shipment', 'ship', 'delivery', 'deliver', 'dispatch',
    'fulfilment', 'fulfillment', 'postage', 'courier', 'carrier', 'freight',
    'logistics',
  ],
  zone: ['zone', 'region', 'area', 'territory', 'coverage', 'destination'],
  pickup: ['pickup', 'collect', 'collection', 'local'],
  box: ['box', 'package', 'packaging', 'parcel', 'container', 'carton'],
  currency: [
    'currency', 'money', 'cash', 'exchange', 'conversion', 'convert', 'forex',
    'denomination', 'symbol',
  ],
  price: [
    'price', 'pricing', 'cost', 'amount', 'value', 'rate', 'charge', 'fee',
    'money', 'tariff',
  ],
  tax: ['tax', 'vat', 'levy', 'duty', 'gst', 'taxation', 'withholding', 'tariff'],
  payment: [
    'payment', 'pay', 'gateway', 'card', 'stripe', 'paypal', 'transaction',
    'billing', 'money', 'payout',
  ],
  refund: [
    'refund', 'return', 'reimburse', 'repay', 'chargeback', 'money', 'back',
    'cancel', 'cancellation',
  ],
  checkout: ['checkout', 'cart', 'basket', 'buy', 'purchase', 'order'],
  guest: [
    'guest', 'anonymous', 'visitor', 'unregistered', 'without', 'login',
    'signin', 'account',
  ],
  account: [
    'account', 'customer', 'user', 'profile', 'login', 'register',
    'registration', 'signup', 'member', 'shopper', 'buyer',
  ],
  legal: [
    'legal', 'term', 'policy', 'privacy', 'condition', 'agreement',
    'compliance', 'gdpr', 'disclaimer', 'consent',
  ],
  page: ['page', 'screen', 'url', 'link', 'slug', 'permalink'],
  template: [
    'template', 'layout', 'design', 'theme', 'appearance', 'style', 'format',
  ],
  notification: [
    'notification', 'notify', 'alert', 'reminder', 'message', 'confirmation',
    'email',
  ],
  toggle: [
    'enable', 'disable', 'toggle', 'allow', 'permit', 'activate', 'deactivate',
    'turn', 'switch', 'off',
  ],
  validation: [
    'required', 'mandatory', 'optional', 'validation', 'validate', 'require',
    'rule',
  ],
  advanced: ['advanced', 'expert', 'developer', 'debug', 'experimental'],
  general: [
    'general', 'basic', 'essential', 'default', 'common', 'setting',
    'configuration', 'configure', 'preference', 'option',
  ],
  limit: [
    'limit', 'maximum', 'minimum', 'threshold', 'cap', 'restrict',
    'restriction', 'range',
  ],
  discount: [
    'discount', 'coupon', 'promotion', 'promo', 'offer', 'deal', 'voucher',
    'marketing', 'campaign',
  ],
  stock: ['stock', 'quantity', 'availability', 'warehouse', 'backorder'],
};

const buildIndex = () => {
  const index = new Map();

  for (const [concept, terms] of Object.entries(CONCEPT_GROUPS)) {
    const conceptId = `${CONCEPT_PREFIX}${concept}`;

    for (const term of terms) {
      const stem = stemWord(term);
      const existing = index.get(stem);

      if (existing) {
        if (!existing.includes(conceptId)) {
          existing.push(conceptId);
        }
        continue;
      }

      index.set(stem, [conceptId]);
    }
  }

  return index;
};

const buildConceptStems = () => {
  const stems = new Map();

  for (const [concept, terms] of Object.entries(CONCEPT_GROUPS)) {
    stems.set(
      `${CONCEPT_PREFIX}${concept}`,
      [...new Set(terms.map(stemWord))],
    );
  }

  return stems;
};

const conceptIndex = buildIndex();
const conceptStems = buildConceptStems();

export const conceptsForStem = (stem) => {
  return conceptIndex.get(stem) ?? [];
};

export const stemsForConcept = (conceptId) => {
  return conceptStems.get(conceptId) ?? [];
};

export const isConceptId = (term) => {
  return String(term ?? '').startsWith(CONCEPT_PREFIX);
};
