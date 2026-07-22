import { Card } from '@/components/ui/card';
import { CLASS_PREFIX } from '@/conf';
import Container from '@/components/ui/container';
import Flex from '@/components/ui/flex';
import PageHeading from '@/components/ui/page-heading';
import Searchbox from '@/components/ui/searchbox';
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
      <Flex
        direction="column"
        gap={2}
        className={`${CLASS_PREFIX}-settings-card-wrapper`}
      >
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
          className={`${CLASS_PREFIX}-card ${CLASS_PREFIX}-card-shadow`}
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
