import { Card, CardContent } from '@/components/ui/card';
import Container from '@/components/ui/container';
import Flex from '@/components/ui/flex';
import PageHeading from '@/components/ui/page-heading';
import Searchbox from '@/components/ui/searchbox';
import { theme } from '@/theme';
import { scoped } from '@/theme/mixins';
import { cardStyles } from '@/theme/card-styles';
import Text from '@/components/ui/text';
import { __ } from '@/wpi18n';

import { SettingsItem } from '@/pages/settings/settings-item';
import {
  advancedSettings,
  businessOperationSettings,
  storeManagementSettings,
  type SettingsNavItem,
} from '@/pages/settings/utils';

const Settings = () => {
  const renderSettingsSection = (
    title: string,
    settingsList: SettingsNavItem[],
  ) => (
    <Flex direction="column" gap={8}>
      <Text subHeader={title} type="xsm" />
      <Flex direction="column" gap={2} css={styles.settingsCardWrapper}>
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
        <Card css={[cardStyles.shadowCard, cardStyles.pageCard]}>
          <CardContent css={styles.pageContent}>
            <Flex direction="column" gap={24}>
              <Searchbox
                onChange={() => {
                  // @todo: will be implemented later
                }}
              />
              {renderSettingsSection('STORE MANAGEMENT', storeManagementSettings)}
              {renderSettingsSection(
                'BUSINESS OPERATION',
                businessOperationSettings,
              )}
              {renderSettingsSection('ADVANCED CONFIGURATION', advancedSettings)}
            </Flex>
          </CardContent>
        </Card>
      </Container>
    </>
  );
};

export default Settings;

const styles = {
  pageContent: scoped({
    padding: `${theme.spacing['2xl']} ${theme.spacing.lg}`,
  }),
  settingsCardWrapper: scoped({
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
        '[data-settings-identifier]': {
          opacity: 1,
          visibility: 'visible',
        },
        '[data-settings-button]': {
          opacity: 1,
          visibility: 'visible',
        },
        '[data-settings-heading]': {
          color: theme.colors.background.fillBrand,
        },
        'svg path': {
          stroke: theme.colors.background.fillBrand,
        },
      },
    },
    '&:hover > div': {
      borderRadius: theme.radius.xl,
    },
  })
};
