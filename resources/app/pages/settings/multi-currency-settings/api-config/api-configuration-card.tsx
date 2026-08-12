import { type Dispatch, type SetStateAction } from 'react';

import Badge from '@/components/ui/badge';
import Button from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import Flex from '@/components/ui/flex';
import ProgressBar from '@/components/ui/progressbar';
import Text from '@/components/ui/text';
import { EditIcon, FlagIcon, RadioTickIcon } from '@/icons';
import { dateFormatter } from '@/pages/utils';
import type { CurrencySettings } from '@/schemas/catalog/settings';
import { theme } from '@/theme';
import { defineStyles } from '@/theme/mixins';
import { toDisplayString } from '@/utils/string';
import { __, sprintf } from '@/wpi18n';

type ApiConfigData = {
  api_key?: string;
  update_frequency?: string;
  fallback_behaviour?: string;
  is_cache_enabled?: boolean;
  [key: string]: unknown;
};

type ApiConfigurationCardProps = {
  selectedAPI: string;
  apiConfigObj: ApiConfigData;
  setOpenPopup: Dispatch<SetStateAction<boolean>>;
  dataObj: CurrencySettings;
};

const ApiConfigurationCard = ({
  selectedAPI,
  apiConfigObj,
  setOpenPopup,
  dataObj,
}: ApiConfigurationCardProps) => {
  const formatValue = (value: unknown) =>
    toDisplayString(value)
      .replace(/_/g, ' ')
      .replace(/\b\w/g, (char) => char.toUpperCase());

  const usage = dataObj?.usage;

  return (
    <Card>
      <CardContent>
        <Flex direction="column" gap={5}>
          <Flex
            justify="space-between" align="flex-start">
            <Flex direction="column" gap={2}>
              <Flex gap={2} align="center">
                <FlagIcon />
                <Text weight="semibold">{selectedAPI}</Text>
                <Badge variant="success">
                  <span data-icon="inline-start" aria-hidden="true">
                    <RadioTickIcon />
                  </span>
                  Configured
                </Badge>
              </Flex>
              <Text color="secondary">{sprintf(
                  __(`Last tested: %s`, 'kirki-ecommerce'),
                  dateFormatter(dataObj?.last_sync_at, 'datetime'),
                )}</Text>
            </Flex>
            <Button
              variant="outline"
              size="icon"
              onClick={() => setOpenPopup(true)}
            >
              <EditIcon />
            </Button>
          </Flex>
          {usage && usage !== null && (
            <Flex direction="column" gap={2}>
              <ProgressBar
                value={Number(usage?.used)}
                showProgressIndicator={false}
                style={{ gap: '10px' }}
                progressBarColor={theme.primitives.colors.gray16}
                label={__('API Usage', 'kirki-ecommerce')}
                rightText={sprintf(
                  __('%d/%d', 'kirki-ecommerce'),
                  usage?.used ?? 0,
                  usage?.total ?? 0,
                )}
              />
              <Text style={{ color: theme.primitives.colors.gray12 }}>{sprintf(
                  __('Resets on %s', 'kirki-ecommerce'),
                  dateFormatter(dataObj?.next_sync_at),
                )}</Text>
            </Flex>
          )}
          <Card cssOverride={styles.innerDarkCard}>
            <CardContent cssOverride={styles.innerDarkContent}>
              <Flex gap={1}>
                <Text style={{ color: theme.primitives.colors.gray12 }}>{__('Fallback Behavior: ', 'kirki-ecommerce')}</Text>
                <Text>{formatValue(apiConfigObj?.fallback_behaviour)}</Text>
              </Flex>
              <Flex gap={1}>
                <Text style={{ color: theme.primitives.colors.gray12 }}>{__('Update Frequency: ', 'kirki-ecommerce')}</Text>
                <Text>{formatValue(apiConfigObj?.update_frequency)}</Text>
              </Flex>
            </CardContent>
          </Card>
        </Flex>
      </CardContent>
    </Card>
  );
};

ApiConfigurationCard.displayName = 'ApiConfigurationCard';

export default ApiConfigurationCard;

const styles = defineStyles({
  innerDarkCard: {
    borderRadius: theme.radius.sm,
    backgroundColor: theme.colors.background.surfaceSecondary,
    border: 'none',
    padding: theme.spacing[0],
  },
  innerDarkContent: {
    display: 'flex',
    flexDirection: 'column',
    gap: theme.spacing[1],
    padding: theme.spacing[2],
  },
});
