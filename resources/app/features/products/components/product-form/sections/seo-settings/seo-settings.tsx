import { useState } from 'react';

import { Card, CardContent } from '@/components/ui/card';
import Flex from '@/components/ui/flex';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import SearchEngines from '@/features/products/components/product-form/sections/seo-settings/search-engines';
import SocialShare from '@/features/products/components/product-form/sections/seo-settings/social-share';
import { cardStyles } from '@/theme/card-styles';
import { __ } from '@/wpi18n';

const SEOSettings = () => {
  const [activeTab, setActiveTab] = useState(0);

  return (
    <Card cssOverride={cardStyles.formCard}>
      <CardContent>
        <Flex direction="column" gap={4}>
          <Tabs value={String(activeTab)} onValueChange={(value) => setActiveTab(Number(value))}>
            <TabsList cssOverride={{ maxWidth: '270px', width: '100%' }}>
              <TabsTrigger value="0">{__('Search Engines', 'kirki-ecommerce')}</TabsTrigger>
              <TabsTrigger value="2">{__('Social Share', 'kirki-ecommerce')}</TabsTrigger>
            </TabsList>
          </Tabs>

          {activeTab === 0 && <SearchEngines />}
          {activeTab === 2 && <SocialShare />}
        </Flex>
      </CardContent>
    </Card>
  );
};

SEOSettings.displayName = 'SEOSettings';

export default SEOSettings;
