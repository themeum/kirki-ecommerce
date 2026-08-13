import Container from '@/components/ui/container';
import Flex from '@/components/ui/flex';
import SchemaProfile from '@/features/settings/essentials/pages/schema-profile/schema-profile';
import VariationList from '@/features/settings/essentials/pages/variation-library/variation-library';
import SettingsPageHeader from '@/features/settings/pages/settings-page-header';
import { SnowflakeIcon } from '@/icons';
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
