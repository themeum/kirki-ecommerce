import ActionGroup from '@/components/ui/action-group';
import { Card, CardContent } from '@/components/ui/card';
import Container from '@/components/ui/container';
import Flex from '@/components/ui/flex';
import Skeleton from '@/components/ui/skeleton';
import {
  StackedItem,
  StackedItemActions,
  StackedItemContent,
  StackedItemMedia,
  StackedItems,
} from '@/components/ui/stacked-items';
import SettingsPageHeader from '@/features/settings/pages/settings-page-header';
import { PaymentIcon } from '@/icons/common';
import { theme } from '@/theme';
import { cardStyles } from '@/theme/card-styles';
import { defineStyles } from '@/theme/mixins';
import { __ } from '@/wpi18n';

const nameWidths = [128, 148, 116];

const PaymentSettingsSkeleton = () => (
  <Container size="sm">
    <Flex direction="column" gap={4} aria-busy="true">
      <SettingsPageHeader icon={<PaymentIcon />} title={__('Payments', 'kirki-ecommerce')} />

      <Card cssOverride={cardStyles.formCard}>
        <CardContent>
          <Flex direction="column" gap={4}>
            <Flex gap={2} align="flex-start">
              <Flex direction="column" gap={1}>
                <Skeleton width={136} height={20} />
                <Skeleton width={296} height={16} />
              </Flex>
              <ActionGroup>
                <Skeleton width={64} height={28} />
              </ActionGroup>
            </Flex>

            <StackedItems>
              {nameWidths.map((width, index) => (
                <StackedItem key={index} id={`payment-method-skeleton-${index}`}>
                  <StackedItemMedia>
                    <Skeleton width={16} height={16} radius="sm" />
                  </StackedItemMedia>
                  <StackedItemContent>
                    <Skeleton width={width} height={14} />
                  </StackedItemContent>
                  <StackedItemActions cssOverride={styles.actions}>
                    <Skeleton width={32} height={16} radius="full" />
                  </StackedItemActions>
                </StackedItem>
              ))}
            </StackedItems>
          </Flex>
        </CardContent>
      </Card>
    </Flex>
  </Container>
);

PaymentSettingsSkeleton.displayName = 'PaymentSettingsSkeleton';

export default PaymentSettingsSkeleton;

const styles = defineStyles({
  actions: {
    height: theme.spacing[7],
  },
});
