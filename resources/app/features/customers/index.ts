export { default as CustomerAddressCard } from './components/customer-details/customer-address-card';
export { default as CustomerBasicInfo } from './components/customer-details/customer-basic-info';
export { default as CustomerProfileCard } from './components/customer-profile-card';
export { default as CustomerSelectionField } from './components/fields/customer-selection-field';
export type { Customer, CustomerAddress, CustomerInfo } from './schemas/catalog/customer';
export { CustomerAddressSchema, CustomerInfoSchema } from './schemas/catalog/customer';
export type { CustomerFormInput, CustomerFormPayload } from './schemas/forms/customer-form';
export { CustomerFormSchema } from './schemas/forms/customer-form';
export {
  useCreateCustomerMutation,
  useCustomerQuery,
  useCustomersQuery,
} from './services/customer';
export { customerKeys } from './services/query-keys';
export type { CustomerListFilter } from './types';
export { customerListOptions } from './types';
