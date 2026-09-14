import { type Dispatch, type SetStateAction } from 'react';
import { useFormContext, useWatch } from 'react-hook-form';

import Badge from '@/components/ui/badge';
import Button from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import Flex from '@/components/ui/flex';
import ProgressBar from '@/components/ui/progressbar';
import Text from '@/components/ui/text';
import type { MultiCurrencySettingsFormInput } from '@/features/settings/multi-currency/schemas/forms/multi-currency-settings-form';
import { EditIcon, FlagIcon, RadioTickIcon } from '@/icons';
import type { CurrencySettings } from '@/schemas/catalog/settings';
import { theme } from '@/theme';
import { defineStyles } from '@/theme/mixins';
import { dateFormatter } from '@/utils/common';
import { toDisplayString } from '@/utils/string';
import { __, sprintf } from '@/wpi18n';

type ApiConfigurationCardProps = {
  providerName: string;
  setOpenPopup: Dispatch<SetStateAction<boolean>>;
  currencySettings?: CurrencySettings | null;
};

const ApiConfigurationCard = ({
  providerName,
  setOpenPopup,
  currencySettings,
}: ApiConfigurationCardProps) => {
  const { control } = useFormContext<MultiCurrencySettingsFormInput>();
  const formatValue = (value: unknown) =>
    toDisplayString(value)
      .replace(/_/g, ' ')
      .replace(/\b\w/g, (char) => char.toUpperCase());

  const apiConfig = useWatch({
    control,
    name: 'api_config',
  });

  const usage = currencySettings?.usage;

  return (
    <Card>
      <CardContent>
        <Flex direction="column" gap={5}>
          <Flex justify="space-between" align="flex-start">
            <Flex direction="column" gap={2}>
              <Flex gap={2} align="center">
                <FlagIcon />
                <Text weight="semibold">{providerName}</Text>
                <Badge variant="success">
                  <span data-icon="inline-start" aria-hidden="true">
                    <RadioTickIcon />
                  </span>
                  {__('Configured', 'kirki-ecommerce')}
                </Badge>
              </Flex>
              <Text color="secondary" variant="small">
                {sprintf(
                  __(`Last tested: %s`, 'kirki-ecommerce'),
                  dateFormatter(currencySettings?.last_sync_at, 'datetime'),
                )}
              </Text>
            </Flex>
            <Button variant="outline" size="icon" onClick={() => setOpenPopup(true)}>
              <EditIcon />
            </Button>
          </Flex>
          {usage && usage !== null && (
            <Flex direction="column" gap={2}>
              <ProgressBar
                value={Number(usage?.used)}
                showProgressIndicator={false}
                style={{ gap: '10px' }}
                progressBarColor={theme.colors.background.fillBrand}
                label={__('API Usage', 'kirki-ecommerce')}
                rightText={sprintf(
                  __('%d/%d', 'kirki-ecommerce'),
                  usage?.used ?? 0,
                  usage?.total ?? 0,
                )}
              />
              <Text variant="small" color="subdued">
                {sprintf(
                  __('Resets on %s', 'kirki-ecommerce'),
                  dateFormatter(currencySettings?.next_sync_at),
                )}
              </Text>
            </Flex>
          )}
          <Card cssOverride={styles.innerDarkCard}>
            <CardContent cssOverride={styles.innerDarkContent}>
              <Flex gap={1}>
                <Text color="subdued" variant="small">
                  {__('Fallback Behavior: ', 'kirki-ecommerce')}
                </Text>
                <Text variant="small">{formatValue(apiConfig?.fallback_behaviour)}</Text>
              </Flex>
              <Flex gap={1}>
                <Text color="subdued" variant="small">
                  {__('Update Frequency: ', 'kirki-ecommerce')}
                </Text>
                <Text variant="small">{formatValue(apiConfig?.update_frequency)}</Text>
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
