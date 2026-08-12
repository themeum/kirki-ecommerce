export { default as BillingAddress } from './pages/customer-details/billing-address';
export { default as CustomerOverview } from './pages/customer-details/customer-overview';
export { default as ShippingAddress } from './pages/customer-details/shipping-address';
export type { Customer, CustomerAddress } from './schemas/catalog/customer';
export { CustomerAddressSchema } from './schemas/catalog/customer';
export type { CustomerFormInput, CustomerFormPayload } from './schemas/forms/customer-form';
export { CustomerFormSchema } from './schemas/forms/customer-form';
export { useCreateCustomerMutation, useCustomerQuery, useCustomersQuery } from './services/customer';
export { customerKeys } from './services/query-keys';
