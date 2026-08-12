import Flex from '@/components/ui/flex';
import Text from '@/components/ui/text';
import Thumbnail from '@/components/ui/thumbnail';
import { LocationIcon, PhoneIcon, TruckIcon } from '@/icons';
import type { AddressLines } from '@/pages/orders/order-create/config/customer-address';
import { theme } from '@/theme';
import { defineStyles, flexCenter, scoped } from '@/theme/mixins';
import type { MediaRef } from '@/types';
import { __ } from '@/wpi18n';

type CustomerSummaryProps = {
  name: string;
  email?: string | null;
  phone?: string | null;
  photo?: MediaRef | null;
  billingAddress?: AddressLines | null;
  shippingAddress?: AddressLines | null;
};

const getInitials = (name: string): string =>
  name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join('');

const CustomerSummary = ({
  name,
  email,
  phone,
  photo,
  billingAddress,
  shippingAddress,
}: CustomerSummaryProps) => {
  return (
    <Flex direction="column" gap={4}>
      <Flex gap={2} align="center">
        {photo?.url ? (
          <Thumbnail type="circle" src={photo.url} alt={name} />
        ) : (
          <div css={scoped(styles.initialsAvatar)}>{getInitials(name)}</div>
        )}
        <Flex direction="column" gap={2}>
          <Text weight="medium">{name}</Text>
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
            <PhoneIcon />
          </span>
          <Text>{phone}</Text>
        </Flex>
      )}

      {billingAddress && (
        <Flex gap={2} align="flex-start">
          <span css={scoped(styles.iconSlot)}>
            <LocationIcon />
          </span>
          <Flex direction="column" gap={2}>
            <Text variant="small" color="subdued">
              {__('Billing Address', 'kirki-ecommerce')}
            </Text>
            <Text variant="small">
              {billingAddress.line1}
              <br />
              {billingAddress.line2}
            </Text>
          </Flex>
        </Flex>
      )}

      {shippingAddress && (
        <Flex gap={2} align="flex-start">
          <span css={scoped(styles.iconSlot)}>
            <TruckIcon style={{ opacity: 0.5 }} />
          </span>
          <Flex direction="column" gap={2}>
            <Text variant="small" color="subdued">
              {__('Shipping Address', 'kirki-ecommerce')}
            </Text>
            <Text variant="small">
              {shippingAddress.line1}
              <br />
              {shippingAddress.line2}
            </Text>
          </Flex>
        </Flex>
      )}
    </Flex>
  );
};

CustomerSummary.displayName = 'CustomerSummary';

export default CustomerSummary;

const styles = defineStyles({
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
