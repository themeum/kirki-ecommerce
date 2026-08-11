import type { ReactNode } from 'react';

import { CircleDollarIcon, FlameIcon, ShirtIcon, StarIcon } from '@/icons';

type SchemaGroupDetails = Record<
  string,
  {
    title: string;
    icon: ReactNode;
  }
>;

type SchemaOptionItem = {
  heading?: string;
  infoText?: string;
  value?: string;
  title?: string;
  isRequired?: boolean;
  group?: string;
};

type SchemaRequiredFields = Record<string, string[]>;

export const groupDetails: SchemaGroupDetails = {
  Product: {
    title: 'Product',
    icon: <ShirtIcon />,
  },
  Offer: {
    title: 'Offer',
    icon: <CircleDollarIcon />,
  },
  AggregateRating: {
    title: 'AggregateRating',
    icon: <StarIcon />,
  },
  Brand: {
    title: 'Brand',
    icon: <FlameIcon />,
  },
};

export const optionsList: SchemaOptionItem[] = [
  { heading: 'Product', infoText: 'Product' },
  { value: 'name', title: 'name', isRequired: true, group: 'Product' },
  { value: 'description', title: 'description', group: 'Product' },
  { value: 'image', title: 'image', group: 'Product' },
  { heading: 'Offer', infoText: 'Offer' },
  { value: 'price', title: 'price', isRequired: true, group: 'Offer' },
  { value: 'priceCurrency', title: 'priceCurrency', group: 'Offer' },
  { value: 'availability', title: 'availability', group: 'Offer' },
  {
    heading: 'AggregateRating',
    infoText: 'Aggregate Rating',
  },
  { value: 'ratingValue', title: 'ratingValue', group: 'AggregateRating' },
  { value: 'reviewCount', title: 'reviewCount', group: 'AggregateRating' },
  {
    heading: 'Brand',
    infoText: 'Brand',
  },
  { value: 'name', title: 'name', group: 'Brand' },
  { value: 'logo', title: 'logo', group: 'Brand' },
];

export const requiredFields: SchemaRequiredFields = {
  Product: ['name'],
  Offer: ['price'],
};
