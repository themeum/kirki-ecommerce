import { type Dispatch, type SetStateAction } from 'react';

import { EditIcon, FlagIcon, RadioTickIcon } from '@/icons';
import Badge from '@/molecules/badge';
import Button from '@/molecules/button';
import Card from '@/molecules/card';
import Flex from '@/molecules/flex';
import ProgressBar from '@/molecules/progressbar';
import Text from '@/molecules/text';
import type { SettingsSectionData } from '@/types';
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
            size="icon"
            icon={<EditIcon />}
            type="outlined"
            onClick={() => setOpenPopup(true)}
          />
        </Flex>
        {usage && usage !== null && (
          <Flex direction={'column'} gap={6}>
            <ProgressBar
              value={Number(usage?.used)}
              labelStyle={{ fontWeight: '400' }}
              showProgressIndicator={false}
              style={{ gap: '10px' }}
              progressBarColor={'var(--decom-color-gray-16)'}
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
              style={{ color: 'var(--decom-color-gray-12)' }}
            />
          </Flex>
        )}
        <Card
          type="innerDark"
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 'var(--decom-spacing-1)',
            borderRadius: 'var(--decom-radius-rounded-sm)',
            padding: 'var(--decom-spacing-2)',
          }}
        >
          <Flex gap={4}>
            <Text
              header={__('Fallback Behavior: ', 'kirki-ecommerce')}
              style={{ color: 'var(--decom-color-gray-12)' }}
            />
            <Text header={formatValue(apiConfigObj?.fallback_behaviour)} />
          </Flex>
          <Flex gap={4}>
            <Text
              header={__('Update Frequency: ', 'kirki-ecommerce')}
              style={{ color: 'var(--decom-color-gray-12)' }}
            />
            <Text header={formatValue(apiConfigObj?.update_frequency)} />
          </Flex>
        </Card>
      </Flex>
    </Card>
  );
};

ApiConfigurationCard.displayName = 'ApiConfigurationCard';

export default ApiConfigurationCard;
