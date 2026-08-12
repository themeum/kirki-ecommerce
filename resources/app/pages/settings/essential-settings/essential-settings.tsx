import Container from '@/components/ui/container';
import Flex from '@/components/ui/flex';
import { SnowflakeIcon } from '@/icons';
import SchemaProfile from '@/pages/settings/essential-settings/schema-profile/schema-profile';
import VariationList from '@/pages/settings/essential-settings/variation-library/variation-library';
import SettingsPageHeader from '@/pages/settings/settings-page-header';
import { __ } from '@/wpi18n';

const EssentialsSettings = () => {
  return (
    <Container size="sm">
      <Flex direction="column" gap={4}>
        <SettingsPageHeader
          icon={<SnowflakeIcon />}
          title={__('Essentials', 'kirki-ecommerce')}
        />
        <VariationList />
        <SchemaProfile />
      </Flex>
    </Container>
  );
};

EssentialsSettings.displayName = 'EssentialsSettings';

export default EssentialsSettings;
