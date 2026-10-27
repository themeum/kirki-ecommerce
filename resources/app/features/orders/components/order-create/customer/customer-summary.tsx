import { Copy, MapPin, Phone, Plus, TriangleAlertIcon, Truck } from 'lucide-react';
import { useState } from 'react';
import { useFormContext } from 'react-hook-form';

import Button from '@/components/ui/button';
import Flex from '@/components/ui/flex';
import Text from '@/components/ui/text';
import NewAddressDialog from '@/features/orders/components/order-create/customer/new-address-dialog';
import type { AddressLines } from '@/features/orders/lib/customer-address';
import type { OrderAddressFormPayload } from '@/features/orders/schemas/forms/order-address-form';
import type { OrderFormInput } from '@/features/orders/schemas/forms/order-form';
import { theme } from '@/theme';
import { defineStyles, flexCenter, scoped } from '@/theme/mixins';
import { copyToClipboard } from '@/utils';
import { isDefined } from '@/utils/object';
import { __ } from '@/wpi18n';

const handleCopyAddress = (address: AddressLines) => {
  void copyToClipboard([address.line1, address.line2].filter(Boolean).join(', '));
};

type CustomerSummaryProps = {
  firstName: string;
  lastName: string;
  email?: string | null;
  phone?: string | null;
  addresses?: {
    billing: AddressLines | null;
    shipping: AddressLines | null;
  };
  readonly?: boolean;
};

const getInitials = (name: string): string =>
  name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join('');

const CustomerSummary = ({
  firstName,
  lastName,
  email,
  phone,
  addresses,
  readonly = false,
}: CustomerSummaryProps) => {
  const form = useFormContext<OrderFormInput>();
  const [addressDialogOpen, setAddressDialogOpen] = useState(false);
  const fullName = [firstName, lastName].filter(Boolean).join(' ');
  const handleAddressSave = (address: OrderAddressFormPayload) => {
    form.setValues(
      {
        shipping_first_name: address.first_name,
        shipping_last_name: address.last_name,
        shipping_address_line1: address.address_line1,
        shipping_address_line2: address.address_line2,
        shipping_city: address.city,
        shipping_state: address.state,
        shipping_postal_code: address.postal_code,
        shipping_country: address.country,
        shipping_phone: address.phone,
        shipping_email: address.email,
        is_billing_same_as_shipping: true,
        billing_first_name: address.first_name,
        billing_last_name: address.last_name,
        billing_address_line1: address.address_line1,
        billing_address_line2: address.address_line2,
        billing_city: address.city,
        billing_state: address.state,
        billing_postal_code: address.postal_code,
        billing_country: address.country,
        billing_phone: address.phone,
        billing_email: address.email,
      },
      {
        shouldDirty: true,
      },
    );
  };
  return (
    <Flex direction="column" gap={4}>
      <Flex gap={2} align="center">
        <div css={scoped(styles.initialsAvatar)}>{getInitials(fullName)}</div>
        <Flex direction="column" gap={1}>
          <Text weight="medium">{fullName}</Text>
          {email && (
            <Text variant="small" color="secondary">
              {email}
            </Text>
          )}
        </Flex>
      </Flex>

      {phone && (
        <Flex gap={2} align="center">
          <span css={scoped(styles.iconSlot)}>
            <Phone size={16} color={theme.colors.text.secondary} style={{ opacity: 0.5 }} />
          </span>
          <Text>{phone}</Text>
        </Flex>
      )}

      {isDefined(addresses) ? (
        <>
          {isDefined(addresses.billing) && (
            <Flex gap={2} align="flex-start" cssOverride={styles.hoverParent}>
              <span css={scoped(styles.iconSlot)}>
                <MapPin size={16} color={theme.colors.text.secondary} style={{ opacity: 0.5 }} />
              </span>
              <Flex direction="column" gap={2} cssOverride={styles.addressContent}>
                <Text variant="tiny" color="secondary">
                  {__('Billing Address', 'kirki-ecommerce')}
                </Text>
                <Text variant="small">
                  {addresses.billing.line1}
                  <br />
                  {addresses.billing.line2}
                </Text>
              </Flex>
              <Button
                variant="ghost"
                size="icon"
                aria-label={__('Copy billing address', 'kirki-ecommerce')}
                onClick={() => handleCopyAddress(addresses.billing!)}
                data-hover-address="true"
                cssOverride={{ ...styles.hoverReveal, color: theme.colors.icon.primary }}
              >
                <Copy size={16} color={theme.colors.icon.secondary} style={{ opacity: 0.5 }} />
              </Button>
            </Flex>
          )}

          {isDefined(addresses.shipping) && (
            <Flex gap={2} align="flex-start" cssOverride={styles.hoverParent}>
              <span css={scoped(styles.iconSlot)}>
                <Truck size={16} color={theme.colors.text.secondary} style={{ opacity: 0.5 }} />
              </span>
              <Flex direction="column" gap={2} cssOverride={styles.addressContent}>
                <Text variant="tiny" color="secondary">
                  {__('Shipping Address', 'kirki-ecommerce')}
                </Text>
                <Text variant="small">
                  {addresses.shipping.line1}
                  <br />
                  {addresses.shipping.line2}
                </Text>
              </Flex>
              <Button
                variant="ghost"
                size="icon"
                aria-label={__('Copy shipping address', 'kirki-ecommerce')}
                onClick={() => handleCopyAddress(addresses.shipping!)}
                data-hover-address="true"
                cssOverride={styles.hoverReveal}
              >
                <Copy size={16} color={theme.colors.icon.secondary} style={{ opacity: 0.5 }} />
              </Button>
            </Flex>
          )}
        </>
      ) : (
        !readonly && (
          <Flex direction="column" gap={4} align="flex-start">
            <Flex gap={2} align="center">
              <TriangleAlertIcon size={16} color={theme.colors.icon.critical} />
              <Text variant="tiny" color="critical">
                {__('Missing Delivery Address', 'kirki-ecommerce')}
              </Text>
            </Flex>
            <Button
              size="sm"
              variant="link"
              cssOverride={{ color: theme.colors.text.emphasis }}
              onClick={() => setAddressDialogOpen(true)}
            >
              <Plus size={16} />
              {__('Add Address', 'kirki-ecommerce')}
            </Button>
            {addressDialogOpen && (
              <NewAddressDialog
                open
                onOpenChange={setAddressDialogOpen}
                onSave={handleAddressSave}
                firstName={firstName}
                lastName={lastName}
                email={email}
                phone={phone}
              />
            )}
          </Flex>
        )
      )}
    </Flex>
  );
};

CustomerSummary.displayName = 'CustomerSummary';

export default CustomerSummary;

const styles = defineStyles({
  addressContent: {
    flex: 1,
  },
  hoverParent: {
    '&:hover [data-hover-address]': {
      visibility: 'visible',
    },
  },
  hoverReveal: {
    visibility: 'hidden',
  },
  initialsAvatar: {
    ...flexCenter(),
    width: '40px',
    height: '40px',
    borderRadius: theme.radius.full,
    backgroundColor: theme.colors.background.surfaceAlt,
    color: theme.colors.text.secondary,
    fontWeight: theme.typography.fontWeight.medium,
    flexShrink: 0,
  },
  iconSlot: scoped(flexCenter()),
});
