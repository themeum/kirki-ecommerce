import Button from '@/components/ui/button';
import {
  EditIcon,
  EmailIcon,
  LocationIcon,
  PhoneIcon,
  TrashIcon,
  TruckIcon,
} from '@/icons';
import ActionGroup from '@/components/ui/action-group';
import Badge from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Flex from '@/components/ui/flex';
import Text from '@/components/ui/text';
import Thumbnail from '@/components/ui/thumbnail';
import { theme } from '@/theme';
import { flexCenter, scoped } from '@/theme/mixins';

const CustomerInfo = () => {
  return (
    <Card css={styles.formCard}>
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
      <Flex gap={8}>
        <span css={styles.svgClass}>
          <Thumbnail
            type="circle"
            src="https://kirki-ecommerce.test/wp-content/uploads/2025/10/Avatar.png"
          />
        </span>
        <Text
          type="secondary"
          header="Oliver Thorne"
          subHeader="oliverthorne@gmail.com"
        />
      </Flex>

      <Flex gap={8} style={{ alignItems: 'flex-start' }}>
        <EmailIcon style={{ opacity: '0.5' }} />
        <Flex direction="column" gap={8}>
          <Text header="pabloesco.@gmail.com" />
          <Badge type="draft" text="Awaiting Verification" />
        </Flex>
      </Flex>

      <Flex gap={8} style={{ alignItems: 'center' }}>
        <span css={styles.svgClass}>
          <PhoneIcon />
        </span>
        <Text header="+1 555-123-4567" />
      </Flex>

      <Flex gap={8} style={{ alignItems: 'flex-start' }}>
        <span style={{ flexShrink: 0 }}>
          <LocationIcon />
        </span>
        <Flex direction="column" gap={8}>
          <Text type="xsm" subHeader="Billing Address" />
          56683 Schmidt Way, 4825 Welch Crossing
          <br />
          Montebello, 65082
        </Flex>
      </Flex>

      <Flex gap={8} style={{ alignItems: 'flex-start' }}>
        <span style={{ flexShrink: 0 }}>
          <TruckIcon style={{ opacity: '0.5' }} />
        </span>
        <Flex direction="column" gap={8}>
          <Text type="xsm" subHeader="Shipping Address" />
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
  formCard: scoped({
    rowGap: theme.spacing['2xl'],
  }),
  headerRow: scoped({
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  }),
  svgClass: scoped(flexCenter()),
};
