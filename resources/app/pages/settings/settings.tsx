import { css } from '@emotion/react';

import { Card } from '@/components/ui/card';
import { CLASS_PREFIX } from '@/conf';
import Container from '@/components/ui/container';
import Flex from '@/components/ui/flex';
import PageHeading from '@/components/ui/page-heading';
import Searchbox from '@/components/ui/searchbox';
import { theme } from '@/theme';
import Text from '@/components/ui/text';
import { __ } from '@/wpi18n';

import { SettingsItem } from '@/pages/settings/settings-item';
import {
  advancedSettings,
  businessOperationSettings,
  storeManagementSettings,
  type SettingsNavItem,
} from '@/pages/settings/utils';

const settingsCardWrapperCss = css({
  alignItems: 'center',
  '> div': {
    borderRadius: theme.radius.none,
    height: '56px',
    transition: 'all 0.3s ease',
    padding: `${theme.spacing.lg} ${theme.spacing.md}`,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    '&:first-child': {
      borderTopLeftRadius: theme.radius.xl,
      borderTopRightRadius: theme.radius.xl,
    },
    '&:last-child': {
      borderBottomLeftRadius: theme.radius.xl,
      borderBottomRightRadius: theme.radius.xl,
    },
    '&:hover': {
      backgroundColor: theme.colors.background.fillSecondary,
      [`.${CLASS_PREFIX}-settings-card-identifier`]: {
        opacity: 1,
        visibility: 'visible',
      },
      [`.${CLASS_PREFIX}-settings-card-button`]: {
        opacity: 1,
        visibility: 'visible',
      },
      [`.${CLASS_PREFIX}-text-heading`]: {
        color: theme.colors.background.fillBrand,
      },
      'svg path': {
        stroke: theme.colors.background.fillBrand,
      },
    },
    [`.${CLASS_PREFIX}-settings-card-identifier`]: {
      background: theme.colors.background.fillBrand,
      height: '40px',
      width: '4px',
      position: 'absolute',
      top: '2px',
      left: '-12px',
      borderRadius: theme.radius.xl,
      opacity: 0,
      visibility: 'hidden',
      transition: 'all 0.3s ease',
    },
    [`.${CLASS_PREFIX}-settings-card-button`]: {
      opacity: 0,
      visibility: 'hidden',
      transition: 'all 0.3s ease',
    },
  },
  '&:hover > div': {
    borderRadius: theme.radius.xl,
  },
});

const Settings = () => {
  const renderSettingsSection = (
    title: string,
    settingsList: SettingsNavItem[],
  ) => (
    <Flex direction="column" gap={8}>
      <Text subHeader={title} type="xsm" />
      <Flex direction="column" gap={2} css={settingsCardWrapperCss}>
        {settingsList.map((item, index) => (
          <SettingsItem key={index} {...item} />
        ))}
      </Flex>
    </Flex>
  );

  return (
    <>
      <PageHeading
        text={__('Settings', 'kirki-ecommerce')}
        size="sm"
        sticky
        type="primary"
        style={{ height: '32px' }}
      />
      <Container size="sm">
        <Card
          type="shadow"
          style={{
            padding: 'var(--decom-spacing-4) var(--decom-spacing-3)',
            backgroundColor: 'var(--decom-background-bg-surface-secondary)',
          }}
        >
          <Flex direction="column" gap={24}>
            <Searchbox />
            {renderSettingsSection('STORE MANAGEMENT', storeManagementSettings)}
            {renderSettingsSection(
              'BUSINESS OPERATION',
              businessOperationSettings,
            )}
            {renderSettingsSection('ADVANCED CONFIGURATION', advancedSettings)}
          </Flex>
        </Card>
      </Container>
    </>
  );
};

export default Settings;
