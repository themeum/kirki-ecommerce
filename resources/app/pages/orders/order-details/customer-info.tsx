import ActionGroup from '@/components/ui/action-group';
import Badge from '@/components/ui/badge';
import Button from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Flex from '@/components/ui/flex';
import Text from '@/components/ui/text';
import Thumbnail from '@/components/ui/thumbnail';
import {
  EditIcon,
  EmailIcon,
  LocationIcon,
  PhoneIcon,
  TrashIcon,
  TruckIcon,
} from '@/icons';
import { cardStyles } from '@/theme/card-styles';
import { flexCenter, scoped } from '@/theme/mixins';

const CustomerInfo = () => {
  return (
    <Card css={cardStyles.formCard}>
      <CardHeader css={styles.headerRow}>
        <CardTitle>Customer</CardTitle>
        <ActionGroup>
          <Button variant="secondary" size="icon" aria-label="Delete">
            <TrashIcon />
          </Button>
          <Button variant="secondary" size="icon" aria-label="Edit">
            <EditIcon />
          </Button>
        </ActionGroup>
      </CardHeader>
      <CardContent>
        <Flex gap={2}>
          <span css={styles.svgClass}>
            <Thumbnail
              type="circle"
              src="https://kirki-ecommerce.test/wp-content/uploads/2025/10/Avatar.png"
            />
          </span>
          <Flex direction="column" gap={2}>
            <Text weight="medium">Oliver Thorne</Text>
            <Text variant="small" color="secondary">oliverthorne@gmail.com</Text>
          </Flex>
        </Flex>

        <Flex gap={2} align="flex-start">
          <EmailIcon style={{ opacity: '0.5' }} />
          <Flex direction="column" gap={2}>
            <Text>pabloesco.@gmail.com</Text>
            <Badge variant="secondary">Awaiting Verification</Badge>
          </Flex>
        </Flex>

        <Flex gap={2} align="center">
          <span css={styles.svgClass}>
            <PhoneIcon />
          </span>
          <Text>+1 555-123-4567</Text>
        </Flex>

        <Flex gap={2} align="flex-start">
          <span style={{ flexShrink: 0 }}>
            <LocationIcon />
          </span>
          <Flex direction="column" gap={2}>
            <Text variant="small" color="subdued">Billing Address</Text>
            56683 Schmidt Way, 4825 Welch Crossing
            <br />
            Montebello, 65082
          </Flex>
        </Flex>

        <Flex gap={2} align="flex-start">
          <span style={{ flexShrink: 0 }}>
            <TruckIcon style={{ opacity: '0.5' }} />
          </span>
          <Flex direction="column" gap={2}>
            <Text variant="small" color="subdued">Shipping Address</Text>
            56683 Schmidt Way, 4825 Welch Crossing
            <br />
            Montebello, 65082
          </Flex>
        </Flex>
      </CardContent>
    </Card>
  );
};

export default CustomerInfo;

const styles = {
  headerRow: scoped({
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  }),
  svgClass: scoped(flexCenter())
};
