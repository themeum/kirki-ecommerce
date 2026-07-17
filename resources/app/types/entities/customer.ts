import type { MediaRef } from '@/schemas/shared/media';
import type { CustomerAddress } from '@/schemas/catalog/customer';

export type {
  Customer,
  CustomerListItem,
  CustomerAddress,
} from '@/schemas/catalog/customer';

type CustomerFormData = {
  id?: number;
  first_name?: string;
  last_name?: string | null;
  email?: string;
  phone?: string | null;
  language?: string;
  accepts_marketing?: boolean;
  photo?: MediaRef | number | null;
  shipping_address?: CustomerAddress | null;
  billing_address?: CustomerAddress | null;
  is_billing_same_as_shipping?: boolean;
  tags?: string[];
};

export type { CustomerFormData };
