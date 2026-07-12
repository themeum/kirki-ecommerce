import { SnowflakeIcon } from '@/icons';
import Container from '@/molecules/container';
import Flex from '@/molecules/flex';
import PageHeading from '@/molecules/page-heading';
import PageNavbar from '@/components/page-navbar';
import { __ } from '@/wpi18n';

import SchemaProfile from '@/pages/settings/essential-settings/schema-profile/schema-profile';
import VariationList from '@/pages/settings/essential-settings/variation-library/variation-library';

const EssentialsSettings = () => {
  return (
    <div>
      <PageHeading
        text={__('Settings', 'kirki-ecommerce')}
        size="sm"
        sticky
        type="primary"
        style={{ height: '32px' }}
      />
      <Container size="sm">
        <Flex direction="column" gap={16}>
          <PageNavbar
            textIcon={<SnowflakeIcon />}
            text={__('Essentials', 'kirki-ecommerce')}
          />
          <VariationList />
          <SchemaProfile />
        </Flex>
      </Container>
    </div>
  );
};

export default EssentialsSettings;
