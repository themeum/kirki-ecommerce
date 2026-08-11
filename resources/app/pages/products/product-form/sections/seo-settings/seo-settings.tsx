import { useState } from 'react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Flex from '@/components/ui/flex';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import AEO from '@/pages/products/product-form/sections/seo-settings/aeo';
import Schema from '@/pages/products/product-form/sections/seo-settings/schema';
import SearchEngines from '@/pages/products/product-form/sections/seo-settings/search-engines';
import SocialShare from '@/pages/products/product-form/sections/seo-settings/social-share';
import { cardStyles } from '@/theme/card-styles';
import { __ } from '@/wpi18n';

const SEOSettings = () => {
  const [activeTab, setActiveTab] = useState(0);

  return (
    <Card cssOverride={cardStyles.formCard}>
      <CardHeader>
        <CardTitle>{__('AI & Web Presence', 'kirki-ecommerce')}</CardTitle>
      </CardHeader>
      <CardContent>
        <Flex direction="column" gap={4}>
          <Tabs
            value={String(activeTab)}
            onValueChange={(value) => setActiveTab(Number(value))}
          >
            <TabsList>
              <TabsTrigger value="0">
                {__('Search Engines', 'kirki-ecommerce')}
              </TabsTrigger>
              <TabsTrigger value="1">{__('AEO', 'kirki-ecommerce')}</TabsTrigger>
              <TabsTrigger value="2">
                {__('Social Share', 'kirki-ecommerce')}
              </TabsTrigger>
              <TabsTrigger value="3">
                {__('Schema', 'kirki-ecommerce')}
              </TabsTrigger>
            </TabsList>
          </Tabs>

          {activeTab === 0 && <SearchEngines />}
          {activeTab === 1 && <AEO />}
          {activeTab === 2 && <SocialShare />}
          {activeTab === 3 && <Schema />}
        </Flex>
      </CardContent>
    </Card>
  );
};

SEOSettings.displayName = 'SEOSettings';

export default SEOSettings;
