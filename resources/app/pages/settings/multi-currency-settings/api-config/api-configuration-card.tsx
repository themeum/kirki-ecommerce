import { type Dispatch, type SetStateAction } from 'react';

import Button from '@/components/ui/button';
import {
  Card,
  CardContent,
} from '@/components/ui/card';
import { EditIcon, FlagIcon, RadioTickIcon } from '@/icons';
import Badge from '@/components/ui/badge';
import Flex from '@/components/ui/flex';
import ProgressBar from '@/components/ui/progressbar';
import Text from '@/components/ui/text';
import type { SettingsSectionData } from '@/types';
import { theme } from '@/theme';
import { scoped } from '@/theme/mixins';
import { __, sprintf } from '@/wpi18n';

import { dateFormatter } from '@/pages/utils';

type ApiConfigData = {
  api_key?: string;
  update_frequency?: string;
  fallback_behaviour?: string;
  is_cache_enabled?: boolean;
  [key: string]: unknown;
};

type ApiUsage = {
  used?: number | string;
  total?: number | string;
};

type ApiConfigurationCardProps = {
  selectedAPI: string;
  apiConfigObj: ApiConfigData;
  setOpenPopup: Dispatch<SetStateAction<boolean>>;
  dataObj: SettingsSectionData & {
    usage?: ApiUsage | null;
    last_sync_at?: string | null;
    next_sync_at?: string | null;
  };
};

const ApiConfigurationCard = ({
  selectedAPI,
  apiConfigObj,
  setOpenPopup,
  dataObj,
}: ApiConfigurationCardProps) => {
  const formatValue = (value: unknown) =>
    String(value ?? '')
      ?.replace(/_/g, ' ')
      .replace(/\b\w/g, (char) => char.toUpperCase()) ?? '';

  const usage = dataObj?.usage as ApiUsage | null | undefined;

  return (
    <Card>
      <CardContent>
        <Flex direction={'column'} gap={20}>
          <Flex
            style={{
              justifyContent: 'space-between',
              alignItems: 'flex-start',
            }}
          >
            <Flex direction={'column'} gap={8}>
              <Text
                type="primary"
                header={selectedAPI}
                leftIcon={<FlagIcon />}
                badge={
                  <Badge
                    text={'Configured'}
                    type="published"
                    leftIcon={<RadioTickIcon />}
                  />
                }
              />
              <Text
                subHeader={sprintf(
                  __(`Last tested: %s`, 'kirki-ecommerce'),
                  dateFormatter(dataObj?.last_sync_at as string, 'datetime'),
                )}
              />
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
            <Flex direction={'column'} gap={6}>
              <ProgressBar
                value={Number(usage?.used)}
                labelStyle={{ fontWeight: '400' }}
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
              <Text
                header={sprintf(
                  __('Resets on %s', 'kirki-ecommerce'),
                  dateFormatter(dataObj?.next_sync_at as string),
                )}
                style={{ color: theme.primitives.colors.gray12 }}
              />
            </Flex>
          )}
          <Card css={styles.innerDarkCard}>
            <CardContent css={styles.innerDarkContent}>
              <Flex gap={4}>
                <Text
                  header={__('Fallback Behavior: ', 'kirki-ecommerce')}
                  style={{ color: theme.primitives.colors.gray12 }}
                />
                <Text header={formatValue(apiConfigObj?.fallback_behaviour)} />
              </Flex>
              <Flex gap={4}>
                <Text
                  header={__('Update Frequency: ', 'kirki-ecommerce')}
                  style={{ color: theme.primitives.colors.gray12 }}
                />
                <Text header={formatValue(apiConfigObj?.update_frequency)} />
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

const styles = {
  innerDarkCard: scoped({
    borderRadius: theme.radius.sm,
    backgroundColor: theme.colors.background.surfaceSecondary,
    border: 'none',
    padding: theme.spacing[0],
  }),
  innerDarkContent: scoped({
    display: 'flex',
    flexDirection: 'column',
    gap: theme.spacing[1],
    padding: theme.spacing[2],
  }),
};
