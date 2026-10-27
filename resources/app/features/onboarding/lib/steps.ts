import type { OnboardingFormInput } from '@/features/onboarding/schemas/forms/onboarding-form';
import { __ } from '@/wpi18n';

type OnboardingStep = 0 | 1 | 2 | 3 | 4;

const TAX_STEP = 3 as const;

const COMPLETION_STEP = 4 as const;

const STEP_FIELDS: Record<Exclude<OnboardingStep, 4>, (keyof OnboardingFormInput)[]> = {
  0: ['store_name', 'industry'],
  1: ['country', 'store_address'],
  2: ['currency', 'is_tax_collected'],
  3: ['is_tax_inclusive_price', 'store_tax_id'],
};

const getFormStepCount = (isTaxCollected: boolean) => (isTaxCollected ? 4 : 3);

const getStepTitle = (step: OnboardingStep): string => {
  const titles: Record<OnboardingStep, string> = {
    0: __('Store Basics', 'kirki-ecommerce'),
    1: __('Business Info', 'kirki-ecommerce'),
    2: __('Essentials', 'kirki-ecommerce'),
    3: __('Store Tax', 'kirki-ecommerce'),
    4: __('Setup Complete', 'kirki-ecommerce'),
  };

  return titles[step];
};

const getIndustryOptions = () => [
  {
    value: 'books-stationery-and-gifts',
    label: __('Books, Stationery & Gifts', 'kirki-ecommerce'),
  },
  { value: 'fashion-and-apparel', label: __('Fashion & Apparel', 'kirki-ecommerce') },
  { value: 'home-decor-and-furniture', label: __('Home Decor & Furniture', 'kirki-ecommerce') },
  {
    value: 'beauty-cosmetics-and-personal-care',
    label: __('Beauty, Cosmetics & Personal Care', 'kirki-ecommerce'),
  },
  { value: 'food-beverage-and-gourmet', label: __('Food, Beverage & Gourmet', 'kirki-ecommerce') },
  {
    value: 'electronics-and-accessories',
    label: __('Electronics & Accessories', 'kirki-ecommerce'),
  },
  { value: 'sports-and-fitness', label: __('Sports & Fitness', 'kirki-ecommerce') },
  { value: 'pet-supplies', label: __('Pet Supplies', 'kirki-ecommerce') },
  { value: 'baby-and-kids', label: __('Baby & Kids', 'kirki-ecommerce') },
  { value: 'jewelry-and-watches', label: __('Jewelry & Watches', 'kirki-ecommerce') },
  {
    value: 'automotive-parts-and-accessories',
    label: __('Automotive Parts & Accessories', 'kirki-ecommerce'),
  },
  { value: 'toys-games-and-hobbies', label: __('Toys, Games & Hobbies', 'kirki-ecommerce') },
  { value: 'health-and-wellness', label: __('Health & Wellness', 'kirki-ecommerce') },
  { value: 'arts-and-crafts-supplies', label: __('Arts & Crafts Supplies', 'kirki-ecommerce') },
  { value: 'musical-instruments', label: __('Musical Instruments', 'kirki-ecommerce') },
  { value: 'other', label: __('Other', 'kirki-ecommerce') },
];

export {
  COMPLETION_STEP,
  getFormStepCount,
  getIndustryOptions,
  getStepTitle,
  type OnboardingStep,
  STEP_FIELDS,
  TAX_STEP,
};
